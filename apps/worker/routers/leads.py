from fastapi import APIRouter
from pydantic import BaseModel
from services.ai_service import score_lead, generate_opening_message

router = APIRouter()


class Lead(BaseModel):
    name: str
    company: str | None = None
    title: str | None = None
    website: str | None = None
    description: str | None = None


class ICPRequest(BaseModel):
    lead: Lead
    icp_description: str


@router.post("/score")
async def score(req: ICPRequest):
    result = await score_lead(req.lead.model_dump(), req.icp_description)
    return result


@router.post("/message")
async def message(req: ICPRequest):
    result = await generate_opening_message(req.lead.model_dump(), req.icp_description)
    return result
