# Evaluation Framework

This folder contains a small evaluation harness for the `reg-system` app.

Overview
- `run_evaluation.py` — lightweight runner that executes functional checks against the app.
- `requirements.txt` — Python deps for the runner.
- `dataset/` — example test dataset / scenarios.

How it works
- The runner hits the app `GET /`, extracts the generated `orderId`, then `POST /order` with that ID and verifies the response.

Environment
- `EVAL_BASE_URL` — Base URL for the app under test (default: `http://localhost:3000`).

Run locally
```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r evaluation/requirements.txt
EVAL_BASE_URL=http://localhost:3000 python evaluation/run_evaluation.py
```

CI
- A GitHub Actions workflow is included at `.github/workflows/evaluate.yml` that installs dependencies and runs the evaluation.
