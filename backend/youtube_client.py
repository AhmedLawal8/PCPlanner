import os

import requests
from dotenv import load_dotenv
from config import YOUTUBE_API_KEY

search_url = "https://www.googleapis.com/youtube/v3/search"


def search_video(query):
    """
    Look up one YouTube video for a search query and return the basics
    the frontend needs to show it. Returns None if nothing came back
    (bad query, quota hit, key missing, whatever).

    This calls YouTube live, no caching, so keep the number of calls
    per request small. Search costs 100 quota units a call against a
    10k/day free quota, so don't go looping this over hundreds of parts.
    """
    if not YOUTUBE_API_KEY:
        print("search_video: no YOUTUBE_API_KEY set, skipping")
        return None

    params = {
        "key": YOUTUBE_API_KEY,
        "q": query,
        "part": "snippet",
        "type": "video",
        "maxResults": 1,
    }

    try:
        response = requests.get(search_url, params=params, timeout=10)
        response.raise_for_status()
        items = response.json().get("items", [])
    except requests.RequestException as error:
        print(f"search_video: request failed for '{query}': {error}")
        return None

    if not items:
        return None

    video = items[0]
    video_id = video["id"]["videoId"]
    snippet = video["snippet"]

    return {
        "video_id": video_id,
        "title": snippet["title"],
        "thumbnail_url": snippet["thumbnails"]["medium"]["url"],
        "channel_title": snippet["channelTitle"],
        "url": f"https://www.youtube.com/watch?v={video_id}",
    }
