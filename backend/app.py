from flask import Flask
import os

from models.db import db
from config import SECRET_KEY

def create_app():
    app = Flask(__name__, instance_relative_config=True)

    os.makedirs(app.instance_path, exist_ok=True)

    app.config["SQLALCHEMY_DATABASE_URI"] = (
        "sqlite:///" + os.path.join(app.instance_path, "pcbuilder.db")
    )
    app.config["SECRET_KEY"] = SECRET_KEY
    
    db.init_app(app)
    from auth.routes import auth_bp
    app.register_blueprint(auth_bp)


    return app