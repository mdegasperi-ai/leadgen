import os
import json
import re
import anthropic

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))
MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-3-5-haiku-latest")


def _extract_json(text: str) -> dict:
    """Extract a JSON object from the model response, tolerating markdown fences."""
    text = text.strip()
    # strip ```json ... ``` fences if present
    fence = re.search(r"\{.*\}", text, re.DOTALL)
    if fence:
        text = fence.group(0)
    return json.loads(text)


async def score_lead(lead: dict, icp_description: str) -> dict:
    icp = icp_description or "Generic B2B prospect for outreach"
    prompt = f"""You are a B2B sales expert. Score this lead from 0 to 100 based on how well it matches the ICP.

ICP: {icp}

Lead:
- Name: {lead.get('name')}
- Company: {lead.get('company')}
- Title: {lead.get('title')}
- Website: {lead.get('website')}
- Address: {lead.get('address')}
- Category: {lead.get('category')}

Respond with JSON only, no other text: {{"score": <0-100 integer>, "reason": "<one short sentence>"}}"""

    try:
        message = client.messages.create(
            model=MODEL,
            max_tokens=256,
            messages=[{"role": "user", "content": prompt}],
        )
        return _extract_json(message.content[0].text)
    except Exception as e:
        return {"score": None, "reason": f"AI error: {str(e)[:200]}"}


async def generate_opening_message(lead: dict, icp_description: str) -> dict:
    icp = icp_description or "Generic B2B prospect for outreach"
    prompt = f"""Write a short, personalized cold outreach opening in Italian (2-3 sentences max) for this lead.
Be specific, avoid generic phrases, reference something concrete about them.

Target customer profile: {icp}

Lead:
- Name: {lead.get('name')}
- Company: {lead.get('company')}
- Title: {lead.get('title')}
- Address: {lead.get('address')}
- Category: {lead.get('category')}

Respond with JSON only, no other text: {{"message": "<the opening message>", "subject": "<email subject line>"}}"""

    try:
        message = client.messages.create(
            model=MODEL,
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}],
        )
        return _extract_json(message.content[0].text)
    except Exception as e:
        return {"message": None, "subject": None, "error": f"AI error: {str(e)[:200]}"}
