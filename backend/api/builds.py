from flask import Blueprint, request, jsonify, session
from models.db import db
from models.tables import Build
from generate_build import check_compatibility

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
    for category in CATEGORY_TO_FK:
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

# POST /api/builds/generate
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

# POST /api/builds/save
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

# GET /api/builds/  — list all builds for the logged-in user
@builds_bp.route("/", methods=["GET"])
def list_builds():
    user_id, err = login_required()
    if err:
        return err

    builds = Build.query.filter_by(user_id=user_id).order_by(Build.created_at.desc()).all()
    return jsonify([serialize_build(b) for b in builds])

# GET /api/builds/<id>  — load one build (must belong to the current user)
@builds_bp.route("/<int:build_id>", methods=["GET"])
def get_build(build_id):
    user_id, err = login_required()
    if err:
        return err

    build = Build.query.filter_by(id=build_id, user_id=user_id).first()
    if build is None:
        return jsonify({"error": "Build not found."}), 404

    return jsonify(serialize_build(build))

# DELETE /api/builds/<id>
@builds_bp.route("/<int:build_id>", methods=["DELETE"])
def delete_build(build_id):
    user_id, err = login_required()
    if err:
        return err

    build = Build.query.filter_by(id=build_id, user_id=user_id).first()
    if build is None:
        return jsonify({"error": "Build not found."}), 404

    db.session.delete(build)
    db.session.commit()
    return jsonify({"message": "Build deleted."})

# PATCH /api/builds/build_id   — rename or swap component(s)
# Accepts any combo of: { name: "", cpu: "", gpu: "", ... }
@builds_bp.route("/<int:build_id>", methods=["PATCH"]) # Use patch since user might change one component instead of sending whole resource
def update_build(build_id):
    user_id, err = login_required()
    if err:
        return err

    build = Build.query.filter_by(id=build_id, user_id=user_id).first()
    if build is None:
        return jsonify({"error": "Build not found."}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid or missing JSON."}), 400

    # allow renaming
    if "name" in data:
        build.name = (data["name"] or "My Build").strip() or "My Build"

    # allow swapping any individual component by passing its FK column directly
    # e.g { "cpu": 42 }
    for category, fk_col in CATEGORY_TO_FK.items():
        if category in data:
            setattr(build, fk_col, data[category])

    # Recalculate total price from the relationships
    total = 0
    for category in CATEGORY_TO_FK:
        part = getattr(build, category)
        if part and part.price:
            total += part.price
    build.total_price = round(total, 2)

    selected = {
        category: getattr(build, category)
        for category in CATEGORY_TO_FK
        if getattr(build, category) is not None
    }
    
    warnings = check_compatibility(selected)
    db.session.commit()

    return jsonify({**serialize_build(build), "warnings": warnings})

