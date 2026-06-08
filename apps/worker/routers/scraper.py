from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.apify_service import run_google_maps_scraper, run_linkedin_scraper

router = APIRouter()


class GoogleMapsRequest(BaseModel):
    query: str
    location: str
    max_results: int = 20


class LinkedInRequest(BaseModel):
    query: str
    location: str | None = None
    max_results: int = 20


@router.post("/google-maps")
async def scrape_google_maps(req: GoogleMapsRequest):
    try:
        leads = await run_google_maps_scraper(req.query, req.location, req.max_results)
        return {"leads": leads, "count": len(leads)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/linkedin")
async def scrape_linkedin(req: LinkedInRequest):
    try:
        leads = await run_linkedin_scraper(req.query, req.location, req.max_results)
        return {"leads": leads, "count": len(leads)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
