import json
import os

from db import Base, CPU, Case, GPU, Motherboard, PSU, RAM, SessionLocal, Storage, engine

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
            "socket": None,  # not present in scraped data; see db.py note
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
            "type": f"DDR{gen}" if gen else None,
        })
    return rows


def build_storages():
    rows = []
    for item in load("internal-hard-drive.json"):
        rows.append({
            "name": item["name"],
            "price": item["price"],
            "capacity": item.get("capacity"),
            "type": item.get("type"),
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
            "type": item.get("type"),
            "color": item.get("color"),
        })
    return rows


def main():
    Base.metadata.create_all(engine)

    session = SessionLocal()
    try:
        for model in (CPU, Motherboard, GPU, RAM, Storage, PSU, Case):
            session.query(model).delete() 
            # delete all existing rows in the table before inserting new data
            # in case someone wants to run scraper again to update the data,
            #  we don't want duplicates.

        session.bulk_insert_mappings(CPU, build_cpus())
        session.bulk_insert_mappings(Motherboard, build_motherboards())
        session.bulk_insert_mappings(GPU, build_gpus())
        session.bulk_insert_mappings(RAM, build_rams())
        session.bulk_insert_mappings(Storage, build_storages())
        session.bulk_insert_mappings(PSU, build_psus())
        session.bulk_insert_mappings(Case, build_cases())
        session.commit()
        print("Import complete.")
    finally:
        session.close()


if __name__ == "__main__":
    main()
