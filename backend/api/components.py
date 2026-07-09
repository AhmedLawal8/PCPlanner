from flask import Blueprint, jsonify

from models.tables import CPU, Motherboard, GPU, RAM, Storage, PSU, Case, Cooler

components_bp = Blueprint("components", __name__, url_prefix="/api/components")

# Map URL type string to its model and relevant fields
COMPONENT_MAP = {
    "cpu":         (CPU,         ["id", "name", "price", "cores", "threads", "base_clock", "boost_clock", "wattage", "socket", "microarchitecture", "graphics"]),
    "motherboard": (Motherboard, ["id", "name", "price", "chipset", "type", "socket", "memory_type", "max_memory"]),
    "gpu":         (GPU,         ["id", "name", "price", "vram", "base_clock", "boost_clock", "wattage", "chipset"]),
    "ram":         (RAM,         ["id", "name", "price", "capacity", "speed", "memory_type"]),
    "storage":     (Storage,     ["id", "name", "price", "capacity", "drive_type", "interface"]),
    "psu":         (PSU,         ["id", "name", "price", "wattage", "efficiency_rating"]),
    "case":        (Case,        ["id", "name", "price", "case_type", "color"]),
    "cooler":      (Cooler,      ["id", "name", "price", "rpm", "noise_level", "color", "radiator_size"]),
}

def serialize(component, fields):
    return {f: getattr(component, f) for f in fields}

# GET /api/components/type/id -- get component information from db using component type and id
# Route to get specific component information eg /cpu/23 or /gpu/12
@components_bp.route("/<type>/<int:id>", methods=["GET"])
def get_component(type, id):
    #Check to make sure component is in the map
    if type not in COMPONENT_MAP:
        return jsonify({"error": f"Unknown component type '{type}'."}), 404

    #returns a tuple of the component type eg Storage and the fields (columns) it contains
    model, fields = COMPONENT_MAP[type]
    
    # Each model has db backed into it
    component = model.query.get(id)

    if component is None:
        return jsonify({"error": f"{type} with id {id} not found."}), 404

    return jsonify(serialize(component, fields))