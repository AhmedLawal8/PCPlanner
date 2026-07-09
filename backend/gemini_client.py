import json
import os
import re

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
model_name = "gemini-flash-lite-latest"
search_tool = types.Tool(google_search=types.GoogleSearch())


def ask_gemini(prompt, use_search=False):
    """
    Send a prompt to Gemini and return the answer as plain text.

    use_search=True enables web search grounding, turn it on when
    Gemini needs to look up real-world facts it might not already know
    (e.g. a brand-new GPU's wattage). Leave it off when Gemini only needs
    to reason over data already included in the prompt, it's faster
    and cheaper with nothing to look up.
    """
    config = None
    if use_search:
        config = types.GenerateContentConfig(tools=[search_tool])
    response = client.models.generate_content(
        model=model_name, contents=prompt, config=config,
    )
    return response.text.strip()


def parse_json_answer(answer):
    """Strip markdown code fences (Gemini adds them sometimes despite
    being told not to) and parse JSON."""
    cleaned = re.sub(
        r"^```(json)?|```$", "", answer.strip(), flags=re.MULTILINE
    ).strip()
    return json.loads(cleaned)
