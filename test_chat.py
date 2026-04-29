#!/usr/bin/env python
import requests
import json
import time

# Wait for server
time.sleep(2)

url = 'http://localhost:8002/api/v1/chat'
data = {'message': 'Help me study JavaScript'}
headers = {'Content-Type': 'application/json'}

print("Testing POST /api/v1/chat...")
try:
    response = requests.post(url, json=data, headers=headers, timeout=30)
    print(f"Status Code: {response.status_code}")
    print("Response:")
    print(json.dumps(response.json(), indent=2))
    
    if response.status_code == 200:
        conversation_id = response.json().get('conversation_id')
        if conversation_id:
            print(f"\n✅ Conversation created: {conversation_id}")
            print("\nTesting GET /api/v1/chat/{conversation_id}...")
            history_url = f'http://localhost:8002/api/v1/chat/{conversation_id}'
            history_response = requests.get(history_url, timeout=30)
            print(f"History Status Code: {history_response.status_code}")
            print("History:")
            print(json.dumps(history_response.json(), indent=2))
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
