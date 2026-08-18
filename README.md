# 🚀 Earnify Prompt Detector Pro (Web & Cloud Ready)

An ultra-modern, high-converting AI SaaS web application to reverse-engineer viral videos into production-ready AI video prompts and reusable **Niche Master Prompt templates** using Google Gemini 2.5 Flash Vision.

---

## ✨ Features

- 🔮 **Ultra-Modern Glassmorphic Dark UI**: High-end aesthetic with responsive layouts, neon glows, and micro-animations.
- 🎬 **Dual Detection Modes**:
  - **Exact Video Prompt**: Deconstructs a single video into a 1:1 reproduction prompt for Sora, Runway, Kling, Luma.
  - **Niche Master Prompt**: Reverse-engineers viral patterns with customizable `[Bracketed Variables]`.
- 📹 **In-Browser Video Preview**: Drag & drop player with instant playback, file size, and multi-clip queue.
- ⚡ **Multi-User Cloud & Local Ready**:
  - Secure client-side `localStorage` API key persistence (no shared key leakage).
  - Server-side fallback via `GEMINI_API_KEY` environment variable.
  - Connection test utility directly in the UI.
- 📋 **Prompt Studio**: Formatted highlighted view, plain text view, 1-click clipboard copy, and `.txt` file export.
- 🌟 **Interactive Sample Showcase**: Pre-built viral templates to demo prompts instantly.

---

## ⚡ Local Run

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run the application
python app.py
```

Open your browser at: **`http://localhost:5000`**

---

## 🌐 Deploy Live on the Web (Free & Easy)

### Option 1: Deploy on Render.com (Recommended - 1-Click Free Tier)

1. Push this project folder to your **GitHub** repository.
2. Sign in to [Render.com](https://render.com) and click **New + Web Service**.
3. Connect your GitHub repository.
4. Set the following:
   - **Environment**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --timeout 300 --workers 2 --bind 0.0.0.0:$PORT`
5. *(Optional)* Add Environment Variable:
   - `GEMINI_API_KEY` = `your_gemini_api_key_here` (If you want to provide a default key for users).
6. Click **Deploy Web Service**. Your website will be live worldwide in 2 minutes!

---

### Option 2: Deploy on Railway.app

1. Install Railway CLI or connect via GitHub on [Railway.app](https://railway.app).
2. Railway will automatically detect the included `Procfile` and `requirements.txt`.
3. Set your service port to `$PORT` and deploy.

---

### Option 3: Deploy on Hugging Face Spaces

1. Create a new **Space** on [Hugging Face](https://huggingface.co/spaces) with SDK **Docker** or **Gradio/Flask**.
2. Push the files and set your `GEMINI_API_KEY` under Space Secrets.

---

## 📂 File Structure

```
Earnify Prompt Detector Pro/
│
├── 📄 app.py                     # Production Flask server & Gemini API endpoints
├── 📄 prompts.py                 # System templates for video reverse-engineering
├── 📄 requirements.txt           # Python dependencies (Flask, google-genai, gunicorn)
├── 📄 Procfile                   # Cloud production deployment config (Gunicorn)
├── 📄 render.yaml                # Render 1-click cloud specification
├── 📄 README.md                  # Documentation & deployment guide
│
├── 📂 templates/
│      └── 📄 index.html          # Ultra-modern glassmorphic web dashboard
│
├── 📂 static/
│      ├── 📄 style.css           # Modern dark-mode styling with glowing accents
│      └── 📄 script.js           # Client-side reactivity, preview player & API manager
│
├── 📂 uploads/                   # Upload staging folder
├── 📂 output/                    # Generated master prompts archive
├── 📂 logs/                      # Server execution logs
└── 📂 temp/                      # Working directory for video processing
```
