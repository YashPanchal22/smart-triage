"""Database setup — SQLite by default, PostgreSQL/MySQL via DATABASE_URL."""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

raw_url = os.getenv("DATABASE_URL", "sqlite:///./smart_triage.db")

# Dynamically resolve relative SQLite database path
if raw_url.startswith("sqlite:///") and not raw_url.startswith("sqlite:////"):
    from pathlib import Path
    rel_path = raw_url.replace("sqlite:///", "").lstrip("./")
    backend_dir = Path(__file__).resolve().parent.parent
    root_dir = backend_dir.parent

    backend_candidate = backend_dir / rel_path
    root_candidate = root_dir / rel_path

    if backend_candidate.exists():
        DATABASE_URL = f"sqlite:///{backend_candidate.resolve().as_posix()}"
    elif root_candidate.exists() and root_candidate.stat().st_size > 0:
        DATABASE_URL = f"sqlite:///{root_candidate.resolve().as_posix()}"
    else:
        DATABASE_URL = f"sqlite:///{backend_candidate.resolve().as_posix()}"
else:
    DATABASE_URL = raw_url

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
