#!/usr/bin/env python
import subprocess
import os

os.chdir(r"d:\Projects\OpenMind OS\OpenMind-OS")

# First remove duplicate test file
try:
    os.remove(r"tests\test_goals_api.py")
    print("✓ Removed duplicate tests/test_goals_api.py")
except Exception as e:
    print(f"  (Could not remove duplicate: {e})")

# Stage changes
print("\n=== Git Status ===")
result = subprocess.run(['git', 'status', '--short'], capture_output=True, text=True)
print(result.stdout)
if result.stderr:
    print("STDERR:", result.stderr)

print("\n=== Staging Changes ===")
result = subprocess.run(['git', 'add', '-A'], capture_output=True, text=True)
print(result.stdout or "Changes staged")
if result.stderr:
    print("STDERR:", result.stderr)

print("\n=== Creating Commit ===")
commit_msg = """feat: Hugging Face embeddings + semantic search

- Added embedding column to Goal model (JSON stored in Text column)
- Save embeddings on goal creation using SentenceTransformer
- Added semantic search endpoint (/goals/search) with top-5 results
- Added /api/v1/goals/search alias for API consistency
- Health endpoint reports embedding model status
- Cosine similarity scoring on search results (rounded to 4 decimals)"""

result = subprocess.run(['git', 'commit', '-m', commit_msg], capture_output=True, text=True)
print(result.stdout)
if result.stderr:
    print("STDERR:", result.stderr)

print("\n=== Final Status ===")
result = subprocess.run(['git', 'log', '--oneline', '-3'], capture_output=True, text=True)
print(result.stdout)
