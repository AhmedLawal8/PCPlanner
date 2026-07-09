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

@builds_bp.route("/generate", methods=["POST"])
def generate():

    user_id, err = login_required()
    if err:
        return err
    
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid or missing JSON."}), 400

    budget   = data.get("budget")
    use_case = data.get("use_case")

    #make sure budget and use case is included in the request
    if not budget or not use_case:
        return jsonify({"error": "budget and use_case are required."}), 400
    
    # Input validation
    try:
        budget = float(budget)
    except (TypeError, ValueError):
        return jsonify({"error": "budget must be a number."}), 400
    
    try:
        from generate_build import generate_build
        result = generate_build(budget, use_case)
        return jsonify(result)
    except ValueError as e:
        # budget too low, unknown use_case, etc.
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Build generation failed.", "detail": str(e)}), 500

