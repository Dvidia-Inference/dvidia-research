import argparse
import json
from pathlib import Path
import tempfile
import unittest
import zipfile
from simlab.pack import export_pack, verify_pack
from simlab.cli import NetworkGuard, parse_seeds


class PackTests(unittest.TestCase):
    def fixture(self, root):
        payload = {'config': {'force_limit': .25}, 'episodes': [{'seed':100,'success':True}]}
        target = Path(root)/'pack.zip'
        export_pack(target, payload, {'kp':4.})
        return target

    def test_hash_verification_detects_modified_policy(self):
        with tempfile.TemporaryDirectory() as root:
            target = self.fixture(root)
            self.assertEqual(verify_pack(target)['qualification']['successes'], 1)
            with zipfile.ZipFile(target) as archive:
                files = {name:archive.read(name) for name in archive.namelist()}
            files['policy.json'] = b'{"kp":999}\n'
            with zipfile.ZipFile(target, 'w') as archive:
                for name, data in files.items():
                    archive.writestr(name,data)
            with self.assertRaisesRegex(ValueError,'hash mismatch'):
                verify_pack(target)

    def test_manifest_counts_cannot_disagree_with_evidence(self):
        with tempfile.TemporaryDirectory() as root:
            target = self.fixture(root)
            with zipfile.ZipFile(target) as archive:
                files = {name:archive.read(name) for name in archive.namelist()}
            manifest = json.loads(files['manifest.json'])
            manifest['qualification']['successes'] = 99
            files['manifest.json'] = json.dumps(manifest).encode()
            with zipfile.ZipFile(target, 'w') as archive:
                for name,data in files.items():
                    archive.writestr(name,data)
            with self.assertRaisesRegex(ValueError,'count mismatch'):
                verify_pack(target)

    def test_offline_guard_blocks_and_restores_python_networking(self):
        import socket
        original = socket.socket
        with NetworkGuard(True) as guard:
            self.assertEqual(guard.attempts, [])
            with self.assertRaisesRegex(RuntimeError,'denied'):
                socket.socket()
            self.assertEqual(guard.attempts, ['socket'])
        self.assertIs(socket.socket, original)

    def test_eval_seed_input_is_frozen_and_unique(self):
        self.assertEqual(parse_seeds('100,101,102'), [100,101,102])
        for bad in ['-1','1,1','abc','']:
            with self.assertRaises(argparse.ArgumentTypeError):
                parse_seeds(bad)


if __name__ == '__main__':
    unittest.main()
