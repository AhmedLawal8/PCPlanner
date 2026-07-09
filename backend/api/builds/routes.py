from flask import Blueprint, request, jsonify, session
from models.db import db
from models.tables import Build

builds_bp = Blueprint("builds", __name__, url_prefix="/api/builds")

# Maps the category name the frontend sends to the FK column name on Build
CATEGORY_TO_FK = {
    "cpu":         "cpu_id",
    "gpu":         "gpu_id",
    "motherboard": "motherboard_id",
    "ram":         "ram_id",
    "storage":     "storage_id",
    "psu":         "psu_id",
    "case":        "case_id",
    "cooler":      "cooler_id",
}

def login_required():
    """Returns (user_id, None) if logged in, or (None, error_response) if not."""
    user_id = session.get("user_id")
    if not user_id:
        return None, (jsonify({"error": "Login required."}), 401)
    return user_id, None