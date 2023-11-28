from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import asyncio
from api.fetch_data import fetch_data
import pandas as pd

# Setup FastAPI app
app = FastAPI(title="API Server", description="API Server", version="v1")

# Enable CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    print("Startup tasks")
    # Get labeled data
    asyncio.create_task(fetch_data())

# Routes
@app.get("/")
async def get_index():
    return {"message": "Welcome to the API Service"}
