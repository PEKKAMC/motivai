# backend/ai_core.py

import google.generativeai as genai
import os

# --- Cấu hình API key Gemini ---
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# --- Khởi tạo model ---
model = genai.GenerativeModel("gemini-pro")

# --- Hàm sinh phản hồi AI ---
def motivate_user(message: str):
    """
    Hàm này nhận message của user, tạo prompt động,
    và trả về phản hồi của Gemini.
    """
    prompt = f"""
    Bạn là MOTIVAI — trợ lý AI giúp người dùng duy trì động lực.
    Trả lời ngắn gọn, tích cực, truyền cảm hứng, KHÔNG rao giảng.
    Người dùng nói: "{message}"
    Trả lời bằng giọng nhẹ nhàng, khích lệ.
    """
    response = model.generate_content(prompt)
    return response.text.strip()
