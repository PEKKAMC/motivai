import os
import re
from typing import Optional

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Gemini
import google.generativeai as genai

# ---------- Config & bootstrap ----------
load_dotenv()  # đọc .env nếu có
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-1.5-pro")

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Block một số nội dung nguy cơ cao (bạn có thể mở rộng)
BLOCKLIST = re.compile(
    r"(suicide|tự\s*sát|ma\s*túy|phishing|carding|hack\s*\*?ai)",
    re.IGNORECASE,
)

# Nếu có API key thì khởi tạo model
MODEL = None
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    MODEL = genai.GenerativeModel(
        MODEL_NAME,
        generation_config={
            "temperature": 0.8,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 512,
        },
        safety_settings=None,  # dùng mặc định của Google; có thể tuỳ chỉnh theo chính sách
    )


# ---------- Helpers ----------
def stub_reply(msg: str) -> str:
    """Trả lời tạm khi chưa có API key (để dev/test nhanh)."""
    trimmed = (msg or "").strip()
    if len(trimmed) > 100:
        trimmed = trimmed[:100] + "…"
    return (
        f"(MOTIVAI–stub) Mình đã nhận mục tiêu của bạn: “{trimmed}”. "
        "Bắt đầu bằng 1 bước nhỏ ngay hôm nay nhé! 💪"
    )


def build_system_prompt(category: Optional[str]) -> str:
    """
    Prompt hệ thống nhẹ, điều chỉnh giọng điệu theo nhóm.
    category ∈ {'habit','study','emotion'} nếu frontend gửi.
    """
    base = (
        "You are MOTIVAI, a concise, upbeat motivation coach. "
        "Always be practical, non-judgmental, and action-oriented. "
        "Write 2–5 short bullet points max, Vietnamese, with 1 emoji at the end.\n"
    )
    if category == "habit":
        base += "Focus on tiny habits, triggers, and 1 next action in under 30 seconds.\n"
    elif category == "study":
        base += "Focus on time-blocks, distraction control, and a 25–50 minute plan.\n"
    elif category == "emotion":
        base += "Acknowledge feelings, suggest one grounding technique, and a small step.\n"
    return base


def call_gemini(user_message: str, category: Optional[str]) -> str:
    """Gọi Gemini và trả về text đã làm sạch."""
    system_prompt = build_system_prompt(category)
    # Với Gemini, ta truyền mảng content: [system, user]
    resp = MODEL.generate_content(
        [
            {"role": "user", "parts": system_prompt + "\n\nNgười dùng: " + user_message}
        ]
    )
    # Gemini có thể trả nhiều candidates; lấy text chính
    text = getattr(resp, "text", "") or ""
    return text.strip() or "Mình đang gặp chút sự cố, thử lại giúp mình nhé!"


# ---------- Routes ----------
@app.get("/health")
def health():
    return jsonify(
        {
            "ok": True,
            "service": "motivai-backend",
            "model": MODEL_NAME,
            "gemini_configured": bool(MODEL),
        }
    )


@app.post("/api/chat")
def chat():
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    category = (data.get("category") or "").strip().lower() or None  # habit/study/emotion

    # Validate
    if not message or len(message) > 2000:
        return jsonify(error="message invalid or too long"), 400
    if BLOCKLIST.search(message):
        return jsonify(error="topic not supported"), 400

    # Nếu chưa cấu hình API key -> stub
    if MODEL is None:
        return jsonify(reply=stub_reply(message), mode="stub"), 200

    try:
        reply = call_gemini(message, category)
        return jsonify(reply=reply, mode="gemini"), 200
    except Exception as e:
        # fallback an toàn
        return jsonify(reply=stub_reply(message), mode="fallback", detail=str(e)), 200


# ---------- Entrypoint ----------
if __name__ == "__main__":
    # Chạy local: python backend/app.py
    port = int(os.getenv("PORT", "8000"))
    app.run(host="0.0.0.0", port=port, debug=os.getenv("DEBUG", "false") == "true")