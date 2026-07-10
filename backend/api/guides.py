from flask import Blueprint, jsonify, request

from youtube_client import search_video

guides_bp = Blueprint("guides", __name__, url_prefix="/api/guides")

# Canned searches for the general "how do I do this" videos, shown on the
# Guides page regardless of what build the user has. Add more here if we
# want more topics, each one is a live YouTube search though so don't go
# overboard.
GENERAL_TOPICS = {
    "first-build": "how to build a gaming pc full guide",
    "cable-management": "pc cable management tips for beginners",
    "thermal-paste": "how to apply thermal paste correctly",
    "windows-install": "how to install windows 11 from a usb drive",
}


@guides_bp.route("", methods=["GET"])
def get_general_guides():
    """One video per general topic. Live YouTube search each time this
    is hit, so this is an MVP-grade endpoint, not meant for heavy traffic."""
    guides = []
    for topic, query in GENERAL_TOPICS.items():
        video = search_video(query)
        if video is None:
            continue
        guides.append({**video, "topic": topic})
    return jsonify(guides)


@guides_bp.route("/part", methods=["GET"])
def get_part_guide():
    """One video for a specific part the user picked, e.g. a review or
    install guide. Expects ?category=gpu&name=Radeon RX 9070 XT."""
    category = request.args.get("category")
    name = request.args.get("name")
    if not category or not name:
        return jsonify({"error": "category and name are required."}), 400

    video = search_video(f"{name} review")
    if video is None:
        return jsonify(None)
    return jsonify(video)
