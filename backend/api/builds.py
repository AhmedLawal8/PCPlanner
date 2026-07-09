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

def serialize_build(build):
    # Turn a Build row into a JSON-friendly dict with full part details.
    parts = {}
    for category, fk_col in CATEGORY_TO_FK.items():
        part = getattr(build, category)  # uses the relationship, e.g. build.cpu
        if part is not None:
            parts[category] = {
                "id":    part.id,
                "name":  part.name,
                "price": part.price,
            }

    return {
        "id":          build.id,
        "name":        build.name,
        "total_price": build.total_price,
        "summary":     build.summary,
        "created_at":  build.created_at.isoformat(),
        "parts":       parts,
    }

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
    
# Expects: { name, total_price, summary, parts: { cpu: {id}, gpu: {id}, ... } }
@builds_bp.route("/save", methods=["POST"])
def save():
    user_id, err = login_required()
    if err:
        return err

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid or missing JSON."}), 400

    parts = data.get("parts", {})
    components = {}

    # maps to eg {"cpu":  "cpu_id",}
    for category, component in CATEGORY_TO_FK.items():
        # Get each category in parts (cpu, gpu, etc)
        part_data = parts.get(category)
        if part_data:
            #get the id from request
            components[component] = part_data.get("id")
    
    build = Build(
        user_id     = user_id,
        name        = (data.get("name") or "My Build").strip() or "My Build",
        total_price = data.get("total_price"),
        summary     = data.get("summary"),
        **components,
    )

    db.session.add(build)
    db.session.commit()
    return jsonify(serialize_build(build)), 201





