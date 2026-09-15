import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

Base = declarative_base()
engine = None
SessionLocal = None

def init_db(db_host, db_port, db_user, db_pass, db_name):
    global engine, SessionLocal
    url = f"mysql+pymysql://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"
    engine = create_engine(url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Test connection
    with engine.connect() as conn:
        pass
    
    return url

def try_init_from_env():
    load_dotenv()
    host = os.getenv("DB_HOST")
    if not host:
        return False
        
    try:
        init_db(
            host,
            os.getenv("DB_PORT", "3306"),
            os.getenv("DB_USER", ""),
            os.getenv("DB_PASSWORD", ""),
            os.getenv("DB_NAME", "")
        )
        return True
    except Exception as e:
        print("Database connection failed during startup:", e)
        return False

def get_db():
    if not SessionLocal:
        raise Exception("Database is not configured yet.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
