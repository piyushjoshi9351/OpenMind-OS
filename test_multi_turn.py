#!/usr/bin/env python
import requests
import json

conv_id = '56a3aa3a92d748fab0fd52c968855f82'

# Send follow-up message
print("Sending follow-up message...")
resp = requests.post('http://localhost:8002/api/v1/chat', 
    json={'message': 'I want to learn programming', 'conversation_id': conv_id},
    timeout=45)
print('Follow-up Status:', resp.status_code)
data = resp.json()
print('Assistant response (first 200 chars):')
print(data.get('assistant_message', '')[:200])

# Retrieve full history
print("\n" + "="*60)
print("Retrieving conversation history...")
hist = requests.get(f'http://localhost:8002/api/v1/chat/{conv_id}', timeout=10)
print(f'Status: {hist.status_code}')
messages = hist.json()['messages']
print(f'Total messages in conversation: {len(messages)}')
print("\nAll messages:")
for i, msg in enumerate(messages, 1):
    print(f"\n{i}. [{msg['role'].upper()}]")
    print(f"   Content: {msg['content'][:100]}...")
    print(f"   Created: {msg['created_at']}")
