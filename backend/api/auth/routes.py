from flask import Blueprint, request, jsonify, session

from .user_auth import create_account, verify_login, get_user


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth") #create a blueprint for routes to prevent having long app.py

#Api to register user
@auth_bp.route("/register", methods=["POST"])
def register():

    #silent = True supresses parsing error so if its a malformed request data would just be none.
    data = request.get_json(silent=True)
    
    if data is None:
    # if data is none stop execution immediately and return a correct 400 error
        return jsonify({"error": "Invalid or missing JSON data"}), 400
    
    #Make sure calling .strip() doesnt break program if username isnt in json
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    #check to have both
    if not username or not password:
        return jsonify({"error": "Username and password are required."}), 400

    try:
        user = create_account(username, password)
        session["user_id"] = user.id
        return jsonify({"id": user.id, "username": user.username}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 409

@auth_bp.route("/login", methods=["POST"])
def login():

    data = request.get_json(silent = True)

    if data is None:
    # if data is none stop execution immediately and return a correct 400 error
        return jsonify({"error": "Invalid or missing JSON data"}), 400
    
    #Make sure calling .strip() doesnt break program if username isnt in json
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    #check to have both
    if not username or not password:
        return jsonify({"error": "Username and password are required."}), 400

    user = verify_login(username, password)
    if user is None:
        return jsonify({"error": "Invalid username or password."}), 401

    session["user_id"] = user.id
    return jsonify({"id": user.id, "username": user.username})

@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully."})