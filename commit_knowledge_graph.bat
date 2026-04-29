@echo off
cd /d "d:\Projects\OpenMind OS\OpenMind-OS"
echo === Committing Knowledge Graph + Skill Gap Analyzer + Roadmap Generator ===
git add -A
git commit -m "feat: knowledge graph + skill gap analyzer + roadmap generator

- Added NetworkX-based knowledge graph service with 30+ pre-built skill relationships
- Created skill gap analyzer using Gemini to extract skills from goals
- Implemented learning path recommendation engine
- Added POST /api/v1/skills/analyze endpoint for gap analysis
- Added GET /api/v1/graph endpoint for knowledge graph visualization
- Added POST /api/v1/roadmap/generate endpoint for week-by-week learning plans
- All endpoints return structured JSON for frontend integration"

echo.
echo === Verify Commit ===
git log --oneline -3
echo.
echo === DONE! ===
pause
