"""
Skin Analyzer — FastAPI backend

Endpoints:
  POST /api/predict   — full-image skin condition prediction
  POST /api/analyze   — zones + cause inference (for acne cases)
  POST /api/full      — single call: predict + zones + cause
"""

import os, sys, json, time, logging
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

import numpy as np
from PIL import Image, UnidentifiedImageError
import io, base64
from typing import List
from collections import defaultdict

from fastapi import FastAPI, File, UploadFile, Form, Request, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import auth as _auth

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("skinsense")

# ── Constants ─────────────────────────────────────────────────────────────────
MAX_FILE_SIZE   = 10 * 1024 * 1024          # 10 MB
ALLOWED_TYPES   = {"image/jpeg", "image/png", "image/webp"}
MIN_CONFIDENCE  = 50.0                       # warn below this %
RATE_LIMIT      = 10                         # max requests per window
RATE_WINDOW     = 60                         # seconds
_rate_store: dict = defaultdict(list)        # ip → [timestamps]

def check_rate_limit(ip: str):
    now = time.time()
    window = _rate_store[ip] = [t for t in _rate_store[ip] if now - t < RATE_WINDOW]
    if len(window) >= RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Trop de requêtes — réessayez dans 1 minute.")
    _rate_store[ip].append(now)

# ── Add training src to path so we can import config ─────────────────────────
TRAIN_DIR = os.path.join(os.path.dirname(__file__), "..", "skin-analyzer-train")
sys.path.insert(0, TRAIN_DIR)

from src.config import CLASS_NAMES, IMG_SIZE

from zone_detector import detect_zones, mark_zones_affected
from cause_engine import infer_causes, CAUSES
from product_matcher import match_routine

class GlowRequest(BaseModel):
    skin_type: str = "combination"
    budget: str = "moderate"
    condition: str = ""
    causes: List[str] = []
    sensitivity: str = ""
    climate: str = "hot"
    experience: str = "beginner"
    goals: List[str] = []

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    skin: str = "combination"

class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    name: str
    email: str
    skin: str = "combination"

SIGNUPS_FILE = os.path.join(os.path.dirname(__file__), "signups.json")

# ── Load model once at startup ────────────────────────────────────────────────
MODEL_PATH = os.path.join(TRAIN_DIR, "models", "mobilenetv2_finetuned_best.h5")
if not os.path.exists(MODEL_PATH):
    MODEL_PATH = os.path.join(TRAIN_DIR, "models", "mobilenetv2_best.h5")

print(f"Loading model from: {MODEL_PATH}")
from tensorflow.keras.models import load_model
MODEL = load_model(MODEL_PATH)
print("Model loaded.")

ACNE_CLASSES = {"Level_0", "Level_1", "Level_2"}

# ── Helpers ───────────────────────────────────────────────────────────────────

def preprocess(image_rgb: np.ndarray) -> np.ndarray:
    img = Image.fromarray(image_rgb).resize((IMG_SIZE[1], IMG_SIZE[0]), Image.BILINEAR)
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, 0)


def validate_and_read(data: bytes, content_type: str) -> np.ndarray:
    """Validate file type + size, then decode image. Raises HTTPException on failure."""
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Image trop lourde (max 10 MB).")
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail=f"Format non supporté. Utilisez JPG, PNG ou WebP.")
    try:
        img = Image.open(io.BytesIO(data)).convert("RGB")
    except UnidentifiedImageError:
        raise HTTPException(status_code=422, detail="Fichier illisible — ce n'est pas une image valide.")
    w, h = img.size
    if w < 64 or h < 64:
        raise HTTPException(status_code=422, detail="Image trop petite (minimum 64×64 px).")
    return np.array(img)

def read_image(data: bytes) -> np.ndarray:
    img = Image.open(io.BytesIO(data)).convert("RGB")
    return np.array(img)


def image_to_b64(image_rgb: np.ndarray) -> str:
    pil = Image.fromarray(image_rgb)
    buf = io.BytesIO()
    pil.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="Skin Analyzer API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/auth/register")
def auth_register(body: RegisterRequest):
    if not body.name.strip() or not body.email.strip() or not body.password:
        raise HTTPException(422, "Tous les champs sont requis.")
    if len(body.password) < 6:
        raise HTTPException(422, "Le mot de passe doit contenir au moins 6 caractères.")
    users = _auth.load_users()
    email = body.email.strip().lower()
    if email in users:
        raise HTTPException(409, "Un compte existe déjà avec cet email.")
    users[email] = {
        "name":          body.name.strip(),
        "email":         email,
        "skin":          body.skin,
        "password_hash": _auth.hash_password(body.password),
        "created_at":    time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    _auth.save_users(users)
    token = _auth.create_token(email)
    log.info("register | %s", email)
    return {"ok": True, "token": token, "name": users[email]["name"], "email": email, "skin": body.skin}


@app.post("/api/auth/login")
def auth_login(body: LoginRequest):
    if not body.email.strip() or not body.password:
        raise HTTPException(422, "Email et mot de passe requis.")
    users = _auth.load_users()
    email = body.email.strip().lower()
    user  = users.get(email)
    if not user or not _auth.verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(401, "Email ou mot de passe incorrect.")
    token = _auth.create_token(email)
    log.info("login | %s", email)
    return {"ok": True, "token": token, "name": user["name"], "email": email, "skin": user.get("skin", "combination")}


@app.get("/api/auth/me")
def auth_me(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Non authentifié.")
    token = authorization[7:]
    email = _auth.decode_token(token)
    if not email:
        raise HTTPException(401, "Session expirée — reconnectez-vous.")
    users = _auth.load_users()
    user  = users.get(email)
    if not user:
        raise HTTPException(401, "Compte introuvable.")
    return {"name": user["name"], "email": email, "skin": user.get("skin", "combination")}


@app.get("/api/health")
def health():
    return {"status": "ok", "classes": CLASS_NAMES}


@app.post("/api/signup")
def signup(body: SignupRequest):
    if not body.name.strip() or not body.email.strip():
        raise HTTPException(status_code=422, detail="Nom et email requis.")
    entry = {"name": body.name.strip(), "email": body.email.strip(), "skin": body.skin, "date": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    existing = []
    if os.path.exists(SIGNUPS_FILE):
        try:
            existing = json.loads(open(SIGNUPS_FILE).read())
        except Exception:
            existing = []
    existing.append(entry)
    with open(SIGNUPS_FILE, "w", encoding="utf-8") as f:
        json.dump(existing, f, ensure_ascii=False, indent=2)
    log.info("New signup: %s <%s>", entry["name"], entry["email"])
    return {"ok": True, "total": len(existing)}


@app.get("/api/signups")
def list_signups():
    if not os.path.exists(SIGNUPS_FILE):
        return {"signups": [], "total": 0}
    try:
        data = json.loads(open(SIGNUPS_FILE).read())
    except Exception:
        data = []
    return {"signups": data, "total": len(data)}


@app.post("/api/predict")
async def predict(request: Request, file: UploadFile = File(...)):
    check_rate_limit(request.client.host)
    data = await file.read()
    image = validate_and_read(data, file.content_type or "")
    try:
        tensor = preprocess(image)
        probs  = MODEL.predict(tensor, verbose=0)[0]
    except Exception as e:
        log.error("predict error: %s", e)
        raise HTTPException(500, "Erreur lors de l'analyse — réessayez.")

    pred_idx  = int(np.argmax(probs))
    pred_class = CLASS_NAMES[pred_idx]
    confidence = float(probs[pred_idx]) * 100
    all_probs  = {cls: round(float(p) * 100, 2) for cls, p in zip(CLASS_NAMES, probs)}

    log.info("predict | ip=%s cond=%s conf=%.1f%%", request.client.host, pred_class, confidence)
    return {
        "condition":        pred_class,
        "confidence":       round(confidence, 2),
        "is_acne":          pred_class in ACNE_CLASSES,
        "all_probs":        all_probs,
        "low_confidence":   confidence < MIN_CONFIDENCE,
    }


@app.post("/api/full")
async def full_analysis(
    request: Request,
    file: UploadFile = File(...),
    questionnaire: str = Form("{}"),
):
    check_rate_limit(request.client.host)
    data = await file.read()
    image = validate_and_read(data, file.content_type or "")

    # ── 1. Predict ────────────────────────────────────────────────────────────
    try:
        tensor = preprocess(image)
        probs  = MODEL.predict(tensor, verbose=0)[0]
    except Exception as e:
        log.error("full/predict error: %s", e)
        raise HTTPException(500, "Erreur lors de l'analyse — réessayez.")

    pred_idx   = int(np.argmax(probs))
    pred_class = CLASS_NAMES[pred_idx]
    confidence = float(probs[pred_idx]) * 100
    is_acne    = pred_class in ACNE_CLASSES
    all_probs  = {cls: round(float(p) * 100, 2) for cls, p in zip(CLASS_NAMES, probs)}

    log.info("full | ip=%s cond=%s conf=%.1f%%", request.client.host, pred_class, confidence)

    result = {
        "condition":      pred_class,
        "confidence":     round(confidence, 2),
        "is_acne":        is_acne,
        "all_probs":      all_probs,
        "low_confidence": confidence < MIN_CONFIDENCE,
        "zones":          None,
        "causes":         None,
    }

    # ── 2. Face / zone detection ───────────────────────────────────────────────
    try:
        zone_results = detect_zones(image)
    except Exception as e:
        log.warning("zone detection failed: %s", e)
        zone_results = []

    if not zone_results:
        # No face detected — still return prediction, just no zones/causes
        result["warning"] = "Aucun visage détecté. Assurez-vous que votre visage est bien visible."
        return result

    try:
        marked = mark_zones_affected(zone_results, image, MODEL, preprocess, ACNE_CLASSES, CLASS_NAMES)
    except Exception as e:
        log.warning("mark_zones_affected failed: %s", e)
        return result

    zones_payload  = []
    zones_affected = []
    for zr in marked:
        zones_payload.append({
            "zone":       zr.zone,
            "cause":      zr.cause,
            "bbox":       [int(v) for v in zr.bbox],
            "affected":   bool(zr.affected),
            "confidence": round(float(zr.confidence) * 100, 1),
        })
        if zr.affected:
            zones_affected.append(zr.zone)

    result["zones"] = zones_payload

    # ── 3. Cause inference ─────────────────────────────────────────────────────
    try:
        q = json.loads(questionnaire)
    except Exception:
        q = {}

    try:
        severity    = pred_class if pred_class in ACNE_CLASSES else None
        cause_scores = infer_causes(zones_affected, severity, q)
        result["causes"] = [
            {
                "cause":       cs.cause,
                "label":       cs.label,
                "score":       cs.score,
                "description": cs.description,
                "advice":      cs.advice,
                "color":       cs.color,
            }
            for cs in cause_scores
        ]
    except Exception as e:
        log.warning("cause inference failed: %s", e)

    return result


@app.post("/api/glow-routine")
async def glow_routine(body: GlowRequest):
    """Return a personalised product routine instantly (no external API needed)."""
    routine = match_routine(
        skin_type=body.skin_type,
        budget=body.budget,
        condition=body.condition,
        causes=body.causes,
        sensitivity=body.sensitivity or None,
        climate=body.climate,
        experience=body.experience,
        goals=body.goals,
    )
    return JSONResponse({
        "skin_type": body.skin_type,
        "budget":    body.budget,
        "condition": body.condition,
        "routine":   routine,
    })
