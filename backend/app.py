import os, re, json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

try:
    from openai import OpenAI
except Exception:
    OpenAI = None  # cho phép chạy chế độ STUB khi chưa cài openai

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
MODEL = os.getenv("MODEL", "gpt-4o-mini")
PORT = int(os.getenv("PORT", "8000"))

app = Flask(__name__)
# Cho phép gọi từ các origin phổ biến khi dev (serve bằng Live Server/localhost)
CORS(app, resources={r"/api/*": {"origins": [
    "http://localhost:5500", "http://127.0.0.1:5500",
    "http://localhost:3000", "http://127.0.0.1:3000",
    "http://localhost:5173", "http://127.0.0.1:5173"
]}})

@app.after_request
def secure_headers(resp):
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["X-Frame-Options"] = "DENY"
    resp.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return resp

@app.get("/health")
def health():
    return {"ok": True, "service": "motivai-backend", "model": MODEL}

# ---- STUB mode (chạy được ngay cả khi chưa có API key) ----
def stub_reply(msg: str) -> str:
    return f"(MOTIVAI-stub) Mình đã nhận mục tiêu của bạn: “{msg[:100]}”. Bắt đầu bằng 1 bước nhỏ ngay hôm nay nhé! 💪"

BLOCKLIST = re.compile(r"(suicide|tự\s*sát|ma túy|phishing|carding|hack\s*ai)", re.IGNORECASE)

@app.post("/api/chat")
def chat():
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    if not message or len(message) > 2000:
        return jsonify(error="message invalid or too long"), 400
    if BLOCKLIST.search(message):
        return jsonify(error="topic not supported"), 400

    # Nếu chưa có key → trả lời STUB (để bạn test ngay)
    if not OPENAI_API_KEY or OpenAI is None:
        return jsonify(ok=True, reply=stub_reply(message), model="stub")

    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        r = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content":
                 "You are MOTIVAI, a concise, practical, optimistic motivation coach. "
                 "Give 1–3 concrete next steps. Avoid medical/legal advice."},
                {"role": "user", "content": message}
            ],
            temperature=0.7,
            max_tokens=350
        )
        reply = (r.choices[0].message.content or "").strip()
        return jsonify(ok=True, reply=reply, model=MODEL)
    except Exception:
        # Giữ lỗi kín với client
        return jsonify(error="AI service temporarily unavailable"), 503

@app.post("/api/plan")
def plan():
    """Trả về JSON kế hoạch 7 ngày: steps[], reminders[{time,message}], tone."""
    data = request.get_json(silent=True) or {}
    goal = (data.get("goal") or "").strip()
    times = data.get("times") or []
    if not goal or len(goal) > 300: return jsonify(error="goal invalid"), 400
    if BLOCKLIST.search(goal): return jsonify(error="topic not supported"), 400
    norm = [t for t in times[:8] if re.match(r"^\d{2}:\d{2}$", str(t))]

    # STUB plan để dùng ngay nếu chưa có key
    if not OPENAI_API_KEY or OpenAI is None:
        steps = [
            "Viết 1 câu cam kết cá nhân cho mục tiêu.",
            "Chuẩn bị dụng cụ/ứng dụng theo dõi.",
            "Chia mục tiêu thành việc nhỏ mỗi ngày.",
            "Đặt 2–4 khung giờ cố định.",
            "Mỗi tối tự đánh giá 1 câu ngắn.",
            "Khen thưởng nhỏ khi hoàn thành.",
            "Chia sẻ tiến độ với 1 người bạn."
        ]
        reminders = [{"time": t, "message": "MOTIVAI nhắc nhẹ: tới giờ mục tiêu! ✨"} for t in (norm or ["08:00","20:00"])]
        return jsonify(ok=True, plan={"steps": steps, "reminders": reminders, "tone": "friendly"}, model="stub")

    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        prompt = (
            "Return STRICT JSON only with keys: steps (5-8 items, strings), "
            "reminders (objects {time:'HH:MM', message}), tone ('friendly'|'neutral'|'energetic'). "
            f"Goal: {goal}. Preferred times: {', '.join(norm) if norm else 'none'}"
        )
        r = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "system", "content": prompt}],
            temperature=0.6,
            max_tokens=600
        )
        raw = (r.choices[0].message.content or "").strip()
        if raw.startswith("```"):
            raw = raw.strip("`")
            raw = re.sub(r"^json", "", raw, flags=re.IGNORECASE).strip()
        obj = json.loads(raw)
        # validate tối thiểu
        steps = [s for s in obj.get("steps", []) if isinstance(s, str)][:8]
        rems = []
        for rm in obj.get("reminders", [])[:12]:
            t = (rm.get("time") or "").strip()
            m = (rm.get("message") or "").strip()
            if re.match(r"^\d{2}:\d{2}$", t) and 1 <= len(m) <= 120:
                rems.append({"time": t, "message": m})
        tone = obj.get("tone") if obj.get("tone") in ["friendly","neutral","energetic"] else "friendly"
        if len(steps) < 5:
            steps += ["Hoàn thiện mục tiêu bằng các bước nhỏ.", "Ghi nhận tiến bộ mỗi ngày."]
        if norm and rems:
            for i in range(min(len(norm), len(rems))):
                rems[i]["time"] = norm[i]
        return jsonify(ok=True, plan={"steps": steps, "reminders": rems, "tone": tone}, model=MODEL)
    except Exception:
        # fallback an toàn
        fb_steps = [
            "Xác định lý do và lợi ích cốt lõi.",
            "Chuẩn bị môi trường hỗ trợ.",
            "Đặt thời lượng/khung giờ cố định.",
            "Theo dõi bằng checklist 7 ngày.",
            "Tổng kết ngắn vào buổi tối."
        ]
        fb_rems = [{"time": t, "message": "Đến giờ MOTIVAI nhắc mục tiêu nhé!"} for t in (norm or ["08:00","20:00"])]
        return jsonify(ok=True, plan={"steps": fb_steps, "reminders": fb_rems, "tone": "friendly"}, model=MODEL, fallback=True), 200

from ai_core import motivate_user
@app.post("/api/motivate")
def motivate():
    data = request.get_json()
    message = data.get("message", "")
    reply = motivate_user(message)
    return jsonify({"response": reply})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=False)
