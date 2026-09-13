#!/usr/bin/env python3
"""Explicitly submit a selected OSS publication as a Cloud supplier draft.
Never submits a test consent, enables real traffic, or transfers upstream credentials.
"""
import argparse
import hashlib
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def payload_from_manifest(manifest, credential):
    if manifest.get("schema") != "openscaler.supply.v1" or manifest.get("state") != "active":
        raise ValueError("An active openscaler.supply.v1 manifest is required")
    if "chat" not in manifest.get("capabilities", []):
        raise ValueError("The current Cloud draft adapter requires chat capability; other APIs remain locally callable")
    if not credential.startswith("osc_supply_"):
        raise ValueError("Use the dedicated publication credential, never an upstream or private Gateway key")
    fields = ["model_id", "provider", "region", "base_url", "chat_path", "input_per_million", "output_per_million", "max_concurrency"]
    payload = {field: manifest[field] for field in fields}
    payload.update(throughput_tps=0, credential=credential)
    return payload


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--credential-file", required=True, type=Path)
    parser.add_argument("--cloud-url", required=True)
    parser.add_argument("--session-file", required=True, type=Path, help="File containing your Cloud oss_session cookie value")
    parser.add_argument("--receipt", required=True, type=Path, help="New private local receipt file; never reuse after uncertain submission")
    parser.add_argument("--authorize-upload", action="store_true", help="Explicitly authorize sending selected service metadata and its dedicated credential")
    args = parser.parse_args()
    if not args.authorize_upload:
        parser.error("Review the manifest and pass --authorize-upload to submit a draft")
    url = urllib.parse.urlsplit(args.cloud_url)
    if url.scheme != "https" or not url.netloc or url.username or url.password or url.query or url.fragment or url.path not in ("", "/"):
        parser.error("Cloud URL must be an HTTPS origin without credentials")
    manifest = json.loads(args.manifest.read_text())
    credential = args.credential_file.read_text().strip()
    session = args.session_file.read_text().strip()
    if not session or any(c in session for c in "\r\n;"):
        parser.error("Session file must contain a single cookie value")
    payload = payload_from_manifest(manifest, credential)
    raw = json.dumps(payload).encode()
    # Reserve a receipt before the non-idempotent Cloud POST. Existing receipts block
    # accidental resubmission, including network timeouts and process interruption.
    record = {"publication_id": manifest["publication_id"], "cloud_url": args.cloud_url, "state": "unknown", "manifest_sha256": hashlib.sha256(args.manifest.read_bytes()).hexdigest()}
    fd = os.open(args.receipt, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "w") as receipt:
        json.dump(record, receipt, indent=2); receipt.flush(); os.fsync(receipt.fileno())
    request = urllib.request.Request(args.cloud_url.rstrip("/") + "/api/provider/v1/submissions", data=raw, headers={"Content-Type": "application/json", "Cookie": "oss_session=" + session})
    opener = urllib.request.build_opener(NoRedirect())
    try:
        with opener.open(request, timeout=30) as response:
            result = json.loads(response.read(1 << 20))
            if response.status != 201 or not isinstance(result, dict) or not result.get("id"):
                raise ValueError("Cloud did not return a recognizable created draft")
        record.update(state="draft_created", submission_id=result["id"])
        # Do not persist the remote response, which may contain unrelated private fields.
        with args.receipt.open("w") as receipt:
            json.dump(record, receipt, indent=2); receipt.flush(); os.fsync(receipt.fileno())
        print("Cloud supplier draft created: " + str(result["id"]))
        print("Complete provenance, consent and review in Cloud. This command does not start tests or trading.")
    except Exception:
        print("Submission outcome may be unknown. Inspect Cloud submissions and the local receipt before any new POST. No automatic retry was performed.", file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
