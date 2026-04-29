@echo off
cd /d "d:\Projects\OpenMind OS\OpenMind-OS"
git add .
git commit -m "feat: Hugging Face embeddings + semantic search"
git log --oneline -3
pause
