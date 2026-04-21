import os
import uuid
import json
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Form, File, UploadFile, Request, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv

from app.agents.creator import create_post
from app.agents.reviewer import review_post
from app.linkedin.client import post_to_linkedin

load_dotenv()

app = FastAPI(title="LinkedIn Post Generator")
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SESSION_SECRET", "change-me-in-prod"))

BASE_DIR = Path(__file__).parent
UPLOAD_DIR = BASE_DIR.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB


# ── Routes ──────────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/generate", response_class=HTMLResponse)
async def generate(
    request: Request,
    description: str = Form(...),
    language: str = Form("pt"),
    links: str = Form(""),
    extra_context: str = Form(""),
    images: list[UploadFile] = File(default=[]),
):
    # Save uploaded images
    saved_paths = []
    image_names = []
    for img in images:
        if not img.filename:
            continue
        if img.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(400, f"Tipo de arquivo não suportado: {img.content_type}")
        contents = await img.read()
        if len(contents) > MAX_IMAGE_SIZE:
            raise HTTPException(400, f"Imagem muito grande: {img.filename} (máx 5 MB)")
        ext = Path(img.filename).suffix
        filename = f"{uuid.uuid4().hex}{ext}"
        dest = UPLOAD_DIR / filename
        dest.write_bytes(contents)
        saved_paths.append(str(dest))
        image_names.append(filename)

    links_list = [l.strip() for l in links.splitlines() if l.strip()]
    img_descriptions = [f"Imagem: {n}" for n in image_names]

    # Agent 1 – Create
    draft = create_post(
        description=description,
        language=language,
        links=links_list if links_list else None,
        image_descriptions=img_descriptions if img_descriptions else None,
        extra_context=extra_context or None,
    )

    # Agent 2 – Review
    review = review_post(draft=draft, language=language)

    # Store in session for the review page
    session_data = {
        "original_draft": draft,
        "revised_post": review["revised_post"],
        "changes": review.get("changes", []),
        "quality_score": review.get("quality_score", 0),
        "ready_to_post": review.get("ready_to_post", True),
        "language": language,
        "image_names": image_names,
        "image_paths": saved_paths,
        "links": links_list,
    }
    request.session["post_data"] = session_data

    return templates.TemplateResponse(
        "review.html",
        {"request": request, **session_data},
    )


@app.post("/publish", response_class=HTMLResponse)
async def publish(
    request: Request,
    final_text: str = Form(...),
):
    token = os.getenv("LINKEDIN_ACCESS_TOKEN")
    if not token:
        raise HTTPException(500, "LINKEDIN_ACCESS_TOKEN não configurado.")

    post_data = request.session.get("post_data", {})
    image_paths = post_data.get("image_paths", [])

    # Agent 3 – Publish
    result = post_to_linkedin(token=token, text=final_text, image_paths=image_paths or None)

    request.session.pop("post_data", None)

    post_id = result.get("id", "")
    return templates.TemplateResponse(
        "success.html",
        {"request": request, "post_id": post_id, "post_text": final_text},
    )


@app.get("/health")
async def health():
    return {"status": "ok"}
