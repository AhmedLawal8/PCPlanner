from .db import db

class Users(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String, unique=True, index=True)
    hashed_password = db.Column(db.String)
    builds = db.relationship("Build", back_populates="user")
    
class CPU(db.Model):
    __tablename__ = "cpus"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, index=True)
    price = db.Column(db.Float)
    cores = db.Column(db.Integer)
    threads = db.Column(db.Integer)
    base_clock = db.Column(db.Float)
    boost_clock = db.Column(db.Float)
    wattage = db.Column(db.Integer)
    socket = db.Column(db.String)
    microarchitecture = db.Column(db.String)
    graphics = db.Column(db.String)
    # The scraped data has no "socket" field directly, only
    # "microarchitecture" (e.g. "Zen 4", "Raptor Lake"). socket is backfilled
    # from microarchitecture by enrich_compat.py.
    # graphics is the integrated GPU name (e.g. "Radeon"), or null if the
    # CPU has none -- used to keep GPU-less use cases (e.g. "general")
    # from ever recommending a CPU with no video output at all.

class Motherboard(db.Model):
    __tablename__ = "motherboards"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, index=True)
    price = db.Column(db.Float)
    chipset = db.Column(db.String)
    type = db.Column(db.String)
    socket = db.Column(db.String)
    memory_type = db.Column(db.String) # "DDR4" or "DDR5"
    max_memory = db.Column(db.Integer)  # max supported RAM, in GB
    
class GPU(db.Model):
    __tablename__ = "gpus"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, index=True)
    price = db.Column(db.Float)
    vram = db.Column(db.Integer)
    base_clock = db.Column(db.Float)
    boost_clock = db.Column(db.Float)
    wattage = db.Column(db.Integer)
    chipset = db.Column(db.String)
    # chipset (e.g. "GeForce RTX 4070") matters for wattage lookup
    
class RAM(db.Model):
    __tablename__ = "rams"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, index=True)
    price = db.Column(db.Float)
    capacity = db.Column(db.Integer)
    speed = db.Column(db.Float)
    memory_type = db.Column(db.String) # "DDR4" or "DDR5"

class Storage(db.Model):
    __tablename__ = "storages"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, index=True)
    price = db.Column(db.Float)
    capacity = db.Column(db.Integer)
    drive_type = db.Column(db.String)
    interface = db.Column(db.String)

class PSU(db.Model):
    __tablename__ = "psus"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, index=True)
    price = db.Column(db.Float)
    wattage = db.Column(db.Integer)
    efficiency_rating = db.Column(db.String)

class Case(db.Model):
    __tablename__ = "cases"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, index=True)
    price = db.Column(db.Float)
    case_type = db.Column(db.String)
    color = db.Column(db.String)


class Cooler(db.Model):
    __tablename__ = "coolers"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, index=True)
    price = db.Column(db.Float)
    rpm = db.Column(db.Float)
    noise_level = db.Column(db.Float)
    color = db.Column(db.String)
    radiator_size = db.Column(db.Integer)
    # radiator_size is null for air coolers; only AIO/liquid coolers report it.
    # No socket data in the source dataset, so we treat coolers as universally
    # compatible (modern coolers ship with multi-socket mounting hardware).

# Store user builds
class Build(db.Model):
    __tablename__ = "builds"

    id           = db.Column(db.Integer, primary_key=True)
    user_id      = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    name         = db.Column(db.String, nullable=False, default="My Build")
    total_price  = db.Column(db.Float)
    summary      = db.Column(db.Text)   # Geminis summary blurb should be pretty useful
    created_at   = db.Column(db.DateTime, server_default=db.func.now())

    #Reference ids at components tables
    cpu_id          = db.Column(db.Integer, db.ForeignKey("cpus.id"),          nullable=True)
    gpu_id          = db.Column(db.Integer, db.ForeignKey("gpus.id"),          nullable=True)
    motherboard_id  = db.Column(db.Integer, db.ForeignKey("motherboards.id"),  nullable=True)
    ram_id          = db.Column(db.Integer, db.ForeignKey("rams.id"),          nullable=True)
    storage_id      = db.Column(db.Integer, db.ForeignKey("storages.id"),      nullable=True)
    psu_id          = db.Column(db.Integer, db.ForeignKey("psus.id"),          nullable=True)
    case_id         = db.Column(db.Integer, db.ForeignKey("cases.id"),         nullable=True)
    cooler_id       = db.Column(db.Integer, db.ForeignKey("coolers.id"),       nullable=True)


    user         = db.relationship("Users",       back_populates="builds")
    cpu          = db.relationship("CPU")
    gpu          = db.relationship("GPU")
    motherboard  = db.relationship("Motherboard")
    ram          = db.relationship("RAM")
    storage      = db.relationship("Storage")
    psu          = db.relationship("PSU")
    case         = db.relationship("Case")
    cooler       = db.relationship("Cooler")