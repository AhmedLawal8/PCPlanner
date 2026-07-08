import json
import os

from app import create_app
from models.db import db
from models.tables import CPU, Motherboard, GPU, RAM, Storage, PSU, Case, Cooler

app = create_app()

RAW_DATA_DIR = os.path.join(os.path.dirname(__file__), "raw_data")


def load(filename):
    #helper function to load a JSON file from the raw_data directory 
    #for every table respectively 
    with open(os.path.join(RAW_DATA_DIR, filename), encoding="utf-8") as f:
        return json.load(f)


def build_cpus():
    rows = []
    for item in load("cpu.json"):
        rows.append({
            "name": item["name"],
            "price": item["price"],
            "cores": item.get("core_count"),
            "threads": None,  # not present in scraped data
            "base_clock": item.get("core_clock"),
            "boost_clock": item.get("boost_clock"),
            "wattage": item.get("tdp"),
            "socket": None,  # backfilled by scripts/enrich_compat.py
            "microarchitecture": item.get("microarchitecture"),
        })
    return rows


def build_motherboards():
    rows = []
    for item in load("motherboard.json"):
        rows.append({
            "name": item["name"],
            "price": item["price"],
            "chipset": None,  # not present in scraped data
            "type": item.get("form_factor"),
            "socket": item.get("socket"),
            "memory_type": None,  # not reliably derivable from scraped fields
            "max_memory": item.get("max_memory"),
        })
    return rows


def build_gpus():
    rows = []
    for item in load("video-card.json"):
        rows.append({
            "name": item["name"],
            "price": item["price"],
            "vram": item.get("memory"),
            "base_clock": item.get("core_clock"),
            "boost_clock": item.get("boost_clock"),
            "wattage": None,  # not present in scraped data
            "chipset": item.get("chipset"),
        })
    return rows


def build_rams():
    rows = []
    for item in load("memory.json"):
        speed = item.get("speed") or [None, None]
        modules = item.get("modules") or [None, None]
        gen, mhz = speed #the dictionary value for this one gives two values we need split.
        module_count, module_size = modules
        capacity = module_count * module_size if module_count and module_size else None
        rows.append({
            "name": item["name"],
            "price": item["price"],
            "capacity": capacity,
            "speed": mhz,
            "memory_type": f"DDR{gen}" if gen else None,
        })
    return rows


def build_storages():
    rows = []
    for item in load("internal-hard-drive.json"):
        rows.append({
            "name": item["name"],
            "price": item["price"],
            "capacity": item.get("capacity"),
            "drive_type": item.get("type"),
            "interface": item.get("interface"),
        })
    return rows


def build_psus():
    rows = []
    for item in load("power-supply.json"):
        rows.append({
            "name": item["name"],
            "price": item["price"],
            "wattage": item.get("wattage"),
            "efficiency_rating": item.get("efficiency"),
        })
    return rows


def build_cases():
    rows = []
    for item in load("case.json"):
        rows.append({
            "name": item["name"],
            "price": item["price"],
            "case_type": item.get("type"),
            "color": item.get("color"),
        })
    return rows


def average_if_range(value):
    # rpm/noise_level are sometimes a [min, max] range instead of a single
    # number; collapse that down to one representative value.
    if isinstance(value, list):
        return sum(value) / len(value)
    return value


def build_coolers():
    rows = []
    for item in load("cpu-cooler.json"):
        rows.append({
            "name": item["name"],
            "price": item["price"],
            "rpm": average_if_range(item.get("rpm")),
            "noise_level": average_if_range(item.get("noise_level")),
            "color": item.get("color"),
            "radiator_size": item.get("size"),
        })
    return rows


def main():
    with app.app_context():
        db.create_all()
        for model in (CPU, Motherboard, GPU, RAM, Storage, PSU, Case, Cooler):
            db.session.query(model).delete()

        db.session.bulk_insert_mappings(CPU, build_cpus())
        db.session.bulk_insert_mappings(Motherboard, build_motherboards())
        db.session.bulk_insert_mappings(GPU, build_gpus())
        db.session.bulk_insert_mappings(RAM, build_rams())
        db.session.bulk_insert_mappings(Storage, build_storages())
        db.session.bulk_insert_mappings(PSU, build_psus())
        db.session.bulk_insert_mappings(Case, build_cases())
        db.session.bulk_insert_mappings(Cooler, build_coolers())

        db.session.commit()
        print("Database complete.")


if __name__ == "__main__":
    main()
