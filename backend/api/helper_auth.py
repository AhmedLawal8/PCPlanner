import bcrypt
from models.db import db
from models.tables import Users


def hash_password(plain_password):
    """
    Hash a plain-text password using bcrypt.
    """

    byte = plain_password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(byte, salt)
    return hashed.decode("utf-8") #return as a str instead of bytes

def get_user(username):
    """
    Retrieve a user by username.
    """
    return Users.query.filter_by(username=username).first()


def create_account(username, plain_password):
    """
    Create a new user account.
    """
    if get_user(username) is not None:
        raise ValueError("Username already taken.")
    
    try:
        user = Users(username=username, hashed_password=hash_password(plain_password))
        db.session.add(user)
        db.session.commit()
        return user
    except Exception:
        db.session.rollback()  # clears the broken session state
        raise  # let Flask return a 500
        
def verify_login(username, plain_password):
    """
    Check a login attempt against the stored hash.
    """
    user = get_user(username)
    if user is None:
        return None
    if not bcrypt.checkpw(plain_password.encode("utf-8"), user.hashed_password.encode("utf-8")):
        return None
    return user

       