"""Exercise the installed fixture with Python socket operations explicitly denied."""
import json
from pathlib import Path
import runpy
import socket
import sys

attempts = []
original_socket = socket.socket


def deny(name):
    def blocked(*args, **kwargs):
        attempts.append(name)
        raise RuntimeError(f"offline check denies {name}")
    return blocked


class DeniedSocket(original_socket):
    def __init__(self, *args, **kwargs):
        attempts.append("socket.socket")
        raise RuntimeError("offline check denies socket.socket")


socket.socket = DeniedSocket
socket.create_connection = deny("socket.create_connection")
socket.getaddrinfo = deny("socket.getaddrinfo")
try:
    socket.create_connection(("127.0.0.1", 9))
except RuntimeError:
    pass
else:
    raise AssertionError("socket denial guard did not work")
attempts.clear()

destination = Path("results/offline-check")
sys.argv = ["bench.py", "--output", str(destination), "--repeats", "1", "--verify"]
code = 0
try:
    runpy.run_path(str(Path(__file__).with_name("bench.py")), run_name="__main__")
except SystemExit as exc:
    code = exc.code or 0
policy = dict(exit_code=code, blocked_operations=["socket.socket", "socket.create_connection", "socket.getaddrinfo"],
              attempted_operations=attempts, guard_self_test_passed=True,
              scope="Python socket construction, connection helpers and DNS only; native C network calls are not intercepted",
              packages_preinstalled=True, air_gapped_wheel_install_tested=False)
destination.mkdir(parents=True, exist_ok=True)
(destination / "socket-policy.json").write_text(json.dumps(policy, indent=2) + "\n")
raise SystemExit(code)
