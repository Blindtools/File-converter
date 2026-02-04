from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class OCRLog(Base):
    __tablename__ = "ocr_logs"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    file_type = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    extracted_text = Column(Text)
    status = Column(String) # 'success' or 'failed'
