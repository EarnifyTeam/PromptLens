# ==========================================================
# PROMPTLENS BY BORNALABS - CLOUD & LOCAL BACKEND
# Backend: Flask + Google GenAI SDK (Gemini Vision)
# ==========================================================

import os
import sys
import time
import tempfile
import traceback
import logging
from flask import Flask, request, jsonify, render_template
from google import genai

# ==========================================================
# CONFIG & PATH RESOLUTION (COMPATIBLE WITH VERCEL, RENDER, LOCAL)
# ==========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("PORT", 5000))
IS_VERCEL = bool(os.environ.get("VERCEL"))

# Use /tmp for serverless/cloud environments, local folders for desktop
if IS_VERCEL:
    TEMP_FOLDER = tempfile.gettempdir()
    OUTPUT_FOLDER = tempfile.gettempdir()
    LOGS_FOLDER = tempfile.gettempdir()
    API_KEY_FILE = os.path.join(tempfile.gettempdir(), "api_key.txt")
else:
    TEMP_FOLDER = os.path.join(BASE_DIR, "temp")
    OUTPUT_FOLDER = os.path.join(BASE_DIR, "output")
    LOGS_FOLDER = os.path.join(BASE_DIR, "logs")
    API_KEY_FILE = os.path.join(BASE_DIR, "api_key.txt")
    for folder in [TEMP_FOLDER, OUTPUT_FOLDER, LOGS_FOLDER]:
        try:
            os.makedirs(folder, exist_ok=True)
        except Exception:
            pass

# Configure logging (StreamHandler for Vercel/Cloud to prevent read-only filesystem crash)
log_format = '%(asctime)s - %(levelname)s - %(message)s'
handlers = [logging.StreamHandler(sys.stdout)]

if not IS_VERCEL:
    try:
        handlers.append(logging.FileHandler(os.path.join(LOGS_FOLDER, "app.log"), encoding='utf-8', mode='a'))
    except Exception:
        pass

logging.basicConfig(level=logging.INFO, format=log_format, handlers=handlers)
logger = logging.getLogger("PromptLens")

# Top-level Flask app declaration for Vercel & WSGI servers
template_dir = os.path.join(BASE_DIR, "templates")
static_dir = os.path.join(BASE_DIR, "static")

app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)
application = app
handler = app

# PyInstaller frozen binary adjustments if running locally as .exe
if getattr(sys, 'frozen', False):
    app.template_folder = os.path.join(sys._MEIPASS, 'templates')
    app.static_folder = os.path.join(sys._MEIPASS, 'static')
    logger.info(f"Running in PyInstaller frozen mode. Assets from: {sys._MEIPASS}")
else:
    logger.info("Running in standard web/cloud mode.")

# Limit upload size (e.g. up to 150MB per request)
app.config['MAX_CONTENT_LENGTH'] = 150 * 1024 * 1024

# ==========================================================
# HELPER FUNCTIONS
# ==========================================================

def get_server_default_key():
    """Retrieve fallback API key from env or local file"""
    env_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if env_key:
        return env_key
    if os.path.exists(API_KEY_FILE):
        try:
            with open(API_KEY_FILE, "r", encoding="utf-8") as f:
                return f.read().strip()
        except Exception:
            return ""
    return ""

def save_local_key(api_key):
    """Optionally cache API key locally for desktop mode"""
    if IS_VERCEL:
        return
    try:
        with open(API_KEY_FILE, "w", encoding="utf-8") as f:
            f.write(api_key.strip())
    except Exception as e:
        logger.warning(f"Could not save local api key file: {e}")

from flask import Flask, request, jsonify, render_template, send_from_directory, Response

# ==========================================================
# ROUTES
# ==========================================================

@app.route("/")
@app.route("/api/index")
@app.route("/api/index.py")
@app.route("/index")
def home():
    has_server_key = bool(get_server_default_key())
    return render_template(
        "index.html",
        has_server_key=has_server_key
    )

@app.route("/static/<path:filename>")
def serve_static_files(filename):
    lookup_dirs = [
        static_dir,
        os.path.join(BASE_DIR, "public", "static"),
        os.path.join(BASE_DIR, "public"),
        os.path.join(os.getcwd(), "static"),
        os.path.join(os.getcwd(), "public", "static")
    ]
    
    mimetype = "text/css" if filename.endswith(".css") else ("application/javascript" if filename.endswith(".js") else None)
    
    for folder in lookup_dirs:
        target = os.path.join(folder, filename)
        if os.path.exists(target) and os.path.isfile(target):
            try:
                with open(target, "r", encoding="utf-8") as f:
                    return Response(f.read(), mimetype=mimetype)
            except Exception:
                pass
                
    return send_from_directory(static_dir, filename)

@app.route("/health")
@app.route("/api/health")
def health():
    return jsonify({
        "status": "healthy",
        "service": "PromptLens by BornaLabs",
        "version": "3.6.0",
        "has_server_key": bool(get_server_default_key())
    })

# ==========================================================
# API KEY VALIDATION ENDPOINT
# ==========================================================

@app.route("/api/verify-key", methods=["POST"])
@app.route("/verify-key", methods=["POST"])
def verify_key():
    try:
        data = request.get_json(silent=True) or {}
        api_key = data.get("apiKey", "").strip() or get_server_default_key()
        
        if not api_key:
            return jsonify({"valid": False, "error": "No API key provided."}), 400
        
        # Test client connection with lightweight call
        test_client = genai.Client(api_key=api_key)
        response = test_client.models.generate_content(
            model='gemini-3.6-flash',
            contents='ping'
        )
        if response and response.text:
            return jsonify({"valid": True, "message": "Gemini API Key is valid & active!"})
        return jsonify({"valid": False, "error": "Unable to receive response from Gemini."}), 400
        
    except Exception as e:
        err = str(e)
        logger.error(f"API key verification failed: {err}")
        return jsonify({"valid": False, "error": err}), 400

# ==========================================================
# ANALYZE VIDEO ENDPOINT
# ==========================================================

@app.route("/api/analyze", methods=["POST"])
@app.route("/analyze", methods=["POST"])
def analyze_video():
    uploaded_files = []
    local_temp_paths = []
    client = None
    
    try:
        # 1. Validate API Key (User key > Server env key)
        api_key = request.form.get("apiKey", "").strip()
        if not api_key:
            api_key = get_server_default_key()
            
        if not api_key:
            return jsonify({
                "error": "Gemini API Key is required. Please add your key in the API Settings."
            }), 400
        
        if not IS_VERCEL:
            save_local_key(api_key)
        
        # Initialize Gemini Client
        client = genai.Client(api_key=api_key)
        
        # 2. Get uploaded videos
        videos = request.files.getlist("video")
        if not videos or len(videos) == 0 or videos[0].filename == '':
            return jsonify({"error": "Please select or upload at least one video."}), 400
        
        mode = request.form.get("mode", "video_prompt")
        logger.info(f"Analysis started. Mode: {mode}, Videos to analyze: {len(videos)}")
        
        # 3. Save files locally to temp folder and upload to Gemini File API
        for index, video in enumerate(videos):
            logger.info(f"Processing upload for Video {index + 1}/{len(videos)}: {video.filename}")
            
            extension = os.path.splitext(video.filename)[1] or ".mp4"
            with tempfile.NamedTemporaryFile(
                dir=TEMP_FOLDER,
                delete=False,
                suffix=extension
            ) as temp:
                video.save(temp.name)
                local_temp_path = temp.name
                local_temp_paths.append(local_temp_path)
            
            logger.info(f"Uploading {video.filename} to Gemini File API...")
            upload = client.files.upload(file=local_temp_path)
            uploaded_files.append(upload)
            logger.info(f"Uploaded to Gemini. Resource Name: {upload.name}")
        
        # 4. Wait/Poll for Gemini to finish processing video frames
        logger.info("Waiting for video frames to finish processing on Gemini cloud...")
        active_uploads = []
        max_wait_seconds = 180
        start_wait_time = time.time()
        
        for upload in uploaded_files:
            file_name = upload.name
            while True:
                if time.time() - start_wait_time > max_wait_seconds:
                    raise TimeoutError("Video processing timed out on Gemini servers. Please try a shorter video.")
                
                info = client.files.get(name=file_name)
                state = getattr(info.state, 'name', str(info.state)).upper()
                logger.info(f"Gemini processing state for {file_name}: {state}")
                
                if state == 'ACTIVE':
                    active_uploads.append(info)
                    break
                elif state == 'FAILED':
                    raise ValueError(f"Gemini failed to process uploaded video: {file_name}")
                else:
                    time.sleep(3.5)
        
        # 5. Select prompt template
        import prompts
        if mode == "master_prompt":
            system_prompt = prompts.MASTER_PROMPT_TEMPLATE
        else:
            system_prompt = prompts.VIDEO_PROMPT_TEMPLATE
        
        logger.info("Invoking Gemini generation...")
        contents = [*active_uploads, system_prompt]
        
        # Supported models with automatic fallback
        candidate_models = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']
        result_text = None
        used_model = None
        last_exception = None
        
        for model_name in candidate_models:
            try:
                logger.info(f"Attempting generation with model: {model_name}")
                response = client.models.generate_content(
                    model=model_name,
                    contents=contents
                )
                if response and response.text:
                    result_text = response.text
                    used_model = model_name
                    break
            except Exception as model_err:
                logger.warning(f"Model {model_name} failed: {model_err}")
                last_exception = model_err
                continue
                
        if not result_text:
            if last_exception:
                raise last_exception
            raise ValueError("Empty response received from Gemini AI.")
            
        logger.info(f"Prompt detection completed successfully using {used_model}.")
        
        # 6. Save output locally if not on serverless
        if not IS_VERCEL:
            try:
                timestamp = int(time.time())
                output_filename = f"prompt_{timestamp}.txt"
                output_path = os.path.join(OUTPUT_FOLDER, output_filename)
                with open(output_path, "w", encoding="utf-8") as out_f:
                    out_f.write(result_text)
            except Exception as e:
                logger.warning(f"Could not persist output to disk: {e}")
            
        return jsonify({
            "success": True,
            "master_prompt": result_text,
            "mode": mode,
            "model": used_model
        })
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error in video analysis route: {error_msg}")
        logger.error(traceback.format_exc())
        return jsonify({"error": error_msg}), 500
        
    finally:
        # Cleanup local temporary files
        for path in local_temp_paths:
            try:
                if os.path.exists(path):
                    os.remove(path)
            except Exception as e:
                logger.warning(f"Could not remove local temp file {path}: {e}")
                
        # Cleanup uploaded files from Gemini Cloud to free quota
        if client:
            for upload in uploaded_files:
                try:
                    client.files.delete(name=upload.name)
                except Exception as e:
                    logger.warning(f"Could not delete file {upload.name} from Gemini Cloud: {e}")

# ==========================================================
# MAIN EXECUTION
# ==========================================================

if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info(f"Starting PromptLens on port {PORT}...")
    logger.info("=" * 60)
    app.run(host="0.0.0.0", port=PORT, debug=False)
