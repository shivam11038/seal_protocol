from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from decimal import Decimal
from datetime import datetime, date

DB_USER = "root"
DB_PASSWORD = "lavanya"
DB_HOST = "localhost"
DB_PORT = "3306"
DB_NAME = "antarctica_digital_twin"

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
def get_latest_telemetry(
    station_id: str = Query("bharati"),
    db: Session = Depends(get_db)
):
    try:
        query = text("""
            SELECT *
            FROM predictions
            WHERE LOWER(station_id) = LOWER(:station_id)
            ORDER BY timestamp DESC, id DESC
            LIMIT 1
        """)

        row = (
            db.execute(
                query,
                {"station_id": station_id}
            )
            .mappings()
            .first()
        )

        if not row:
            raise HTTPException(
                status_code=404,
                detail=f"No telemetry found for station '{station_id}'."
            )

        return serialize_row(dict(row))

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )


@app.get("/api/telemetry/history")
def get_telemetry_history(
    station_id: str = Query("bharati"),
    limit: int = Query(25, ge=1, le=500),
    db: Session = Depends(get_db)
):
    try:
        query = text("""
            SELECT *
            FROM predictions
            WHERE LOWER(station_id) = LOWER(:station_id)
            ORDER BY timestamp DESC, id DESC
            LIMIT :limit
        """)

        rows = (
            db.execute(
                query,
                {
                    "station_id": station_id,
                    "limit": limit
                }
            )
            .mappings()
            .all()
        )

        return [
            serialize_row(dict(row))
            for row in reversed(rows)
        ]

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )


from fastapi.responses import FileResponse
@app.get("/")
def root():
    return FileResponse("index.html")


@app.get("/styles.css")
def styles():
    return FileResponse("styles.css")


@app.get("/main.js")
def main_js():
    return FileResponse("main.js")


@app.get("/map.js")
def map_js():
    return FileResponse("map.js")


@app.get("/telemetry.js")
def telemetry_js():
    return FileResponse("telemetry.js")


@app.get("/api.js")
def api_js():
    return FileResponse("api.js")
@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected",
            "database_name": DB_NAME
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database connection failed: {str(e)}"
        )