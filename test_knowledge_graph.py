#!/usr/bin/env python
import requests
import json
import time

BASE_URL = "http://localhost:8002/api/v1"

print("=" * 70)
print("KNOWLEDGE GRAPH + SKILL GAP ANALYZER + ROADMAP GENERATOR TEST")
print("=" * 70)

# Test 1: Get Knowledge Graph
print("\n1. Testing GET /graph")
print("-" * 70)
try:
    resp = requests.get(f"{BASE_URL}/graph", timeout=10)
    print(f"Status: {resp.status_code}")
    data = resp.json()
    print(f"✅ Knowledge Graph loaded: {data['node_count']} nodes, {data['edge_count']} edges")
    
    # Show some sample skills
    skills = [n['label'] for n in data['nodes'] if n['type'] == 'skill'][:10]
    print(f"   Sample skills: {', '.join(skills)}")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 2: Analyze Skills for a Goal
print("\n2. Testing POST /skills/analyze")
print("-" * 70)
try:
    payload = {
        "goal_title": "Build a Machine Learning Model",
        "goal_description": "Create an end-to-end ML pipeline for classification",
        "current_skills": ["Python", "SQL"]
    }
    resp = requests.post(f"{BASE_URL}/skills/analyze", json=payload, timeout=30)
    print(f"Status: {resp.status_code}")
    data = resp.json()
    print(f"✅ Analysis complete:")
    print(f"   Required Skills: {', '.join(data['required_skills'])}")
    print(f"   Missing Skills: {', '.join(data['missing_skills'])} ({data['total_missing']} total)")
    print(f"   Recommendations:")
    for rec in data['recommendations'][:2]:
        print(f"     - {rec['skill']} (Priority: {rec['priority']})")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 3: Generate Roadmap
print("\n3. Testing POST /roadmap/generate")
print("-" * 70)
try:
    payload = {
        "goal_title": "Become a Machine Learning Engineer",
        "required_skills": ["Python", "Machine Learning", "Deep Learning", "TensorFlow"],
        "current_skills": ["Python"]
    }
    resp = requests.post(f"{BASE_URL}/roadmap/generate", json=payload, timeout=30)
    print(f"Status: {resp.status_code}")
    data = resp.json()
    print(f"✅ Roadmap generated: {data['total_weeks']} weeks")
    print(f"   Goal: {data['goal_title']}")
    print(f"   Sample weeks:")
    for week in data['weeks'][:3]:
        print(f"     Week {week['week']}: {week['title']}")
        print(f"       Tasks: {', '.join(week['tasks'][:2])}")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "=" * 70)
print("TESTS COMPLETE")
print("=" * 70)
