#!/usr/bin/env python3
"""Verify migrated source provenance and independent product boundaries."""
import hashlib
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / "source-manifest.json").read_text())
source = Path(manifest["source_root"])
errors = []
for record in manifest["files"]:
    target = root / record["destination"]
    if not target.is_file():
        errors.append(f"Missing destination: {target}")
    if source.is_dir():
        original = source / record["source"]
        if not original.is_file() or hashlib.sha256(original.read_bytes()).hexdigest() != record["sha256"]:
            errors.append(f"Source changed: {original}")
    if record["source"] in ("LICENSE", "NOTICE"):
        if hashlib.sha256(target.read_bytes()).hexdigest() != record["sha256"]:
            errors.append(f"Original legal notice changed: {target}")

skip = {"node_modules", ".git", "data", "secrets"}
allowed = {"source-manifest.json", "NOTICE", "docs/MIGRATION.md", "scripts/verify-migration.py", "internal/gateway/branding_test.go"}
count = 0
for file in root.rglob("*"):
    rel = file.relative_to(root)
    if not file.is_file() or any(part in skip for part in rel.parts) or rel.parts[0] == "dist":
        continue
    if rel.as_posix() in allowed or file.suffix in (".tsbuildinfo", ".pyc"):
        continue
    try:
        text = file.read_text()
    except UnicodeDecodeError:
        continue
    count += 1
    if re.search(r"open[ _-]?swift[ _-]?scale", text, re.I):
        errors.append(f"Legacy brand identifier: {rel}")
    if file.suffix == ".go" and re.search(r'"[^"\n]*openscaler-(?:backend|gateway|infra)/', text):
        errors.append(f"Cloud source dependency: {rel}")
    if file.name == "go.mod" and re.search(r"^replace\s", text, re.M):
        errors.append("Go module has a replace dependency")

if errors:
    raise SystemExit("\n".join(errors))
print(f"PASS: {len(manifest['files'])} input mappings, original LICENSE/NOTICE, {count} text files, module boundaries")
print("Source hashes verified." if source.is_dir() else "Source checkout unavailable; original input hashes not rechecked.")
