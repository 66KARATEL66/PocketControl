import json
from pathlib import Path
from server.data.command import CommandReturn

BASE_DIR = Path(__file__).resolve().parent.parent.parent
COMMAND_FILE = BASE_DIR / "data" / "commands.json"

DATA = []

def json_decoder():
    try:
        with open(COMMAND_FILE, "r", encoding='utf-8') as f:
            data = json.load(f)

        return [CommandReturn(**e) for e in data] # id=e["id"], command=e["command"]

    except json.JSONDecodeError as e:
        print(e)
        return []

DATA = json_decoder()
    