# MOTIVAI — Motivation + AI Coach

MOTIVAI là trợ lý AI giúp bạn hình thành thói quen tốt, theo dõi mục tiêu, và nhận nhắc nhở thông minh mỗi ngày.
Mục tiêu: **nhẹ – nhanh – hữu ích** cho Gen Z/Y trong học tập, sức khỏe cơ bản và năng suất.

> ⚠️ **Bảo mật:** App **không gọi OpenAI trực tiếp từ client**. Tất cả lời gọi AI phải đi qua **backend** của bạn để tránh lộ API key.

---

## 🌟 Tính năng (MVP)
- Chat “giọng coach” ngắn gọn, khích lệ.
- Sinh **kế hoạch 7 ngày** (trả về JSON: `steps`, `reminders`, `tone`).
- Nhắc giờ thói quen (push/local notifications).
- Guardrail cơ bản (tránh nội dung nhạy cảm/y tế chuyên sâu).

---

## 🏗 Kiến trúc đề xuất
Repo hiện tại là **web tĩnh** (landing). Phần API & mobile đề xuất tách như sau:

```
motivai/                 # repo hiện tại (landing page)
├─ index.html
├─ style.css
└─ script.js

motivai-api/             # repo FastAPI (Stage 0)
motivai-mobile/          # Flutter app (client chính)
```
Hoặc **monorepo**: `/web`, `/api`, `/mobile`.

---

## 🚀 Chạy nhanh (Landing / Web tĩnh)
**Cách 1: VS Code Live Server**
1) Mở repo bằng VS Code → cài extension *Live Server*.
2) Click **Go Live** → mở `http://localhost:5500`.

**Cách 2: Python http.server**
```bash
python -m http.server 8080
# Mở http://localhost:8080
```

**Bật GitHub Pages**
- Settings → Pages → Branch: `main`/`master` (root) → Save.
- Link: `https://<username>.github.io/motivai`.

---

## 🧠 Backend API (Stage 0 – đề xuất)
Tạo repo mới `motivai-api` (Python 3.11+, FastAPI).

**Cài đặt**
```bash
python -m venv .venv
source .venv/bin/activate              # Windows: .venv\Scripts\Activate.ps1
pip install fastapi uvicorn[standard] python-dotenv openai orjson
```

**Cấu trúc**
```
app/
  main.py
  api/routes.py
  core/config.py
  services/ai.py
```

**.env**
```
OPENAI_API_KEY=sk-xxxx
```

**app/core/config.py**
```python
import os
from dotenv import load_dotenv
load_dotenv()
class Settings: OPENAI_API_KEY=os.getenv("OPENAI_API_KEY","")
settings=Settings()
```

**app/services/ai.py**
```python
from app.core.config import settings
def chat_reply(history: list[dict]) -> str:
    if not settings.OPENAI_API_KEY:
        last = history[-1]["content"] if history else ""
        return f"(MOTIVAI-stub) Đã nhận: {last[:120]}"
    from openai import OpenAI
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    msgs = [{"role":"system","content":"You are MOTIVAI, a concise, supportive coach."}]
    msgs += history
    r = client.chat.completions.create(model="gpt-4o-mini", messages=msgs, temperature=0.8)
    return r.choices[0].message.content
```

**app/api/routes.py**
```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ai import chat_reply

router = APIRouter()

@router.get("/health")
def health(): return {"status":"ok"}

class ChatReq(BaseModel):
    messages: list[dict]

@router.post("/chat")
def chat(req: ChatReq):
    if not req.messages or not req.messages[-1].get("content","").strip():
        raise HTTPException(status_code=400, detail="Empty message")
    reply = chat_reply(req.messages)
    return {"reply": reply}
```

**app/main.py**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router

app = FastAPI(title="MOTIVAI API (Stage 0)")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)
app.include_router(router, prefix="/v1")
```

**Chạy API**
```bash
uvicorn app.main:app --reload --port 8000
```

---

## 📡 API Contract
### `POST /v1/chat`
**Body**
```json
{ "messages": [ {"role":"user","content":"Tạo lộ trình 7 ngày uống 4 cốc nước/ngày và 2 nhắc giờ."} ] }
```
**Response (khi yêu cầu kế hoạch)**
```json
{
  "reply": {
    "steps": ["Step 1: ...", "Step 2: ..."],
    "reminders": [
      {"time":"08:00","message":"Uống cốc đầu tiên 💧"},
      {"time":"20:00","message":"Cốc cuối trước khi ngủ 😴"}
    ],
    "tone": "friendly"
  }
}
```

---

## 🔐 Bảo mật & Quyền riêng tư
- Không chèn `OPENAI_API_KEY` vào JS/web/mobile.
- Mọi lời gọi AI đi qua backend.
- Thu thập dữ liệu để cải thiện phải **opt-in**, ẩn danh, tuân thủ PDPD/GDPR.

---

## 🧭 Lộ trình
- **Giai đoạn 1 (2 tuần):** `/v1/chat` + JSON kế hoạch; Flutter gọi được.
- **Giai đoạn 2:** Log có cấu trúc (ẩn danh), QA 100–300 phiên.
- **Giai đoạn 3:** Memory dài hạn + RAG.
- **Giai đoạn 4:** Fine-tune “giọng MOTIVAI”, A/B test.

---

## 🤝 Đóng góp
- Mở issue mô tả bug/tính năng.
- Tạo PR theo nhánh `feature/...` hoặc `fix/...`.

## 📄 License
MIT License.
