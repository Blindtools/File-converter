from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
import os

from . import models, database, ocr, admin
from .database import engine, get_db

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Blind OCR API", description="Cost-effective OCR API for blind users")

# Mount static files and templates
# Ensure directories exist
os.makedirs("static", exist_ok=True)
os.makedirs("templates", exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Include admin routes
app.include_router(admin.router, prefix="/admin", tags=["admin"])

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/ocr/pdf")
async def process_pdf(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    content = await file.read()
    try:
        text = ocr.extract_text_from_pdf(content)
        
        # Log the request
        log = models.OCRLog(
            filename=file.filename,
            file_type="pdf",
            extracted_text=text[:1000], # Store first 1000 chars for preview
            status="success"
        )
        db.add(log)
        db.commit()
        
        return {"filename": file.filename, "text": text}
    except Exception as e:
        log = models.OCRLog(
            filename=file.filename,
            file_type="pdf",
            extracted_text=str(e),
            status="failed"
        )
        db.add(log)
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ocr/image")
async def process_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    try:
        text = ocr.extract_text_from_image(content)
        
        # Log the request
        log = models.OCRLog(
            filename=file.filename,
            file_type="image",
            extracted_text=text[:1000],
            status="success"
        )
        db.add(log)
        db.commit()
        
        return {"filename": file.filename, "text": text}
    except Exception as e:
        log = models.OCRLog(
            filename=file.filename,
            file_type="image",
            extracted_text=str(e),
            status="failed"
        )
        db.add(log)
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))
