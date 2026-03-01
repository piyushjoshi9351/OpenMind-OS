from __future__ import annotations

import json
from pathlib import Path

from app.models.schemas import SkillGapAnalyzeRequest, SkillGapAnalyzeResponse


class SkillGapService:
    def __init__(self) -> None:
        data_path = Path(__file__).resolve().parents[1] / "data" / "role_skill_maps.json"
        with data_path.open("r", encoding="utf-8") as role_map_file:
            self._role_maps: dict[str, list[str]] = json.load(role_map_file)

    def analyze(self, payload: SkillGapAnalyzeRequest) -> SkillGapAnalyzeResponse:
        role_key = payload.target_role.strip().lower().replace(" ", "_")
        required_skills = self._role_maps.get(role_key) or self._role_maps.get("ai_engineer", [])

        existing = sorted({skill.strip() for skill in payload.user_skills if skill.strip()})
        required_normalized = {skill.lower(): skill for skill in required_skills}
        existing_normalized = {skill.lower() for skill in existing}

        matched = sorted(required_normalized[key] for key in required_normalized if key in existing_normalized)
        missing = sorted(required_normalized[key] for key in required_normalized if key not in existing_normalized)

        gap_percentage = round((len(missing) / max(1, len(required_skills))) * 100, 2)

        recommendations = [
            f"Create a 2-week sprint for {skill}" for skill in missing[:6]
        ] or ["No critical gap detected. Focus on execution depth and projects."]

        return SkillGapAnalyzeResponse(
            user_id=payload.user_id,
            target_role=role_key,
            required_skills=required_skills,
            existing_skills=matched,
            missing_skills=missing,
            gap_percentage=gap_percentage,
            recommendations=recommendations,
        )


skill_gap_service = SkillGapService()
