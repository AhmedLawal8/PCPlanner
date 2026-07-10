from flask import Blueprint, jsonify, request
from .auth import login_required
from youtube_client import search_video
from models.tables import Build

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


@guides_bp.route("/", methods=["GET"])
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


@guides_bp.route("/part/<int:build_id>", methods=["GET"])
def get_build_guides(build_id):
    """Return YouTube guides related to one of the current user's saved builds."""
    user_id, err = login_required()
    if err:
        return err

    build = Build.query.filter_by(id=build_id, user_id=user_id).first()
    if build is None:
        return jsonify({"error": "Build not found."}), 404

    queries = [
        f"{build.cpu.name} {build.gpu.name} PC build tutorial",
        f"{build.cpu.name} installation",
        f"{build.gpu.name} review",
    ]

    guides = []
    for query in queries:
        video = search_video(query)
        if video is not None:
            guides.append(video)

    return jsonify(guides)
