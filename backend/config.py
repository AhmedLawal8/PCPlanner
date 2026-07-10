import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.environ.get("SECRET_KEY")
YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
