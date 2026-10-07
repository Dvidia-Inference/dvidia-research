"""Meaningful protocol integrity, old-source isolation and physical control checks."""
from pathlib import Path
import tempfile
import unittest

from simlab import arm_benchmark as benchmark


class ArmBenchmarkTests(unittest.TestCase):
    def test_frozen_cases_cover_declared_range_and_are_disjoint(self):
        protocol=benchmark.make_protocol()
        self.assertEqual(len(protocol['dev']),20)
        self.assertEqual(len(protocol['heldout']),32)
        layouts=lambda rows:{tuple(c['config']['object_position']+c['config']['target_position']) for c in rows}
        self.assertTrue(layouts(protocol['dev']).isdisjoint(layouts(protocol['heldout'])))
        self.assertEqual(len(layouts(protocol['heldout'])),32)
        self.assertTrue(all(c['config']['scene_jitter']==0 for c in protocol['dev']+protocol['heldout']))
        sizes={2*x for c in protocol['dev'] for x in c['config']['object_half_size']}
        self.assertTrue({.03,.04,.05}.issubset(sizes))
        masses={c['config']['object_mass'] for c in protocol['dev']}
        self.assertTrue({.02,.08}.issubset(masses))

    def test_protocol_and_source_mutation_are_rejected(self):
        with tempfile.TemporaryDirectory() as name:
            root=Path(name)
            benchmark.initialize(root)
            path=root/'protocol.json'
            path.write_text(path.read_text()+' ')
            with self.assertRaisesRegex(ValueError,'protocol bytes changed'):
                benchmark.read_protocol(root)
            source=root/'snapshots/v0/arm_policy.py'
            source.write_text(source.read_text()+'\n# tampered\n')
            with self.assertRaisesRegex(ValueError,'integrity failure'):
                benchmark.load_snapshot(root,'v0')

    def test_snapshot_modules_do_not_import_live_environment(self):
        with tempfile.TemporaryDirectory() as name:
            benchmark.initialize(name)
            env,policy,_=benchmark.load_snapshot(name,'v0')
            self.assertTrue(env.__name__.startswith('_frozen_arm_'))
            self.assertEqual(env.ArmConfig.__module__,env.__name__)
            self.assertNotEqual(env.ArmEnv.__module__,'simlab.arm_env')
            self.assertTrue(policy.__name__.startswith('_frozen_arm_'))
            for case in benchmark.make_protocol()['dev']+benchmark.make_protocol()['heldout']:
                env.ArmConfig(**case['config'])
            probes=benchmark.rejection_checks(benchmark.make_protocol()['rejection_probes'],env)
            self.assertTrue(all(p['passed'] for p in probes))

    def test_heldout_cannot_run_through_development_api(self):
        with self.assertRaisesRegex(ValueError,'requires freeze-final'):
            benchmark.evaluate('v0',split='heldout')

    def test_wilson_boundary_counts_and_paired_cases(self):
        self.assertAlmostEqual(benchmark.wilson(0,32)[1],.10717919825507065)
        self.assertAlmostEqual(benchmark.wilson(32,32)[0],.8928208017449294)
        a=[{'case_id':'x','group':'nominal','case_sha256':'frozen','success':False}]
        b=[{**a[0],'success':True}]
        self.assertEqual(benchmark.paired_outcomes(a,b)['improved'],1)
        with self.assertRaisesRegex(ValueError,'configuration differs'):
            benchmark.paired_outcomes(a,[{**b[0],'case_sha256':'changed'}])

    def test_final_freeze_rejects_weakened_success_before_creating_final(self):
        with tempfile.TemporaryDirectory() as name:
            root=Path(name)/'run';source=Path(name)/'source';source.mkdir()
            for filename in benchmark.SOURCE_FILES:
                (source/filename).write_bytes((Path('simlab')/filename).read_bytes())
            benchmark.initialize(root,source)
            path=source/'arm_env.py'
            path.write_text(path.read_text().replace('lift>=.055','lift>=.054'))
            with self.assertRaisesRegex(ValueError,'changed frozen physics'):
                benchmark.freeze_final(root=root,source=source)
            self.assertFalse((root/'snapshots/final').exists())

    def test_native_contact_pickup_has_real_open_jaw_negative(self):
        # One in-memory real engine episode plus exact joint-target replay.
        with tempfile.TemporaryDirectory() as name:
            benchmark.initialize(name)
            env,policy,_=benchmark.load_snapshot(name,'v0')
            case=benchmark.make_protocol()['dev'][0]
            row,tape=benchmark.run_case(case,env,policy)
            self.assertTrue(row['success'])
            self.assertGreater(row['metrics']['retained_lift_control_samples'],0)
            self.assertEqual(row['model'],{'nq':15,'nv':14,'nu':8,'nmocap':0,'neq':0})
            self.assertNotIn('trace',row)
            negative,_=benchmark.run_case(case,env,policy,control='replay_open_jaw',action_tape=tape)
            self.assertFalse(negative['success'])
            self.assertFalse(negative['final_info']['grasp_seen'])
            self.assertLess(negative['metrics']['max_object_displacement_m'],1e-5)
            self.assertFalse(negative['warning_counts'])


if __name__=='__main__':unittest.main()
