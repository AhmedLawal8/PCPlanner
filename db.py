from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

database_url = os.getenv("DATABASE_URL")

engine = create_engine(database_url)

SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()


class CPU(Base):
    __tablename__ = "cpus"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(Float)
    cores = Column(Integer)
    threads = Column(Integer)
    base_clock = Column(Float)
    boost_clock = Column(Float)
    wattage = Column(Integer)
    socket = Column(String)
    # The scraped data has no "socket" field directly  only
    # "microarchitecture" (e.g. "Zen 4", "Raptor Lake"). 
    # We will see if ai can handle the task of finding compat regardless.


class Motherboard(Base):
    __tablename__ = "motherboards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(Float)
    chipset = Column(String)
    type = Column(String)
    socket = Column(String)
    memory_type = Column(String)   # "DDR4" or "DDR5"
    max_memory = Column(Integer)   # max supported RAM, in GB
    


class GPU(Base):
    __tablename__ = "gpus"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(Float)
    vram = Column(Integer)
    base_clock = Column(Float)
    boost_clock = Column(Float)
    wattage = Column(Integer)
    chipset = Column(String)
    # chipset (e.g. "GeForce RTX 4070") matters for wattage lookup
    


class RAM(Base):
    __tablename__ = "rams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(Float)
    capacity = Column(Integer)
    speed = Column(Float)
    type = Column(String)  # "DDR4" or "DDR5"


class Storage(Base):
    __tablename__ = "storages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(Float)
    capacity = Column(Integer)
    type = Column(String)
    interface = Column(String)


class PSU(Base):
    __tablename__ = "psus"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(Float)
    wattage = Column(Integer)
    efficiency_rating = Column(String)


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(Float)
    type = Column(String)
    color = Column(String)
