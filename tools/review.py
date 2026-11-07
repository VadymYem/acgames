"""Apply complete per-device browser evidence to the public compatibility flags."""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--reports', type=Path, required=True)
parser.add_argument('--source-commit', required=True)
parser.add_argument('--run-id', type=int, required=True)
args = parser.parse_args()
data = json.loads((ROOT / 'catalog.json').read_text())
for game in data['games']:
    game.setdefault('candidateDevices', dict(game['devices']))
    game.setdefault('verification', {})
for device in ['desktop', 'android', 'ios']:
    report = json.loads((args.reports / device / 'results.json').read_text())
    rows = {row['id']: row for row in report['results']}
    expected = {game['id'] for game in data['games'] if game['candidateDevices'][device]}
    if report['device'] != device or set(rows) != expected or len(rows) != len(report['results']):
        raise ValueError(f'Incomplete or duplicated {device} evidence; registry left unchanged')
    for game in data['games']:
        row = rows.get(game['id'])
        game['devices'][device] = bool(row and row['passed'])
        game['verification'][device] = 'smoke-pass' if game['devices'][device] else 'needs-review' if row else 'unsupported'
        game['review'] = 'smoke-tested'
data['version'] = 3
data['verification'] = {'sourceCommit': args.source_commit, 'workflowRun': args.run_id, 'method': 'Browser load and basic input smoke; not a complete playthrough.'}
(ROOT / 'catalog.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
print({device: sum(game['devices'][device] for game in data['games']) for device in ['desktop', 'android', 'ios']})
