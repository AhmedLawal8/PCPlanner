from app import create_app
from generate_build import generate_build
from api.helper_auth import create_account, verify_login

USE_CASES = {
    "1": "gaming",
    "2": "production",
    "3": "general",
    "4": "streaming",
}


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


def prompt_budget():
    while True:
        raw = input("What's your total budget? ($450 - $5000): ").strip()
        try:
            budget = float(raw)
        except ValueError:
            print("Please enter a number.")
            continue
        if budget < 450 or budget > 5000:
            print("Budget must be between $450 and $5000.")
            continue
        return budget


def prompt_use_case():
    while True:
        print("\nWhat will you use this PC for?")
        print("1) Gaming")
        print("2) Creativity/Production")
        print("3) General use (browsing, light work)")
        print("4) Streaming")
        choice = input("Choose an option: ").strip()
        if choice in USE_CASES:
            return USE_CASES[choice]
        print("Not a valid option, try again.")


def generate_build_flow():
    budget = prompt_budget()
    use_case = prompt_use_case()

    try:
        result = generate_build(budget, use_case)
    except ValueError as error:
        print(error)
        return

    print(f"\n--- Your {use_case} build (${result['total_price']:.2f}) ---")
    for category, options in result["parts"].items():
        recommended = next((o for o in options if o["tier"] == "recommend"), options[0])
        print(f"[{category.upper()}] {recommended['name']} - ${recommended['price']:.2f}")
        print(f"    why: {recommended['why']}")
        others = len(options) - 1
        if others:
            print(f"    ({others} other option(s) available)")

    print(f"\nTotal: ${result['total_price']:.2f}")
    if result["summary"]:
        print(f"\n{result['summary']}")

def main():
    # DB schema/data setup lives in filltables.py, run that first if
    # you're on a fresh database.
    app = create_app()

    with app.app_context():
        while True:
            print("\n1) Sign up\n2) Log in\n3) Generate a build\n4) Exit")
            choice = input("Choose an option: ").strip()

            if choice == "1":
                sign_up_flow()
            elif choice == "2":
                log_in_flow()
            elif choice == "3":
                generate_build_flow()
            elif choice == "4":
                break
            else:
                print("Not a valid option, try again.")


if __name__ == "__main__":
    main()
