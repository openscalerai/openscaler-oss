#!/usr/bin/env python3
"""Run a disposable standalone gateway against local mock inference only."""
import base64
import json
import os
import socket
import subprocess
import tempfile
import threading
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

root = Path(__file__).resolve().parents[1]
calls = []


class Upstream(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def do_POST(self):
        payload = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        calls.append((self.path, payload["model"], self.headers.get("Authorization")))
        status = 503 if self.path.startswith("/primary/") else 200
        body = json.dumps({"id": "mock", "object": "chat.completion", "model": payload["model"],
                           "choices": [{"index": 0, "message": {"role": "assistant", "content": "local-ok"}, "finish_reason": "stop"}],
                           "usage": {"prompt_tokens": 3, "completion_tokens": 2, "total_tokens": 5}}).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


upstream = ThreadingHTTPServer(("127.0.0.1", 0), Upstream)
threading.Thread(target=upstream.serve_forever, daemon=True).start()
try:
    with tempfile.TemporaryDirectory(prefix="openscaler-oss-smoke-") as tmp:
        folder = Path(tmp)
        with socket.socket() as sock:
            sock.bind(("127.0.0.1", 0))
            port = sock.getsockname()[1]
        base = f"http://127.0.0.1:{port}"
        catalog = "providers:\n"
        for provider in ("primary", "backup"):
            catalog += f"  - id: {provider}\n    type: openai-compatible\n    base_url: http://127.0.0.1:{upstream.server_port}/{provider}\n    chat_path: /v1/chat/completions\n"
        catalog += "models:\n"
        for priority, provider in enumerate(("primary", "backup"), 1):
            catalog += f"  - id: smoke-model\n    provider: {provider}\n    upstream_model: smoke-model\n    capabilities: [chat]\n    priority: {priority}\n"
        (folder / "catalog.yaml").write_text(catalog)
        env = {key: value for key, value in os.environ.items() if not key.startswith("OPENSCALER_")}
        env.update({
            "OPENSCALER_LISTEN_ADDR": f"127.0.0.1:{port}",
            "OPENSCALER_PUBLIC_URL": base,
            "OPENSCALER_DATABASE_PATH": str(folder / "openscaler.db"),
            "OPENSCALER_MASTER_KEY_PATH": str(folder / "master.key"),
            "OPENSCALER_CATALOG_PATH": str(folder / "catalog.yaml"),
            "OPENSCALER_API_KEYS": "smoke-client-key",
            "OPENSCALER_ADMIN_PASSWORD": "smoke-admin-password",
            "OPENSCALER_PRIMARY_API_KEY": "smoke-provider-key",
            "OPENSCALER_BACKUP_API_KEY": "smoke-provider-key",
            "OPENSCALER_RATE_LIMIT_RPM": "0",
        })
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))

        def request(path, auth=None, data=None, method=None):
            headers = {"Authorization": auth} if auth else {}
            if data is not None:
                headers["Content-Type"] = "application/json"
            req = urllib.request.Request(base + path, headers=headers, data=json.dumps(data).encode() if data else None, method=method)
            try:
                response = opener.open(req, timeout=3)
            except urllib.error.HTTPError as error:
                response = error
            with response:
                return response.status, response.headers, response.read()

        with (folder / "gateway.log").open("w+") as log:
            process = subprocess.Popen([str(root / "dist/openscaler")], env=env, stdout=log, stderr=log)
            try:
                for _ in range(100):
                    if process.poll() is not None:
                        log.seek(0)
                        raise RuntimeError(log.read())
                    try:
                        if request("/readyz")[0] == 200:
                            break
                    except (OSError, urllib.error.URLError):
                        pass
                    time.sleep(0.1)
                else:
                    raise RuntimeError("Gateway did not become ready")
                assert calls == [], "Startup must not call providers"
                for path, marker in [("/", b"OpenScaler"), ("/openscaler-logo.svg", b"OpenScaler logo"), ("/docs/API.md", b"X-OpenScaler-"), ("/metrics", b"openscaler_requests_total")]:
                    status, headers, body = request(path)
                    assert status == 200 and marker in body and headers.get("X-OpenScaler-Request-ID"), path
                assert request("/v1/models")[0] == 401
                assert request("/api/admin/status", "Bearer smoke-client-key")[0] == 401
                admin = "Basic " + base64.b64encode(b"admin:smoke-admin-password").decode()
                status = json.loads(request("/api/admin/status", admin)[2])
                assert status["name"] == "OpenScaler" and status["telemetry"] is False and status["prompt_logging"] is False
                settings = json.loads(request("/api/admin/model-routes/smoke-model", admin)[2])
                settings.update(use_platform_default=False, routing_mode="failover")
                settings["endpoints"].sort(key=lambda endpoint: endpoint["provider_id"] != "primary")
                result = request("/api/admin/model-routes/smoke-model", admin, settings, method="PATCH")
                assert result[0] == 200, result[2]
                client = "Bearer smoke-client-key"
                assert json.loads(request("/v1/models", client)[2])["data"][0]["id"] == "smoke-model"
                status, headers, body = request("/v1/chat/completions", client, {"model": "smoke-model", "messages": [{"role": "user", "content": "test"}]})
                assert status == 200, body
                assert json.loads(body)["choices"][0]["message"]["content"] == "local-ok"
                assert headers["X-OpenScaler-Provider"] == "backup"
                assert len(calls) == 2 and calls[0][0].startswith("/primary/") and calls[1][0].startswith("/backup/"), calls
                assert all(model == "smoke-model" and key == "Bearer smoke-provider-key" for _, model, key in calls), calls
                print("PASS: fresh standalone process, SQLite readiness, embedded UI/docs/logo, auth separation, metrics, local mock same-model failover and new-brand headers; no Cloud services configured.")
            finally:
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait()
finally:
    upstream.shutdown()
    upstream.server_close()
