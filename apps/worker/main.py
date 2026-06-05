from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import scraper, leads

app = FastAPI(title="Leadgen Worker", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scraper.router, prefix="/scraper", tags=["scraper"])
app.include_router(leads.router, prefix="/leads", tags=["leads"])


@app.get("/health")
def health():
    return {"status": "ok"}
