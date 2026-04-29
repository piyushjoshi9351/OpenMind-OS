import requests, json
r = requests.get('http://localhost:8002/openapi.json', timeout=10)
if r.status_code != 200:
    print('Failed to fetch openapi.json', r.status_code)
else:
    data = r.json()
    paths = data.get('paths', {})
    for path in sorted(paths.keys()):
        if path.startswith('/goals'):
            print(path, list(paths[path].keys()))
    
    print('\nFull /goals path entry:')
    print(json.dumps(paths.get('/goals', {}), indent=2))
