from __future__ import annotations

import json
import re
from typing import Any

try:
    import google.generativeai as genai
except Exception:
    genai = None

from app.core.config import get_settings
from app.services.knowledge_graph_service import knowledge_graph


class SkillGapAnalyzerService:
    """
    Analyzes skill gaps using Gemini AI and knowledge graph.
    Extracts required skills from goal, compares with user skills, and generates recommendations.
    """

    def __init__(self) -> None:
        self.settings = get_settings()
        self._model = None

    def _get_model(self):
        """Lazy-load Gemini model."""
        if self._model is None and genai is not None and not self.settings.enable_ml_stubs:
            api_key = self.settings.gemini_api_key.strip()
            if api_key:
                genai.configure(api_key=api_key)
                self._model = genai.GenerativeModel(
                    "gemini-2.5-flash",
                    system_instruction="You are an expert skill assessment AI. Extract required skills from goals.",
                )
        return self._model

    def extract_skills_from_goal(self, goal_title: str, goal_description: str | None = None) -> list[str]:
        """
        Use Gemini to extract required skills from a goal.
        Returns list of skill names that match our knowledge graph.
        """
        model = self._get_model()
        if model is None:
            return []

        # Build the prompt
        all_skills = knowledge_graph.get_all_skills()
        skills_list = ", ".join(all_skills)

        prompt = f"""Given the following goal, extract the most relevant skills required to achieve it.
        
Goal Title: {goal_title}
Goal Description: {goal_description or "N/A"}

Available Skills in Knowledge Base:
{skills_list}

IMPORTANT: 
1. Only return skills that exist in the "Available Skills" list above
2. Return as a JSON array with exact skill names from the list
3. Return only skills that are directly required (not nice-to-have)
4. Maximum 5-7 skills

Example response format:
["Python", "Machine Learning", "Data Science"]

Extract skills:"""

        try:
            response = model.generate_content(prompt, temperature=0.3)
            response_text = response.text.strip()

            # Extract JSON array from response
            json_match = re.search(r"\[.*?\]", response_text, re.DOTALL)
            if json_match:
                skills = json.loads(json_match.group())
                # Validate skills exist in knowledge graph
                valid_skills = [s for s in skills if s in all_skills]
                return valid_skills
        except Exception:
            pass

        return []

    def analyze_gap(
        self, required_skills: list[str], user_current_skills: list[str]
    ) -> dict[str, Any]:
        """Analyze skill gap using knowledge graph."""
        gap_analysis = knowledge_graph.find_skill_gap(required_skills, user_current_skills)

        # Build detailed recommendations
        missing_skills = gap_analysis["missing_skills"]
        recommendations: list[dict[str, Any]] = []

        for skill in missing_skills:
            prereqs = knowledge_graph.get_skill_prerequisites(skill)
            user_prereqs = [p for p in prereqs if p not in user_current_skills]

            learning_path = knowledge_graph.get_learning_path(skill, user_current_skills)

            recommendations.append(
                {
                    "skill": skill,
                    "missing_prerequisites": user_prereqs,
                    "suggested_learning_path": learning_path,
                    "priority": "high" if not user_prereqs else "medium",
                }
            )

        # Sort by priority and missing prereqs
        recommendations.sort(key=lambda x: (x["priority"] != "high", len(x["missing_prerequisites"])))

        return {
            "analysis": gap_analysis,
            "recommendations": recommendations,
            "total_missing": len(missing_skills),
        }

    def generate_learning_roadmap(
        self, goal_title: str, required_skills: list[str], user_current_skills: list[str]
    ) -> list[dict[str, Any]]:
        """Generate week-by-week learning roadmap using Gemini."""
        model = self._get_model()
        if model is None:
            return self._generate_stub_roadmap(required_skills, user_current_skills)

        # Analyze gap first
        gap_analysis = self.analyze_gap(required_skills, user_current_skills)
        missing_skills = gap_analysis["analysis"]["missing_skills"]

        if not missing_skills:
            return [
                {
                    "week": 1,
                    "title": "Goal Ready!",
                    "description": "You have all required skills for this goal.",
                    "tasks": ["Review current skills", "Start working on goal"],
                }
            ]

        prompt = f"""Create a detailed 12-week learning roadmap for achieving this goal.

Goal: {goal_title}
User's Current Skills: {', '.join(user_current_skills)}
Missing Skills to Learn: {', '.join(missing_skills)}

Requirements:
1. Break down into weeks (2-12 weeks based on complexity)
2. Each week should have 3-5 actionable tasks
3. Consider skill prerequisites
4. Include projects/practice
5. Format as JSON array

Example format:
[
  {{"week": 1, "title": "Python Fundamentals", "description": "...", "tasks": ["..."], "project": "..."}},
  ...
]

Generate roadmap:"""

        try:
            response = model.generate_content(prompt, temperature=0.5)
            response_text = response.text.strip()

            # Extract JSON array
            json_match = re.search(r"\[.*?\]", response_text, re.DOTALL)
            if json_match:
                roadmap = json.loads(json_match.group())
                return roadmap
        except Exception:
            pass

        # Fallback to stub roadmap
        return self._generate_stub_roadmap(required_skills, user_current_skills)

    def _generate_stub_roadmap(self, required_skills: list[str], user_skills: list[str]) -> list[dict[str, Any]]:
        """Generate a stub roadmap when Gemini is not available."""
        missing = [s for s in required_skills if s not in user_skills]

        roadmap = []
        weeks_per_skill = max(1, 10 // len(missing) if missing else 1)

        for idx, skill in enumerate(missing[:10]):
            roadmap.append(
                {
                    "week": idx + 1,
                    "title": f"Learn {skill}",
                    "description": f"Master the fundamentals of {skill}",
                    "tasks": [
                        f"Complete {skill} tutorial",
                        f"Build small {skill} project",
                        f"Review {skill} best practices",
                    ],
                    "project": f"Create a practice project using {skill}",
                }
            )

        return roadmap


# Global singleton
skill_gap_analyzer = SkillGapAnalyzerService()
