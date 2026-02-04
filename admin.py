from fastapi import APIRouter, Depends, HTTPException, status, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import os

from . import models, database
from .database import get_db

router = APIRouter()
templates = Jinja2Templates(directory="templates")
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# Simple session-based auth for demo (in production use JWT or proper sessions)
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
ADMIN_PASSWORD_HASH = pwd_context.hash(ADMIN_PASSWORD[:72])

@router.get("/", response_class=HTMLResponse)
async def admin_dashboard(request: Request, db: Session = Depends(get_db)):
    # In a real app, check for authentication here
    logs = db.query(models.OCRLog).order_by(models.OCRLog.timestamp.desc()).limit(50).all()
    return templates.TemplateResponse("admin.html", {"request": request, "logs": logs})

@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@router.post("/login")
async def login(username: str = Form(...), password: str = Form(...)):
    if username == ADMIN_USERNAME and pwd_context.verify(password, ADMIN_PASSWORD_HASH):
        # Set cookie or session here
        return RedirectResponse(url="/admin/", status_code=status.HTTP_303_SEE_OTHER)
    raise HTTPException(status_code=401, detail="Invalid credentials")
