from pathlib import Path
import sys

BACKEND_ROOT = Path(__file__).resolve().parents[1] / "backend"
backend_root_str = str(BACKEND_ROOT)
if backend_root_str not in sys.path:
    sys.path.insert(0, backend_root_str)

from app.main import app

routes = [(r.path, sorted(list(r.methods or []))) for r in app.routes]
for path, methods in routes:
    if path.startswith('/goals'):
        print(path, methods)
print('\nAll /goals routes printed')
