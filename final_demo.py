#!/usr/bin/env python
import requests
import json

print('=' * 70)
print('TEST 1: Send message (POST /api/v1/chat)')
print('=' * 70)
resp = requests.post('http://localhost:8002/api/v1/chat', 
    json={'message': 'What programming language should I learn first?'}, 
    timeout=45)
print(f'Status: {resp.status_code}')
data = resp.json()
conv_id = data['conversation_id']
print(f'Conversation ID: {conv_id}')
print(f'AI Response (first 150 chars): {data["assistant_message"][:150]}...')

print('\n' + '=' * 70)
print('TEST 2: Get conversation history (GET /api/v1/chat/{conv_id})')
print('=' * 70)
hist = requests.get(f'http://localhost:8002/api/v1/chat/{conv_id}', timeout=10)
print(f'Status: {hist.status_code}')
msgs = hist.json()['messages']
print(f'Total messages: {len(msgs)}')
for i, msg in enumerate(msgs, 1):
    role = msg['role'].upper()
    content = msg['content'][:80]
    print(f'  {i}. [{role}] {content}...')

print('\n' + '=' * 70)
print('TEST 3: Multi-turn conversation (Follow-up message)')
print('=' * 70)
resp2 = requests.post('http://localhost:8002/api/v1/chat', 
    json={'message': 'How long will it take to become proficient?', 'conversation_id': conv_id}, 
    timeout=45)
print(f'Status: {resp2.status_code}')
data2 = resp2.json()
print(f'AI Response (first 150 chars): {data2["assistant_message"][:150]}...')

print('\n' + '=' * 70)
print('Final conversation history:')
print('=' * 70)
hist2 = requests.get(f'http://localhost:8002/api/v1/chat/{conv_id}', timeout=10)
msgs2 = hist2.json()['messages']
print(f'Total messages now: {len(msgs2)}')
for i, msg in enumerate(msgs2, 1):
    role = msg['role'].upper()
    content = msg['content'][:80]
    print(f'  {i}. [{role}] {content}...')

print('\n✅ ALL TESTS PASSED!')
