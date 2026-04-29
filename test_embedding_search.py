import requests, json, time

# create a goal
payload={'title':'Learn Python', 'description':'Complete a basic Python course and build small projects.'}
resp = requests.post('http://localhost:8002/goals', json=payload, timeout=30)
print('Create status', resp.status_code)
print(resp.json())
# wait a second
time.sleep(1)
# search
q='learn python'
sr = requests.get('http://localhost:8002/goals/search/', params={'q':q}, timeout=30)
print('Search status', sr.status_code)
print(json.dumps(sr.json(), indent=2))
