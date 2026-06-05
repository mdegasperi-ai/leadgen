import os
from apify_client import ApifyClient

client = ApifyClient(os.environ.get("APIFY_API_TOKEN", ""))


async def run_google_maps_scraper(query: str, location: str, max_results: int) -> list:
    run_input = {
        "searchStringsArray": [f"{query} {location}"],
        "maxCrawledPlacesPerSearch": max_results,
        "language": "it",
    }
    run = client.actor("apify/google-maps-scraper").call(run_input=run_input)
    items = []
    for item in client.dataset(run["defaultDatasetId"]).iterate_items():
        items.append({
            "name": item.get("title"),
            "phone": item.get("phone"),
            "website": item.get("website"),
            "address": item.get("address"),
            "rating": item.get("totalScore"),
            "reviews": item.get("reviewsCount"),
            "category": item.get("categoryName"),
            "source": "google_maps",
        })
    return items


async def run_linkedin_scraper(keywords: str, location: str | None, max_results: int) -> list:
    run_input = {
        "searchUrl": f"https://www.linkedin.com/search/results/people/?keywords={keywords}",
        "maxResults": max_results,
    }
    run = client.actor("apify/linkedin-profile-scraper").call(run_input=run_input)
    items = []
    for item in client.dataset(run["defaultDatasetId"]).iterate_items():
        items.append({
            "name": item.get("fullName"),
            "title": item.get("headline"),
            "company": item.get("companyName"),
            "location": item.get("location"),
            "profile_url": item.get("linkedinUrl"),
            "source": "linkedin",
        })
    return items
