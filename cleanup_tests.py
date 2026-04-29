import os
import shutil

root_test = r"d:\Projects\OpenMind OS\OpenMind-OS\tests\test_goals_api.py"
backend_test = r"d:\Projects\OpenMind OS\OpenMind-OS\backend\tests\test_goals_api.py"

# Remove duplicate test file in root
if os.path.exists(root_test):
    os.remove(root_test)
    print(f"Removed {root_test}")

# Remove __pycache__ dirs
for dirpath in [r"d:\Projects\OpenMind OS\OpenMind-OS\tests\__pycache__",
                r"d:\Projects\OpenMind OS\OpenMind-OS\backend\tests\__pycache__",
                r"d:\Projects\OpenMind OS\OpenMind-OS\backend\__pycache__"]:
    if os.path.exists(dirpath):
        shutil.rmtree(dirpath)
        print(f"Removed {dirpath}")

print("Cleanup complete")
