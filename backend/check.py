import json
import os

RAW_DATA_DIR = os.path.join(os.path.dirname(__file__), "raw_data")

def analyze_json(filename):
    with open(os.path.join(RAW_DATA_DIR, filename), encoding="utf-8") as f:
        data =  json.load(f)

    total = len(data)
    if total == 0:
        print(f"[{filename}] No records found.")
        return

    # Collect all keys across all records
    all_keys = set()
    for item in data:
        all_keys.update(item.keys())

    print(f"\n{'='*55}")
    print(f"  File: {filename}")
    print(f"  Total records: {total:,}")
    print(f"{'='*55}")
    print(f"  {'Field':<30} {'Present':>8}  {'%':>6}  {'Null/Empty':>10}  {'%':>6}")
    print(f"  {'-'*28} {'-'*8}  {'-'*6}  {'-'*10}  {'-'*6}")

    for key in sorted(all_keys):
        present   = sum(1 for item in data if key in item)
        non_null  = sum(1 for item in data if item.get(key) not in (None, "", []))
        null_count = present - non_null
        pct_present  = (present  / total) * 100
        pct_null     = (null_count / total) * 100 if present > 0 else 0

        print(f"  {key:<30} {present:>8,}  {pct_present:>5.1f}%  {null_count:>10,}  {pct_null:>5.1f}%")

    # Usable = has a price that's not null
    usable = sum(1 for item in data if item.get("price") not in (None, "", 0))
    print(f"\n  >>> Usable records (price not null): {usable:,} / {total:,}  ({usable/total*100:.1f}%)")
    print(f"  >>> Unusable (no price):             {total - usable:,} / {total:,}  ({(total-usable)/total*100:.1f}%)")


if __name__ == "__main__":
    # Run on case.json first, then optionally others
    files_to_check = [
        "case.json",
        # Uncomment to check others:
        "cpu.json",
        "memory.json",
        "motherboard.json",
        "power-supply.json",
        "video-card.json",
        "internal-hard-drive.json",
    ]

    for f in files_to_check:
        try:
            analyze_json(f)
        except FileNotFoundError:
            print(f"\n[ERROR] {f} not found in {RAW_DATA_DIR}")
        except json.JSONDecodeError as e:
            print(f"\n[ERROR] Failed to parse {f}: {e}")