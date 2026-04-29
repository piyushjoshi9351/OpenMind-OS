import subprocess, os, shutil

os.chdir(r"d:\Projects\OpenMind OS\OpenMind-OS")

# Remove the duplicate test file from root tests/
try:
    os.remove(r"tests\test_goals_api.py")
    print("Removed duplicate tests/test_goals_api.py")
except:
    pass

# Remove __pycache__ directories
for d in ["tests/__pycache__", "backend/tests/__pycache__", ".pytest_cache"]:
    if os.path.exists(d):
        try:
            shutil.rmtree(d)
            print(f"Removed {d}")
        except:
            pass

# Git operations
print("\nStaging changes...")
subprocess.run(["git", "add", "-A"])

print("Committing...")
msg = """feat: Hugging Face embeddings + semantic search

- Added embedding column to Goal model (JSON stored in Text column)
- Save embeddings on goal creation using SentenceTransformer
- Added semantic search endpoint (/goals/search) with top-5 results
- Added /api/v1/goals/search alias for API consistency
- Health endpoint reports embedding model status
- Cosine similarity scoring on search results"""

subprocess.run(["git", "commit", "-m", msg])

print("\nRecent commits:")
subprocess.run(["git", "log", "--oneline", "-3"])
