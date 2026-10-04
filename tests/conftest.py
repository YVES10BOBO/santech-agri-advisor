import os
import sys
from pathlib import Path

# Tests must not depend on backend/.env: no API key check, no real database, no real LLM.
# Environment variables take priority over the .env file.
os.environ.update({
    "API_ACCESS_KEY": "",
    "DATABASE_URL": "",
    "OPENAI_API_KEY": "test-key",
    "LLM_BASE_URL": "",
    "LLM_REASONING_EFFORT": "",
    "CHANNEL_WEBHOOK_TOKEN": "",
    "AT_API_KEY": "",
    "OPENBLAS_NUM_THREADS": "1",
})

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
