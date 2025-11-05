import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from urllib.parse import quote_plus

class Base(DeclarativeBase):
    pass

def _build_mysql_url() -> str:
    if os.getenv("MYSQL_URL"):
        return os.getenv("MYSQL_URL")
    host = os.getenv("MYSQL_HOST", "127.0.0.1")
    port = int(os.getenv("MYSQL_PORT", "3306"))
    db   = os.getenv("MYSQL_DB", "motivai")
    user = os.getenv("MYSQL_USER", "motivai_user")
    pwd  = quote_plus(os.getenv("MYSQL_PASS", "strong_pass"))
    return f"mysql+pymysql://{user}:{pwd}@{host}:{port}/{db}?charset=utf8mb4"

ENGINE = create_engine(
    _build_mysql_url(),
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    pool_recycle=1800,   # 30 phút
    echo=False,
)

SessionLocal = sessionmaker(bind=ENGINE, autoflush=False, expire_on_commit=False)

def get_session():
    """Context manager: with get_session() as s: ..."""
    s = SessionLocal()
    try:
        yield s
        s.commit()
    except Exception:
        s.rollback()
        raise
    finally:
        s.close()
