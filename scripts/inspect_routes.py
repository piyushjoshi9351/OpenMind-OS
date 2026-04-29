from app.main import app

routes = [(r.path, sorted(list(r.methods or []))) for r in app.routes]
for path, methods in routes:
    if path.startswith('/goals'):
        print(path, methods)
print('\nAll /goals routes printed')
