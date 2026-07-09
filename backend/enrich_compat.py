import time

from app import create_app
from gemini_client import ask_gemini, parse_json_answer
from models.db import db
from models.tables import CPU, GPU

delay_seconds = 13  # stay under the 5-requests-per-minute quota
chunk_size = 40      # how many chipsets to ask about per GPU call

# Wattages Gemini couldn't reliably answer even with search enabled,
# mostly hardware too new (as of writing) to have indexed reference specs,
# plus one source-data naming quirk. Confirmed by hand. Applied before any
# AI call is made, so re-running this on a fresh database never wastes
# quota re-asking about these.
MANUAL_GPU_WATTAGE = {
    "Radeon RX 9070 XT": 304,
    "Radeon RX 9070": 220,
    "GeForce RTX 5050": 130,
    "GeForce RTX 5060": 145,
    "GeForce RTX 5060 Ti": 180,
    "GeForce RTX 5070": 250,
    "GeForce RTX 5070 Ti": 300,
    "GeForce RTX 5080": 360,
    "GeForce RTX 5090": 575,
    "Arc B570": 150,
    "Arc B580": 190,
    "T400  2GB": 30,  # double space here matches the source data's name
    "T400 4GB": 30,
}

# Radeon RX 9060 XT has two VRAM variants with different reference wattages,
# so it's keyed by (chipset, vram) instead of chipset alone.
MANUAL_GPU_WATTAGE_BY_VRAM = {
    ("Radeon RX 9060 XT", 16): 160,
    ("Radeon RX 9060 XT", 8): 150,
}


def lookup_sockets_batch(architectures):
    """Ask Gemini for the CPU socket of every microarchitecture in one
    call. Returns {name: socket}."""

    arch_list = "\n".join(f"- {a}" for a in architectures)
    prompt = (
        "For each CPU microarchitecture listed below, give the socket "
        "it uses.\n\n"
        f"{arch_list}\n\n"
        "Respond with ONLY a JSON object mapping each microarchitecture name "
        'exactly as given to its socket name, like: {"Zen 4": "AM5"}. '
        "No other text, no markdown code fences."
    )
    answer = ask_gemini(prompt, use_search=True)
    return parse_json_answer(answer)


def lookup_wattages_batch(chipsets):
    """Ask Gemini for the typical wattage of every chipset in one call.
    Returns {name: watts}."""

    chipset_list = "\n".join(f"- {c}" for c in chipsets)
    prompt = (
        "For each GPU chipset listed below, give its typical reference "
        f"board power (TDP) in watts.\n\n{chipset_list}\n\n"
        "Respond with ONLY a JSON object mapping each chipset name "
        'exactly as given to its wattage as a plain number, like: '
        '{"GeForce RTX 4070": 200}. '
        "No other text, no markdown code fences."
    )
    answer = ask_gemini(prompt, use_search=True)
    return parse_json_answer(answer)


def chunked(items, size):
    """Split a list into consecutive chunks of at most `size` items."""

    for i in range(0, len(items), size):
        yield items[i:i + size]


def enrich_cpu_sockets():
    """Look up and store the socket for every distinct CPU
    microarchitecture that doesn't have one yet."""

    architectures = [
        row[0]
        for row in CPU.query.filter(CPU.socket.is_(None))
        .with_entities(CPU.microarchitecture)
        .distinct()
        .all()
        if row[0] is not None
    ]
    if not architectures:
        print("Every microarchitecture already has a socket, nothing to do.")
        return
    count = len(architectures)
    print(f"Looking up sockets for {count} microarchitectures in one call...")

    try:
        results = lookup_sockets_batch(architectures)
    except Exception as error:
        print(f"  FAILED: {error}")
        return

    for arch, socket in results.items():
        CPU.query.filter_by(microarchitecture=arch).update({"socket": socket})
        print(f"  {arch} -> {socket}")
    db.session.commit()

    missing = set(architectures) - set(results)
    if missing:
        print(f"  No answer returned for: {sorted(missing)}")


def apply_manual_gpu_overrides():
    """Fill in known wattages Gemini can't reliably answer, before any
    AI call is made."""
    for chipset, watts in MANUAL_GPU_WATTAGE.items():
        GPU.query.filter(GPU.chipset == chipset,
                         GPU.wattage.is_(None)).update({"wattage": watts})
    for (chipset, vram), watts in MANUAL_GPU_WATTAGE_BY_VRAM.items():
        GPU.query.filter(
            GPU.chipset == chipset, GPU.vram == vram, GPU.wattage.is_(None)
        ).update({"wattage": watts})
    db.session.commit()


def enrich_gpu_wattages():
    """Look up and store the wattage for every distinct GPU chipset
    that doesn't have one yet."""
    apply_manual_gpu_overrides()

    chipsets = [
        row[0]
        for row in GPU.query.filter(GPU.wattage.is_(None))
        .with_entities(GPU.chipset)
        .distinct()
        .all()
        if row[0] is not None
    ]
    if not chipsets:
        print("Every chipset already has a wattage, nothing to do.")
        return
    count = len(chipsets)
    print(f"Looking up wattages for {count} chipsets "
          f"in chunks of {chunk_size}...")

    all_missing = set(chipsets)
    for batch in chunked(chipsets, chunk_size):
        try:
            results = lookup_wattages_batch(batch)
            answered = {
                chipset: watts
                for chipset, watts in results.items()
                if watts is not None
            }
            for chipset, wattage in answered.items():
                GPU.query.filter_by(chipset=chipset).update(
                    {"wattage": wattage})
                print(f"  {chipset} -> {wattage}W")
            db.session.commit()
            all_missing -= set(answered)
        except Exception as error:
            print(f"  FAILED batch of {len(batch)}: {error}")
        time.sleep(delay_seconds)

    if all_missing:
        print(f"  No answer returned for: {sorted(all_missing)}")


def main():
    app = create_app()
    with app.app_context():
        enrich_cpu_sockets()
        enrich_gpu_wattages()
    print("Enrichment complete.")


if __name__ == "__main__":
    main()
