import json
from pydantic import BaseModel
from pathlib import Path
from server.data.command import Command

BASE_DIR = Path(__file__).resolve().parent.parent
COMMAND_FILE = BASE_DIR / "data" / "command.json"

DATA = []

def json_decoder():
    try:
        with open(COMMAND_FILE, "r", encoding='utf-8') as f:
            data = json.load(f)

        return [Command(**e) for e in data] # id=e["id"], command=e["command"]

    except json.JSONDecodeError as e:
        print(e)
        return []

DATA = json_decoder()
    