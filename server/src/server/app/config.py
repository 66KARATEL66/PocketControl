import json
from pathlib import Path
from server.app.services.logger import logger


BASE_DIR = Path(__file__).resolve().parent.parent
COMMAND_FILE = BASE_DIR / "data" / "commands.json"

def getCommands():
    data = readFile()
    

def readFile():
    try:
        with open(COMMAND_FILE, "r", encoding='utf-8') as f:
            return json.load(f)
        
    except Exception as e:
        logger.error(f"Failed to read commands: {e}")
        return []