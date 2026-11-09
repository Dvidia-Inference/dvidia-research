"""Build a small, read-only view of the sealed camera/action diagnostics.

No simulator, estimator, policy or training package is imported. Rendered RGB
files are copied byte-for-byte every tenth source frame (2.5 Hz). All 50 Hz
decision measurements are retained. This is a diagnostic subset, not a full
study audit, and cannot award qualification. Output must be a new directory.
"""
from __future__ import annotations

import argparse
from hashlib import sha256
import json
from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / 'scripts/camera-action-viewer'


def identity(raw):
    return {'bytes': len(raw), 'sha256': sha256(raw).hexdigest()}


def read(path):
    path = Path(path)
    if path.is_symlink() or not path.is_file() or path.stat().st_size > 128*1024**2:
        raise ValueError('Expected a bounded ordinary artifact.')
    return path.read_bytes()


def load(path):
    return json.loads(read(path))


def relative(root, name):
    p = Path(name)
    if p.is_absolute() or '..' in p.parts or not p.parts:
        raise ValueError('Artifact path must stay inside its recording.')
    destination = root / p
    for part in [destination, *destination.parents]:
        if part == root.parent:
            break
        if part.is_symlink():
            raise ValueError('Symlink artifact is unsupported.')
    return destination


def sealed(root, name, inventory, reference=None):
    raw = read(relative(root, name))
    actual = identity(raw)
    if inventory.get(name) != actual:
        raise ValueError('Recording inventory mismatch: ' + name)
    if reference and {k: reference[k] for k in actual} != actual:
        raise ValueError('Sidecar reference mismatch: ' + name)
    return raw


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), allow_nan=False).encode()


def build(study, audit_path, phase_path, out):
    study, out = Path(study), Path(out)
    if out.exists():
        raise ValueError('Choose a new output directory; evidence is never overwritten.')
    audit, phase = load(audit_path), load(phase_path)
    protocol_raw = read(study/'protocol.json')
    protocol = json.loads(protocol_raw)
    registration = load(study/'registration.json')
    protocol_sha = identity(protocol_raw)['sha256']
    if registration['protocol_sha256'] != protocol_sha:
        raise ValueError('Protocol no longer matches registration.')
    if (audit.get('schema') != 'dvidia.camera-action-diagnostic-audit/v1'
            or audit.get('passed') is not True or audit.get('attempts_verified') != 4):
        raise ValueError('A passing four-case diagnostic audit is required.')
    if (phase.get('diagnostic_audit_sha256') != identity(read(audit_path))['sha256']
            or phase.get('protocol_sha256') != protocol_sha):
        raise ValueError('Phase analysis and audit binding do not match.')
    stage_raw = read(study/'stages/diagnostic.json')
    stage = json.loads(stage_raw)
    expected = {row['id'] for row in protocol['rosters']['diagnostic']}
    if (stage.get('status') != 'complete' or len(stage['rows']) != 4
            or {row['id'] for row in stage['rows']} != expected):
        raise ValueError('Only the complete registered diagnostic stage is supported.')
    by_audit = {row['case_id']: row for row in audit['results']}
    by_phase = {row['case_id']: row for row in phase['results']}
    out.mkdir(parents=True)
    cases = []
    for row in stage['rows']:
        case_id = row['case']['id']
        if not re.fullmatch(r'[a-z0-9-]+', case_id):
            raise ValueError('Unexpected case identifier.')
        episode = relative(study, row['path'])
        if (identity(read(episode/'integrity.json'))['sha256'] != row['integrity_sha256']
                or identity(read(episode/'rollout.json'))['sha256'] != row['receipt_sha256']
                or by_phase[case_id]['integrity_sha256'] != row['integrity_sha256']):
            raise ValueError('Episode differs from its sealed stage or phase audit.')
        inventory = load(episode/'integrity.json')['files']
        recording_raw = sealed(episode, 'recording.json', inventory)
        recording = json.loads(recording_raw)
        if recording['control_mode'] != 'teacher' or len(recording['steps']) != 1000:
            raise ValueError('Expected a complete authored teacher diagnostic.')
        frames, rows, previous = {}, [], None
        for step in recording['steps']:
            before = step['before']; camera = before['camera']; frame = camera['value']
            estimate_doc = json.loads(sealed(episode, step['perception']['path'], inventory, step['perception']))
            query = json.loads(sealed(episode, step['teacher_query']['path'], inventory, step['teacher_query']))
            snapshot_sha = sha256(canonical(before)).hexdigest()
            if (estimate_doc['snapshot_sha256'] != snapshot_sha or query['snapshot_sha256'] != snapshot_sha
                    or estimate_doc['index'] != step['index'] or query['index'] != step['index']):
                raise ValueError('Observation/phase is not bound to the displayed decision.')
            if frame['index'] % 10 == 0 and frame['index'] not in frames:
                ref = frame['rgb']; raw = sealed(episode, ref['path'], inventory, ref)
                name = f'frames/{case_id}/{frame["index"]:04}.png'
                dest = out/name; dest.parent.mkdir(parents=True, exist_ok=True); dest.write_bytes(raw)
                previous = dict(path=name, index=frame['index'], time=camera['captured_at_seconds'],
                                source_path=ref['path'], **identity(raw))
                frames[frame['index']] = previous
            if previous is None:
                raise ValueError('Initial RGB sample is required.')
            signals = before['signals']; issued = step['command']['issued']; applied = step['applied']['ramped_targets']
            estimate = estimate_doc['estimate']
            rows.append(dict(time=before['timestamp_seconds'], frame=previous['index'],
                frame_time=previous['time'], camera_source_time=camera['captured_at_seconds'],
                camera_age=estimate['age_seconds'], available=estimate['status'] == 'available',
                reason=estimate.get('reason'), phase=query['phase'], authority=step['command']['authority'],
                measured=signals['joint_position_rad']['value']+[signals['gripper_joint_position_m']['value'][0]],
                issued=issued['joint_targets_rad']+[issued['gripper_position_m']],
                applied=applied['joint_targets_rad']+[applied['gripper_position_m']],
                interval_end=step['applied']['interval_end_seconds']))
        # Include the last camera pair as evidence, without fabricating a 1001st action.
        final_camera = recording['steps'][-1]['after']['camera']; final_frame = final_camera['value']
        ref = final_frame['rgb']; raw = sealed(episode, ref['path'], inventory, ref)
        name = f'frames/{case_id}/{final_frame["index"]:04}.png'
        (out/name).write_bytes(raw)
        frames[final_frame['index']] = dict(path=name, index=final_frame['index'],
            time=final_camera['captured_at_seconds'], source_path=ref['path'], **identity(raw))
        result = by_audit[case_id]
        cases.append(dict(id=case_id, group=row['case']['group_id'], goal_id=row['case']['goal_id'],
            strict_success=result['strict_success'], integrity_sha256=row['integrity_sha256'],
            recording_sha256=identity(recording_raw)['sha256'], source_episode=row['path'],
            initial_anchor_error_m=result['initial_anchor_error_m'],
            longest_missing_seconds=result['perception']['longest_missing_seconds'],
            frames=list(frames.values()), rows=rows))
    # Keep publication status explicit. Never infer final results from partial stages.
    data = dict(schema='dvidia.camera-action-diagnostic-viewer/v1', status='diagnostic-only',
        result_status='pending', qualified_skill=False, physical_robot_ready=False,
        protocol_sha256=protocol_sha, diagnostic_stage_sha256=identity(stage_raw)['sha256'],
        camera_source_hz=25, display_rgb_hz=2.5, motor_hz=50, cases=cases,
        scope='Four sealed authored-teacher diagnostics; no student results or live simulation.',
        builder_sha256=identity(read(__file__))['sha256'])
    for source, name in [(audit_path,'diagnostic-audit.json'), (phase_path,'diagnostic-phase-coverage.json'),
                         (study/'protocol.json','protocol.json'), (study/'stages/diagnostic.json','diagnostic-stage.json')]:
        (out/name).write_bytes(read(source))
    for name in ('index.html','viewer.css','viewer.js'):
        shutil.copyfile(TEMPLATE/name, out/name)
    shutil.copyfile(ROOT/'docs/assets/paper-grain.svg', out/'paper-grain.svg')
    shutil.copyfile(ROOT/'LICENSE-CODE', out/'LICENSE-CODE')
    licenses = out/'licenses/agilex_piper'; licenses.mkdir(parents=True)
    for name in ('LICENSE','README.md'):
        shutil.copyfile(ROOT/'topics/physical-grounding/runs/2026-10-30-usd-workstation-v01/licenses/agilex_piper'/name, licenses/name)
    (out/'evidence.json').write_bytes(canonical(data)+b'\n')
    # Embedded data allows opening this viewer locally without a server or fetch.
    (out/'evidence.js').write_text('window.DVIDIA_CAMERA_EVIDENCE='+canonical(data).decode().replace('<','\\u003c')+';\n')
    manifest = {str(p.relative_to(out)): identity(read(p)) for p in sorted(out.rglob('*')) if p.is_file()}
    (out/'viewer-integrity.json').write_bytes(canonical(dict(schema='dvidia.static-evidence-integrity/v1',
        files=manifest, scope='Display subset only; full source inventory remains in the original study.'))+b'\n')
    return dict(cases=len(cases), frames=sum(len(x['frames']) for x in cases),
                decisions=sum(len(x['rows']) for x in cases), bytes=sum(x['bytes'] for x in manifest.values()))


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('study'); p.add_argument('--audit', required=True)
    p.add_argument('--phases', required=True); p.add_argument('--out', required=True)
    args = p.parse_args()
    print(json.dumps(build(args.study,args.audit,args.phases,args.out)))
