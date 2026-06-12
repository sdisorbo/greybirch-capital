"""
Vercel Python serverless function — /api/predict
Loaded once per warm instance; cold start ~5-10s on first call.
"""
import json
import sys
import logging
from http.server import BaseHTTPRequestHandler
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

logging.basicConfig(level=logging.INFO)

# Module-level singleton — persists across warm invocations
_predictor = None


def _get_predictor():
    global _predictor
    if _predictor is None:
        from ml_core import Predictor
        _predictor = Predictor()
    return _predictor


class handler(BaseHTTPRequestHandler):

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body   = json.loads(self.rfile.read(length))
            result = _get_predictor().predict(body)
            self._send(200, result)
        except Exception as exc:
            logging.exception("Prediction error")
            self._send(500, {"error": str(exc)})

    def do_GET(self):
        self._send(200, {"status": "ok", "warm": _predictor is not None})

    def _send(self, status: int, data: dict):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *_):
        pass  # suppress noisy access logs
