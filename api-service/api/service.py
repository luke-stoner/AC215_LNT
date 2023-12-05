from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import asyncio
import schedule
import api.scrape_and_label as scrape_and_label

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

# Create task to run fetch data script
def run_scrape_and_label():
    print("Fetching data...")
    asyncio.run(scrape_and_label())

# Function to schedule the task every Sunday at 6 PM local time
def schedule_fetch_data():
    schedule.every().sunday.at("18:00").do(run_scrape_and_label)

# Start the scheduling
schedule_fetch_data()

# Routes
@app.get("/")
async def get_index():
    return {"message": "Welcome to the API Service"}