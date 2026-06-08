import os
from apify_client import ApifyClient

client = ApifyClient(os.environ.get("APIFY_API_TOKEN", ""))


async def run_google_maps_scraper(query: str, location: str, max_results: int) -> list:
    run_input = {
        "searchStringsArray": [query],
        "locationQuery": location,
        "maxCrawledPlacesPerSearch": max_results,
        "language": "it",
        "skipClosedPlaces": False,
        "scrapeContacts": True,  # extract emails/socials from the place website
    }
    run = client.actor("compass/crawler-google-places").call(run_input=run_input)
    items = []
    for item in client.dataset(run["defaultDatasetId"]).iterate_items():
        # email can come back under a few shapes depending on the actor version
        email = None
        emails = item.get("emails") or item.get("contactDetails", {}).get("emails")
        if isinstance(emails, list) and emails:
            email = emails[0]
        elif isinstance(emails, str):
            email = emails

        items.append({
            "name": item.get("title"),
            "email": email,
            "phone": item.get("phone"),
            "website": item.get("website"),
            "address": item.get("address"),
            "rating": item.get("totalScore"),
            "reviews": item.get("reviewsCount"),
            "category": item.get("categoryName"),
            "source": "google_maps",
        })
    return items


def _first(*vals):
    for v in vals:
        if v:
            return v
    return None


async def run_linkedin_scraper(query: str, location: str | None, max_results: int) -> list:
    run_input = {
        "searchQuery": query,
        "maxItems": max_results,
        "profileScraperMode": "Full + email search",
    }
    if location:
        run_input["locations"] = [location]

    run = client.actor("harvestapi/linkedin-profile-search").call(run_input=run_input)
    items = []
    for item in client.dataset(run["defaultDatasetId"]).iterate_items():
        # Name can be a single field or first/last
        name = _first(
            item.get("name"),
            item.get("fullName"),
            " ".join(filter(None, [item.get("firstName"), item.get("lastName")])) or None,
        )

        # Current position: array or object depending on mode
        company = None
        title = item.get("headline")
        pos = item.get("currentPosition") or item.get("experience")
        if isinstance(pos, list) and pos:
            company = _first(pos[0].get("companyName"), pos[0].get("company"))
            title = _first(title, pos[0].get("title"), pos[0].get("position"))
        elif isinstance(pos, dict):
            company = _first(pos.get("companyName"), pos.get("company"))

        company = _first(company, item.get("companyName"))

        # Location can be a string or an object
        loc = item.get("location")
        if isinstance(loc, dict):
            loc = _first(loc.get("linkedinText"), loc.get("text"), loc.get("name"))

        items.append({
            "name": name,
            "email": item.get("email"),
            "title": title,
            "company": company,
            "address": loc,
            "website": _first(item.get("linkedinUrl"), item.get("url")),
            "source": "linkedin",
        })
    return items
