from flask import Blueprint, request, jsonify, session

from .user_auth import create_account, verify_login


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth") #create a blueprint for routes to prevent having long app.py

#Api to register user

@auth_bp.route("/register", methods=["POST"])
def register():

    #silent = True supresses parsing error so if its a malformed request data would just be none.
    data = request.get_json(silent=True)
    
    if data is None:
    # if data is none stop execution immediately and return a correct 400 error
        return jsonify({"error": "Invalid or missing JSON data"}), 400
    
    username = data.get("username")
    password = data.get("password")

    result = create_account(username, password)

    return jsonify(result)