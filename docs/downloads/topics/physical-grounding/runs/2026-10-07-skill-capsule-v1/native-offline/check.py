import ctypes,errno,json,socket,struct,sys
from pathlib import Path
sys.path.insert(0,str(Path.cwd()))
from simlab.capsule_installer import install_capsule,capsule_worker,canonical
from simlab.arm_runner import validate_scene
libc=ctypes.CDLL(None,use_errno=True)
fd=libc.socket(2,1,0)
address=bytes([16,2])+struct.pack('!H',9)+socket.inet_aton('127.0.0.1')+bytes(8)
rc=libc.connect(fd,address,len(address)); error=ctypes.get_errno(); libc.close(fd)
assert rc==-1 and error==errno.EPERM,(rc,error)
root=Path(sys.argv[1])
if root.exists():
    raise ValueError('Choose a new output directory.')
record=install_capsule(Path('simlab/placement_candidate.skill.json').read_bytes(),root/'installed')
scene=validate_scene(None)
qualified=capsule_worker(root/'installed',record['installation_id'],scene,root/'qualification',qualify=True)
assert qualified['local_qualification']['status']=='validated_simulation_scene',qualified['local_qualification']
repeated=capsule_worker(root/'installed',record['installation_id'],scene,root/'repeat')
assert repeated['summary']['successes']==1
receipt={'passed':True,'native_network_denial':{'connection_return':rc,'errno':error,'expected_errno':errno.EPERM},'capsule_sha256':record['capsule_sha256'],'qualification_status':qualified['local_qualification']['status'],'student_success':True,'open_jaw_control_success':False,'repeat_success':True,'physical_robot_ready':False,'scope':'Installed-runtime native macOS network denial; one known scene and repeat, preinstalled dependencies; no air-gapped installation or unseen capability claim.'}
(root/'native-policy.json').write_bytes(canonical(receipt))
print(json.dumps(receipt))
