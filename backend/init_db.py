import os
from dotenv import load_dotenv
from .db import ENGINE, Base

if __name__ == "__main__":
    load_dotenv()
    Base.metadata.create_all(ENGINE)
    print("✅ MySQL schema created.")
