from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Pre-deploy checks for OpenMind backend artifacts/config.')
    parser.add_argument('--model-path', default='app/data/goal_prediction_model.json')
    parser.add_argument('--report-path', default='data/training/goal_model_validation_report.json')
    parser.add_argument('--min-roc-auc', type=float, default=0.62)
    parser.add_argument('--max-ece', type=float, default=0.30)
    parser.add_argument('--strict', action='store_true', help='Fail if ENABLE_ML_STUBS appears enabled in .env')
    return parser.parse_args()


def _read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding='utf-8'))


def _read_env_value(env_path: Path, key: str) -> str | None:
    if not env_path.exists():
        return None
    for line in env_path.read_text(encoding='utf-8').splitlines():
        clean = line.strip()
        if not clean or clean.startswith('#') or '=' not in clean:
            continue
        left, right = clean.split('=', 1)
        if left.strip() == key:
            return right.strip()
    return None


def main() -> None:
    args = parse_args()

    model_path = Path(args.model_path)
    report_path = Path(args.report_path)

    if not model_path.exists():
        raise SystemExit(f'Missing model artifact: {model_path}')
    if not report_path.exists():
        raise SystemExit(f'Missing validation report: {report_path}')

    model_payload = _read_json(model_path)
    report_payload = _read_json(report_path)

    weights = model_payload.get('weights') or {}
    required = {'bias', 'consistency_score', 'delay_ratio', 'completion_velocity', 'active_hours'}
    missing = required - set(weights.keys())
    if missing:
        raise SystemExit(f'Model artifact missing required weights: {sorted(missing)}')

    metrics = (report_payload.get('metrics') or {})
    roc_auc = float(metrics.get('roc_auc') or 0.0)
    ece = float(metrics.get('ece') or 1.0)

    if roc_auc < args.min_roc_auc:
        raise SystemExit(f'ROC AUC {roc_auc:.4f} is below required minimum {args.min_roc_auc:.4f}')
    if ece > args.max_ece:
        raise SystemExit(f'ECE {ece:.4f} is above allowed maximum {args.max_ece:.4f}')

    env_path = Path('.env')
    stubs_enabled = _read_env_value(env_path, 'ENABLE_ML_STUBS')
    if args.strict and stubs_enabled is not None and stubs_enabled.lower() == 'true':
        raise SystemExit('ENABLE_ML_STUBS=true detected in backend/.env while strict deploy check is enabled.')

    print('Predeploy checks passed')
    print(f'- Model artifact: {model_path}')
    print(f'- Validation report: {report_path}')
    print(f'- ROC AUC: {roc_auc:.4f}')
    print(f'- ECE: {ece:.4f}')


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        print(f'Predeploy check failed: {exc}')
        sys.exit(1)
