from __future__ import annotations

import argparse
import csv
from dataclasses import dataclass
import json
from random import Random
import sys
from pathlib import Path
from typing import Any

from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, brier_score_loss, f1_score, log_loss, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.core.config import get_settings
from app.services.goal_model_service import FEATURES, goal_model_service


@dataclass
class Sample:
    consistency_score: float
    delay_ratio: float
    completion_velocity: float
    active_hours: float
    label: float


def sigmoid(value: float) -> float:
    import math

    return 1.0 / (1.0 + math.exp(-value))


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Train goal prediction model from historical dataset.')
    parser.add_argument(
        '--dataset',
        default=str((ROOT_DIR / 'data' / 'training' / 'sample_goal_training_data.csv').resolve()),
        help='CSV file with columns: consistency_score,delay_ratio,completion_velocity,active_hours,label',
    )
    parser.add_argument(
        '--report-out',
        default=str((ROOT_DIR / 'data' / 'training' / 'goal_model_validation_report.json').resolve()),
        help='Where to write validation report JSON.',
    )
    parser.add_argument('--test-size', type=float, default=0.2, help='Validation split ratio.')
    parser.add_argument('--seed', type=int, default=2026, help='Random seed.')
    return parser.parse_args()


def generate_samples(size: int, seed: int = 2026) -> list[Sample]:
    rng = Random(seed)
    samples: list[Sample] = []

    for _ in range(size):
        consistency_score = rng.uniform(10.0, 95.0)
        delay_ratio = rng.uniform(0.0, 0.95)
        completion_velocity = rng.uniform(0.0, 4.8)
        active_hours = rng.uniform(0.3, 6.0)

        hidden_linear = (
            -0.7
            + 0.035 * consistency_score
            - 2.3 * delay_ratio
            + 0.58 * completion_velocity
            + 0.11 * active_hours
            + rng.gauss(0.0, 0.35)
        )

        probability = sigmoid(hidden_linear)
        label = 1.0 if rng.random() < probability else 0.0

        samples.append(
            Sample(
                consistency_score=consistency_score,
                delay_ratio=delay_ratio,
                completion_velocity=completion_velocity,
                active_hours=active_hours,
                label=label,
            )
        )

    return samples


def load_dataset(path: Path) -> list[Sample]:
    samples: list[Sample] = []
    with path.open('r', encoding='utf-8', newline='') as dataset_file:
        reader = csv.DictReader(dataset_file)
        expected = {'consistency_score', 'delay_ratio', 'completion_velocity', 'active_hours', 'label'}
        missing = expected - set(reader.fieldnames or [])
        if missing:
            raise ValueError(f'Dataset missing required columns: {sorted(missing)}')

        for row in reader:
            samples.append(
                Sample(
                    consistency_score=float(row['consistency_score']),
                    delay_ratio=float(row['delay_ratio']),
                    completion_velocity=float(row['completion_velocity']),
                    active_hours=float(row['active_hours']),
                    label=float(row['label']),
                )
            )

    if len(samples) < 40:
        raise ValueError('Dataset must contain at least 40 rows for stable training/validation metrics.')

    labels = {int(sample.label) for sample in samples}
    if labels != {0, 1}:
        raise ValueError('Dataset must include both label classes 0 and 1.')

    return samples


def compute_feature_stats(samples: list[Sample]) -> tuple[dict[str, float], dict[str, float]]:
    means: dict[str, float] = {}
    stds: dict[str, float] = {}

    for feature in FEATURES:
        values = [float(getattr(sample, feature)) for sample in samples]
        mean = sum(values) / max(1, len(values))
        variance = sum((value - mean) ** 2 for value in values) / max(1, len(values))
        means[feature] = mean
        stds[feature] = max(1e-6, variance ** 0.5)

    return means, stds


def expected_calibration_error(probabilities: list[float], labels: list[int], bins: int = 10) -> float:
    if not probabilities:
        return 0.0

    total = len(probabilities)
    ece = 0.0
    for index in range(bins):
        lower = index / bins
        upper = (index + 1) / bins
        bucket = [
            (probability, label)
            for probability, label in zip(probabilities, labels)
            if lower <= probability < upper or (index == bins - 1 and probability == 1.0)
        ]
        if not bucket:
            continue
        avg_confidence = sum(probability for probability, _ in bucket) / len(bucket)
        avg_accuracy = sum(label for _, label in bucket) / len(bucket)
        ece += (len(bucket) / total) * abs(avg_accuracy - avg_confidence)
    return ece


def train_and_evaluate(samples: list[Sample], test_size: float, seed: int) -> tuple[dict[str, float], dict[str, float], dict[str, float], dict[str, Any]]:
    matrix = [[float(getattr(sample, feature)) for feature in FEATURES] for sample in samples]
    labels = [int(sample.label) for sample in samples]

    x_train, x_valid, y_train, y_valid = train_test_split(
        matrix,
        labels,
        test_size=test_size,
        random_state=seed,
        stratify=labels,
    )

    scaler = StandardScaler()
    x_train_scaled = scaler.fit_transform(x_train)
    x_valid_scaled = scaler.transform(x_valid)

    model = LogisticRegression(max_iter=1000, solver='lbfgs')
    model.fit(x_train_scaled, y_train)

    valid_probability = model.predict_proba(x_valid_scaled)[:, 1]
    valid_prediction = [1 if score >= 0.5 else 0 for score in valid_probability]

    metrics: dict[str, Any] = {
        'sample_count': len(samples),
        'train_size': len(y_train),
        'validation_size': len(y_valid),
        'roc_auc': float(roc_auc_score(y_valid, valid_probability)),
        'f1': float(f1_score(y_valid, valid_prediction)),
        'precision': float(precision_score(y_valid, valid_prediction)),
        'recall': float(recall_score(y_valid, valid_prediction)),
        'accuracy': float(accuracy_score(y_valid, valid_prediction)),
        'brier_score': float(brier_score_loss(y_valid, valid_probability)),
        'log_loss': float(log_loss(y_valid, valid_probability)),
        'ece': float(expected_calibration_error(valid_probability.tolist(), y_valid)),
    }

    weights = {
        'bias': float(model.intercept_[0]),
        **{feature: float(model.coef_[0][index]) for index, feature in enumerate(FEATURES)},
    }
    means = {feature: float(scaler.mean_[index]) for index, feature in enumerate(FEATURES)}
    stds = {feature: float(scaler.scale_[index]) for index, feature in enumerate(FEATURES)}
    return weights, means, stds, metrics


def _safe_report_path(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT_DIR))
    except ValueError:
        return path.name


def main() -> None:
    args = parse_arguments()
    settings = get_settings()

    dataset_path = Path(args.dataset)
    if dataset_path.exists():
        samples = load_dataset(dataset_path)
        dataset_source = str(dataset_path)
    else:
        samples = generate_samples(size=2800, seed=args.seed)
        dataset_source = 'synthetic_fallback'

    weights, means, stds, metrics = train_and_evaluate(samples, test_size=args.test_size, seed=args.seed)

    model_path = goal_model_service.save_artifact(
        weights=weights,
        means=means,
        stds=stds,
        version=settings.goal_prediction_model_version,
        sample_count=len(samples),
    )

    report_path = Path(args.report_out)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_payload = {
        'dataset_source': dataset_source,
        'model_version': settings.goal_prediction_model_version,
        'artifact_path': _safe_report_path(model_path),
        'metrics': metrics,
    }
    with report_path.open('w', encoding='utf-8') as report_file:
        json.dump(report_payload, report_file, indent=2)

    print(f"Trained goal prediction model saved: {model_path}")
    print(f"Validation report saved: {report_path}")
    print(f"Dataset source: {dataset_source}")
    print(f"Samples: {len(samples)}")
    print(f"ROC AUC: {metrics['roc_auc']:.4f}")
    print(f"F1: {metrics['f1']:.4f}")
    print(f"ECE: {metrics['ece']:.4f}")
    print(f"Weights: {weights}")


if __name__ == "__main__":
    main()
