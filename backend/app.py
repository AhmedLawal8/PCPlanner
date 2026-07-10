from flask import Flask
from flask_cors import CORS
import os

from models.db import db
from config import SECRET_KEY
from api.auth import auth_bp
from api.components import components_bp
from api.builds import builds_bp

def create_app():
    app = Flask(__name__, instance_relative_config=True)
    CORS(app, origins=["http://localhost:5173"], supports_credentials=True)

    os.makedirs(app.instance_path, exist_ok=True)

    app.config["SQLALCHEMY_DATABASE_URI"] = (
        "sqlite:///" + os.path.join(app.instance_path, "pcbuilder.db")
    )
    app.config["SECRET_KEY"] = SECRET_KEY

    db.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(components_bp)
    app.register_blueprint(builds_bp)
    
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)