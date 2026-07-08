from app import create_app
from models.db import db
from backend.auth.user_auth import create_account, verify_login


def sign_up_flow():
    username = input("Choose a username: ")
    password = input("Choose a password: ")
    print(create_account(username, password))


def log_in_flow():
    username = input("Username: ")
    password = input("Password: ")
    if verify_login(username, password):
        print(f"Welcome back, {username}!")
    else:
        print("Invalid username or password.")


def main():
    app = create_app()

    with app.app_context():
        db.create_all()

        while True:
            print("\n1) Sign up\n2) Log in\n3) Exit")
            choice = input("Choose an option: ").strip()

            if choice == "1":
                sign_up_flow()
            elif choice == "2":
                log_in_flow()
            elif choice == "3":
                break
            else:
                print("Not a valid option, try again.")


if __name__ == "__main__":
    main()
