import sys
import os
# Add parent directory to path to import common modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import uvicorn
from logger import Logger
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db import Extrinsic, Tick, Database
from datetime import datetime, timedelta
from typing import Optional


logger = Logger.get_logger(__name__)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = Database()
session = db.Session()


@app.get("/ticks/count")
async def get_ticks_count():
    return session.query(Tick).count()

@app.get("/ticks")
async def get_ticks(
    limit: Optional[int] = None,
    hours: Optional[int] = None,
    start_date: Optional[str] = None,
    start_time: Optional[str] = None,
    end_date: Optional[str] = None,
    end_time: Optional[str] = None
):
    query = session.query(Tick)
    
    if hours is not None:
        now = datetime.now()
        start_dt = now - timedelta(hours=hours)
        end_dt = now
        query = query.filter(Tick.timestamp >= start_dt, Tick.timestamp <= end_dt)
    elif start_date and start_time and end_date and end_time:
        start_dt = datetime.fromisoformat(f"{start_date}T{start_time}")
        end_dt = datetime.fromisoformat(f"{end_date}T{end_time}")
        query = query.filter(Tick.timestamp >= start_dt, Tick.timestamp <= end_dt)
    
    query = query.order_by(Tick.block_number.desc())
    if limit:
        query = query.limit(limit)
    return query.all()


@app.get("/extrinsics/count")
async def get_extrinsics_count():
    return session.query(Extrinsic).count()

@app.get("/extrinsics")
async def get_extrinsics(
    limit: Optional[int] = None,
    hours: Optional[int] = None,
    start_date: Optional[str] = None,
    start_time: Optional[str] = None,
    end_date: Optional[str] = None,
    end_time: Optional[str] = None
):
    query = session.query(Extrinsic)
    
    if hours is not None:
        now = datetime.now()
        start_dt = now - timedelta(hours=hours)
        end_dt = now
        query = query.filter(Extrinsic.timestamp >= start_dt, Extrinsic.timestamp <= end_dt)
    elif start_date and start_time and end_date and end_time:
        start_dt = datetime.fromisoformat(f"{start_date}T{start_time}")
        end_dt = datetime.fromisoformat(f"{end_date}T{end_time}")
        query = query.filter(Extrinsic.timestamp >= start_dt, Extrinsic.timestamp <= end_dt)
    
    query = query.order_by(Extrinsic.block_number.desc())
    if limit:
        query = query.limit(limit)
    return query.all()


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

