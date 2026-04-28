import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()
database_url = os.getenv("DATABASE_URL", "sqlite:///./openmind.db")
connect_args = {}
if database_url.startswith("sqlite:///"):
    sqlite_path = Path(database_url.replace("sqlite:///", "", 1))
    sqlite_path.parent.mkdir(parents=True, exist_ok=True)
    database_url = f"sqlite:///{sqlite_path.as_posix()}"
    connect_args = {"check_same_thread": False}
engine = create_engine(database_url, connect_args=connect_args, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
