from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import json
import math
from pathlib import Path
from typing import Any

from app.core.config import get_settings


FEATURES = ("consistency_score", "delay_ratio", "completion_velocity", "active_hours")


@dataclass
class GoalModelArtifact:
    version: str
    weights: dict[str, float]
    means: dict[str, float]
    stds: dict[str, float]
    trained_at: str
    sample_count: int


class GoalModelService:
    def __init__(self) -> None:
        self._artifact: GoalModelArtifact | None = None
        self._last_error: str | None = None

    @staticmethod
    def _sigmoid(value: float) -> float:
        return 1.0 / (1.0 + math.exp(-value))

    def _default_weights(self) -> dict[str, float]:
        return {
            "bias": -0.9,
            "consistency_score": 0.032,
            "delay_ratio": -2.1,
            "completion_velocity": 0.42,
            "active_hours": 0.06,
        }

    def _artifact_path(self) -> Path:
        settings = get_settings()
        path = Path(settings.goal_prediction_model_path)
        if path.is_absolute():
            return path
        return Path(__file__).resolve().parents[2] / path

    def _load_if_needed(self) -> None:
        if self._artifact is not None:
            return

        model_path = self._artifact_path()
        if not model_path.exists():
            return

        try:
            with model_path.open("r", encoding="utf-8") as model_file:
                raw = json.load(model_file)

            weights = {key: float(value) for key, value in (raw.get("weights") or {}).items()}
            means = {key: float(value) for key, value in (raw.get("means") or {}).items()}
            stds = {key: float(value) for key, value in (raw.get("stds") or {}).items()}

            for feature in FEATURES:
                if feature not in weights:
                    raise ValueError(f"Missing weight for {feature}")

            self._artifact = GoalModelArtifact(
                version=str(raw.get("version") or get_settings().goal_prediction_model_version),
                weights={"bias": float(weights.get("bias", -0.9)), **{feature: weights[feature] for feature in FEATURES}},
                means={feature: float(means.get(feature, 0.0)) for feature in FEATURES},
                stds={feature: max(1e-6, float(stds.get(feature, 1.0))) for feature in FEATURES},
                trained_at=str(raw.get("trained_at") or "unknown"),
                sample_count=int(raw.get("sample_count") or 0),
            )
            self._last_error = None
        except Exception as exc:
            self._last_error = str(exc)
            self._artifact = None

    def _normalize(self, feature: str, value: float) -> float:
        if self._artifact is None:
            return value
        mean = self._artifact.means.get(feature, 0.0)
        std = self._artifact.stds.get(feature, 1.0)
        return (value - mean) / max(1e-6, std)

    def predict(self, features: dict[str, float]) -> dict[str, Any]:
        self._load_if_needed()

        if self._artifact is not None:
            weights = self._artifact.weights
            version = self._artifact.version
            trained = True
        else:
            weights = self._default_weights()
            version = "logistic_regression_bootstrap_v1"
            trained = False

        normalized_features: dict[str, float] = {}
        linear = float(weights.get("bias", 0.0))

        for feature in FEATURES:
            raw_value = float(features.get(feature, 0.0))
            normalized = self._normalize(feature, raw_value)
            normalized_features[feature] = normalized
            linear += float(weights.get(feature, 0.0)) * normalized

        probability = max(0.0, min(100.0, self._sigmoid(linear) * 100.0))
        confidence = max(35.0, min(98.0, 55.0 + abs(probability - 50.0) * 0.75 + (8.0 if trained else 0.0)))

        return {
            "completion_probability": round(probability, 2),
            "confidence_score": round(confidence, 2),
            "model_name": version,
            "trained_model_loaded": trained,
            "factors": {
                feature: round(float(features.get(feature, 0.0)), 4)
                for feature in FEATURES
            },
            "normalized_factors": {
                feature: round(value, 4)
                for feature, value in normalized_features.items()
            },
        }

    def save_artifact(
        self,
        *,
        weights: dict[str, float],
        means: dict[str, float],
        stds: dict[str, float],
        version: str,
        sample_count: int,
    ) -> Path:
        path = self._artifact_path()
        path.parent.mkdir(parents=True, exist_ok=True)

        payload = {
            "version": version,
            "trained_at": datetime.now(timezone.utc).isoformat(),
            "sample_count": int(sample_count),
            "weights": {
                "bias": float(weights.get("bias", 0.0)),
                **{feature: float(weights[feature]) for feature in FEATURES},
            },
            "means": {feature: float(means.get(feature, 0.0)) for feature in FEATURES},
            "stds": {feature: max(1e-6, float(stds.get(feature, 1.0))) for feature in FEATURES},
        }

        with path.open("w", encoding="utf-8") as model_file:
            json.dump(payload, model_file, indent=2)

        self._artifact = None
        self._load_if_needed()
        return path

    def runtime_status(self) -> dict[str, Any]:
        self._load_if_needed()
        return {
            "artifact_path": str(self._artifact_path()),
            "trained_model_loaded": self._artifact is not None,
            "model_name": self._artifact.version if self._artifact else "logistic_regression_bootstrap_v1",
            "sample_count": self._artifact.sample_count if self._artifact else 0,
            "last_error": self._last_error,
        }


goal_model_service = GoalModelService()
