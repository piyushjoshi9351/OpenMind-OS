from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
from statistics import mean


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Build goal training CSV from exported app telemetry files.')
    parser.add_argument('--tasks-json', required=True, help='Path to exported tasks JSON array')
    parser.add_argument('--goals-json', required=False, help='Path to exported goals JSON array')
    parser.add_argument('--metrics-json', required=False, help='Path to exported metrics JSON array')
    parser.add_argument(
        '--out-csv',
        default='data/training/generated_goal_training_data.csv',
        help='Output CSV path for model training',
    )
    parser.add_argument('--min-samples', type=int, default=40, help='Minimum rows required in output dataset')
    return parser.parse_args()


def _load_array(path: str | None) -> list[dict]:
    if not path:
        return []
    file_path = Path(path)
    if not file_path.exists():
        raise FileNotFoundError(f'File not found: {file_path}')

    payload = json.loads(file_path.read_text(encoding='utf-8'))
    if isinstance(payload, dict):
        for key in ('items', 'data', 'rows'):
            if isinstance(payload.get(key), list):
                return [entry for entry in payload[key] if isinstance(entry, dict)]
        return []
    if isinstance(payload, list):
        return [entry for entry in payload if isinstance(entry, dict)]
    return []


def _safe_bool(value: object) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {'1', 'true', 'yes', 'done', 'completed'}
    if isinstance(value, (int, float)):
        return bool(value)
    return False


def _safe_float(value: object, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _group_by(items: list[dict], key: str) -> dict[str, list[dict]]:
    grouped: dict[str, list[dict]] = {}
    for item in items:
        item_key = str(item.get(key) or '').strip()
        if not item_key:
            continue
        grouped.setdefault(item_key, []).append(item)
    return grouped


def _goal_title_map(goals: list[dict]) -> dict[str, str]:
    title_map: dict[str, str] = {}
    for goal in goals:
        goal_id = str(goal.get('id') or goal.get('goalId') or '').strip()
        if not goal_id:
            continue
        title_map[goal_id] = str(goal.get('title') or goal.get('target_goal') or '')
    return title_map


def build_rows(tasks: list[dict], goals: list[dict], metrics: list[dict]) -> list[dict[str, float | int]]:
    tasks_by_goal = _group_by(tasks, 'goalId')
    metrics_by_user = _group_by(metrics, 'userId')
    goal_titles = _goal_title_map(goals)

    rows: list[dict[str, float | int]] = []
    for goal_id, goal_tasks in tasks_by_goal.items():
        user_id = str(goal_tasks[0].get('userId') or '').strip()

        total = max(1, len(goal_tasks))
        completed = sum(1 for task in goal_tasks if _safe_bool(task.get('completed')))
        completion_rate = completed / total

        estimated_minutes = [_safe_float(task.get('estimatedTime'), 0.0) for task in goal_tasks]
        actual_minutes = [_safe_float(task.get('actualTime'), 0.0) for task in goal_tasks]
        avg_estimated = mean(estimated_minutes) if estimated_minutes else 0.0
        avg_actual = mean(actual_minutes) if actual_minutes else 0.0

        overdue = 0
        for task in goal_tasks:
            if _safe_bool(task.get('completed')):
                continue
            due = str(task.get('deadline') or '').strip()
            if due:
                # This is a weak heuristic from exported data without timezone guarantees.
                overdue += 1
        delay_ratio = overdue / total

        completion_velocity = completed / max(1, total / 4)
        active_hours = max(0.1, (avg_actual if avg_actual > 0 else avg_estimated) / 60)
        consistency_score = max(0.0, min(100.0, completion_rate * 100.0))

        user_metrics = metrics_by_user.get(user_id, [])
        if user_metrics:
            consistency_score = max(
                consistency_score,
                max(_safe_float(metric.get('consistencyScore'), 0.0) for metric in user_metrics),
            )
            delay_ratio = max(
                0.0,
                min(1.0, mean(_safe_float(metric.get('delayRatio'), delay_ratio) for metric in user_metrics)),
            )
            active_hours = max(
                active_hours,
                mean(_safe_float(metric.get('activeHours'), active_hours) for metric in user_metrics),
            )

        label = 1 if completion_rate >= 0.55 else 0
        rows.append(
            {
                'consistency_score': round(consistency_score, 4),
                'delay_ratio': round(max(0.0, min(1.0, delay_ratio)), 6),
                'completion_velocity': round(max(0.0, completion_velocity), 6),
                'active_hours': round(max(0.1, active_hours), 6),
                'label': label,
            }
        )

        title = goal_titles.get(goal_id)
        if title and any(token in title.lower() for token in ('ai', 'ml', 'engineer', 'career')):
            # Duplicate one weighted sample for high-value strategic goals to improve training stability.
            rows.append(rows[-1].copy())

    return rows


def write_csv(rows: list[dict[str, float | int]], out_csv: str) -> Path:
    out_path = Path(out_csv)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    fields = ['consistency_score', 'delay_ratio', 'completion_velocity', 'active_hours', 'label']
    with out_path.open('w', encoding='utf-8', newline='') as file_handle:
        writer = csv.DictWriter(file_handle, fieldnames=fields)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)

    return out_path


def main() -> None:
    args = parse_args()

    tasks = _load_array(args.tasks_json)
    if not tasks:
        raise ValueError('No task rows found in tasks export. Cannot build training dataset.')

    goals = _load_array(args.goals_json)
    metrics = _load_array(args.metrics_json)

    rows = build_rows(tasks=tasks, goals=goals, metrics=metrics)
    if len(rows) < args.min_samples:
        raise ValueError(
            f'Generated only {len(rows)} rows; at least {args.min_samples} required. '
            'Provide larger export files or lower --min-samples intentionally.'
        )

    out_path = write_csv(rows, args.out_csv)
    print(f'Generated training dataset: {out_path}')
    print(f'Total rows: {len(rows)}')


if __name__ == '__main__':
    main()
