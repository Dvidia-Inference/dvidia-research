#!/usr/bin/env python3
"""Download the complete pinned native contact audit with stdlib Python.

The published inventory is pinned; every payload must match its declared bytes
and SHA-256. No simulation or model inference occurs in this downloader.
"""
from __future__ import annotations

import argparse
from hashlib import sha256
import json
from pathlib import Path, PurePosixPath
from urllib.request import urlopen

BASE_URL = 'https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-18-native-contact-audit/audit/'
INTEGRITY_SHA256 = 'dc7b6091b1c680b9479ea65157c7d553043af688e159463db6174696ad5949fa'
MAX_FILE_BYTES = 25 * 1024 * 1024
MAX_TOTAL_BYTES = 512 * 1024 * 1024


def read_url(url, maximum):
    with urlopen(url, timeout=60) as response:
        payload = response.read(maximum + 1)
    if len(payload) > maximum:
        raise ValueError('Download exceeded its byte bound.')
    return payload


def verify_manifest(raw):
    if sha256(raw).hexdigest() != INTEGRITY_SHA256:
        raise ValueError('The published integrity inventory differs from the pinned version.')
    inventory = json.loads(raw)
    if inventory.get('schema') != 'dvidia.native-contact-audit/v1':
        raise ValueError('Unexpected evidence schema.')
    files = inventory['files']
    if not isinstance(files, dict) or not 1 <= len(files) <= 256:
        raise ValueError('Unexpected evidence file count.')
    total = 0
    for name, record in files.items():
        path = PurePosixPath(name)
        if (not name or str(path) != name or path.is_absolute() or
                '..' in path.parts or '\\' in name or ':' in name or
                name == 'integrity.json' or any(ord(char) < 32 for char in name)):
            raise ValueError('Unsafe evidence path: ' + name)
        size = record['bytes']
        digest = record['sha256']
        if type(size) is not int or not 0 <= size <= MAX_FILE_BYTES:
            raise ValueError('Evidence file exceeds its allowed size: ' + name)
        if len(digest) != 64 or any(char not in '0123456789abcdef' for char in digest):
            raise ValueError('Invalid evidence digest: ' + name)
        total += size
    if total > MAX_TOTAL_BYTES:
        raise ValueError('Evidence archive exceeds its allowed size.')
    return files


def download(output):
    raw = read_url(BASE_URL + 'integrity.json', 1024 * 1024)
    files = verify_manifest(raw)
    output = Path(output)
    output.mkdir(parents=True, exist_ok=False)
    marker = output / 'DOWNLOAD_INCOMPLETE'
    marker.write_text('Download is incomplete until every pinned file verifies.\n')
    for name, record in files.items():
        payload = read_url(BASE_URL + name, record['bytes'])
        if len(payload) != record['bytes'] or sha256(payload).hexdigest() != record['sha256']:
            raise ValueError('Evidence payload mismatch: ' + name)
        target = output / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(payload)
    (output / 'integrity.json').write_bytes(raw)
    marker.unlink()
    return len(files) + 1


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True, help='A new directory for all evidence files')
    args = parser.parse_args()
    print(f'Downloaded and verified {download(args.output)} evidence files.')
