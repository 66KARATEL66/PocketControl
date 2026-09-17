from server.app.auth.auth import AUTHDATA
from server.app.services.logger import logger
from pathlib import Path
import json

BASE_DIR = Path(__file__).resolve().parent.parent.parent
COMMAND_FILE = BASE_DIR / "data" / "whitelist.json"

def tokenVerification(data): # token, serial number, ip-address
    if(data["token"] != AUTHDATA["token"]):
        logger.error({
            "device_id": data["device_id"],
            "ip_address": data["ip_address"],
            "success": False,
            "reason": "invalid token"
        })
        return False

    device = data["device_id"]

    whitelist = readFile()

    # print("DEVICE:", repr(device))
    # print("WHITELIST:", repr(whitelist))
    # print("DEVICE TYPE:", type(device))
    # print("WHITELIST TYPE:", type(whitelist))
    # print("ALREADY EXISTS:", device in whitelist)

    if device not in whitelist:
        whitelist.append(device)
        writeFile(whitelist)

    logger.info("Device is added to whitelist")
    return True

def readFile():
    try:
        with open(COMMAND_FILE, "r", encoding='utf-8') as f:
            return json.load(f)
        
    except Exception as e:
        logger.error(f"Failed to read whitelist: {e}")
        return []

def writeFile(data):
    try:
        with open(COMMAND_FILE, "w", encoding='utf-8') as f:
            json.dump(data, f, indent=4)

    except Exception as e:
        return f"Error open/writing file: {e}"