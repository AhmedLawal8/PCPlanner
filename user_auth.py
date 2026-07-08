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
    return hashed


def get_user(username):
    """
    Retrieve a user by username.
    """
    return db.session.query(Users).filter_by(username=username).first()


def create_account(username, plain_password):
    """
    Create a new user account.
    """

    try:
        if db.session.query(Users).filter_by(username=username).first() is not None:
            return "Please try a different username, this one is already taken."

        hashed = hash_password(plain_password)

        user = Users(username=username, hashed_password=hashed.decode("utf-8"))
        db.session.add(user)
        db.session.commit()
        return "You have successfully created an account! Please log in to continue."

    except Exception:
        db.session.rollback()
        raise


def verify_login(username, plain_password):
    """
    Check a login attempt against the stored hash.
    """
    user = get_user(username)

    if user is None:
        return False

    byte = plain_password.encode("utf-8")
    hashed = user.hashed_password.encode("utf-8")

    return bcrypt.checkpw(byte, hashed)
