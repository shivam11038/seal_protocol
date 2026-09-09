from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from decimal import Decimal
from datetime import datetime, date

DB_USER = "root"
DB_PASSWORD = "12345"
DB_HOST = "localhost"
DB_PORT = "3306"
DB_NAME = "BHOSDI"

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI(title="Antarctica Telemetry API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def serialize_row(row_dict):
    out = {}
    for k, v in row_dict.items():
        if isinstance(v, (datetime, date)):
            out[k] = v.isoformat()
        elif isinstance(v, Decimal):
            out[k] = float(v)
        else:
            out[k] = v
    return out

@app.get("/api/telemetry/latest")
def get_latest_telemetry(station_id: str = Query("bharati"), db: Session = Depends(get_db)):
    try:
        query = text("""
            SELECT * FROM predictions 
            WHERE LOWER(station_id) LIKE LOWER(:station_filter)
            ORDER BY id DESC 
            LIMIT 1
        """)
        row = db.execute(query, {"station_filter": f"%{station_id}%"}).mappings().first()
        if not row:
            row = db.execute(text("SELECT * FROM predictions ORDER BY id DESC LIMIT 1")).mappings().first()
            if not row:
                raise HTTPException(status_code=404, detail="No telemetry records found.")
        return serialize_row(dict(row))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/telemetry/history")
def get_telemetry_history(station_id: str = Query("bharati"), limit: int = 25, db: Session = Depends(get_db)):
    try:
        query = text("""
            SELECT * FROM predictions 
            WHERE LOWER(station_id) = LOWER(:station_id)
            ORDER BY timestamp DESC 
            LIMIT :limit
        """)
        rows = db.execute(query, {"station_id": station_id, "limit": limit}).mappings().all()
        return [serialize_row(dict(r)) for r in reversed(rows)]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))