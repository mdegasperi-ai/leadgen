import os
import anthropic

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))


async def score_lead(lead: dict, icp_description: str) -> dict:
    prompt = f"""You are a B2B sales expert. Score this lead from 0 to 100 based on how well it matches the ICP.

ICP: {icp_description}

Lead:
- Name: {lead.get('name')}
- Company: {lead.get('company')}
- Title: {lead.get('title')}
- Website: {lead.get('website')}
- Description: {lead.get('description')}

Respond with JSON only: {{"score": <0-100>, "reason": "<one sentence>"}}"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=256,
        messages=[{"role": "user", "content": prompt}],
    )

    import json
    text = message.content[0].text.strip()
    return json.loads(text)


async def generate_opening_message(lead: dict, icp_description: str) -> dict:
    prompt = f"""Write a short, personalized cold outreach opening (2-3 sentences max) for this B2B lead.
Be specific, avoid generic phrases, reference something concrete about them.

Lead:
- Name: {lead.get('name')}
- Company: {lead.get('company')}
- Title: {lead.get('title')}
- Description: {lead.get('description')}

Respond with JSON only: {{"message": "<the opening message>", "subject": "<email subject line>"}}"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )

    import json
    text = message.content[0].text.strip()
    return json.loads(text)
