import json
from pathlib import Path

from server.app.auth.auth import AUTHDATA
from server.app.services.logger import logger

WHITELIST_FILE = Path(__file__).resolve().parents[2] / "data" / "whitelist.json"


def read_file() -> list[str]:
    try:
        with WHITELIST_FILE.open("r", encoding="utf-8") as file:
            value = json.load(file)
        return value if isinstance(value, list) else []
    except (OSError, json.JSONDecodeError) as error:
        logger.error("Failed to read whitelist: %s", error)
        return []


def write_file(devices: list[str]) -> None:
    try:
        with WHITELIST_FILE.open("w", encoding="utf-8") as file:
            json.dump(sorted(set(devices)), file, indent=4)
    except OSError as error:
        logger.error("Failed to write whitelist: %s", error)
        raise


def is_authorized(device_id: str) -> bool:
    return bool(device_id) and device_id in read_file()


def verify_token(token: str, device_id: str, ip_address: str) -> bool:
    if token != AUTHDATA["token"]:
        logger.warning("Authentication rejected for device %s from %s", device_id, ip_address)
        return False

    devices = read_file()
    if device_id not in devices:
        devices.append(device_id)
        write_file(devices)

    logger.info("Authentication succeeded for device %s from %s", device_id, ip_address)
    return True
