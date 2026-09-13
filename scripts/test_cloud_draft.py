import importlib.util
import json
import stat
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("cloud_draft", Path(__file__).with_name("cloud-draft.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CloudDraftTests(unittest.TestCase):
    def test_selected_contract_and_dedicated_credential(self):
        manifest = dict(schema="openscaler.supply.v1", state="active", capabilities=["chat"],
                        model_id="m", provider="operator", region="local", base_url="https://supply.example/supply/id",
                        chat_path="/v1/chat/completions", input_per_million=1, output_per_million=2, max_concurrency=1,
                        private_endpoint="must-not-upload", upstream_key="must-not-upload")
        payload = module.payload_from_manifest(manifest, "osc_supply_test")
        self.assertEqual(set(payload), {"model_id", "provider", "region", "base_url", "chat_path", "input_per_million", "output_per_million", "max_concurrency", "throughput_tps", "credential"})
        self.assertNotIn("must-not-upload", json.dumps(payload))
        with self.assertRaises(ValueError):
            module.payload_from_manifest(manifest, "upstream-key")
        manifest["capabilities"] = ["speech"]
        with self.assertRaises(ValueError):
            module.payload_from_manifest(manifest, "osc_supply_test")

    def test_uncertain_post_is_not_retried_and_receipt_is_private(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            manifest = dict(schema="openscaler.supply.v1", state="active", publication_id="test", capabilities=["chat"],
                            model_id="m", provider="operator", region="local", base_url="https://supply.example/supply/id",
                            chat_path="/v1/chat/completions", input_per_million=1, output_per_million=2, max_concurrency=1)
            (folder / "manifest.json").write_text(json.dumps(manifest))
            (folder / "key").write_text("osc_supply_test")
            (folder / "session").write_text("synthetic-session")
            argv = ["cloud-draft.py", "--manifest", str(folder / "manifest.json"), "--credential-file", str(folder / "key"), "--session-file", str(folder / "session"), "--cloud-url", "https://cloud.example", "--receipt", str(folder / "receipt"), "--authorize-upload"]
            with patch.object(sys, "argv", argv), patch.object(module.urllib.request, "build_opener") as build:
                build.return_value.open.side_effect = OSError("timeout")
                with self.assertRaises(SystemExit):
                    module.main()
                with self.assertRaises(FileExistsError):
                    module.main()
                self.assertEqual(build.return_value.open.call_count, 1)
            receipt = folder / "receipt"
            self.assertEqual(stat.S_IMODE(receipt.stat().st_mode), 0o600)
            self.assertEqual(json.loads(receipt.read_text())["state"], "unknown")
            self.assertNotIn("synthetic-session", receipt.read_text())
            self.assertNotIn("osc_supply_test", receipt.read_text())


if __name__ == "__main__":
    unittest.main()
