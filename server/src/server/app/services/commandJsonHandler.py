import json
from pathlib import Path

from server.data.command import CommandDefinition

COMMAND_FILE = Path(__file__).resolve().parents[2] / "data" / "commands.json"


def load_commands() -> list[CommandDefinition]:
    try:
        with COMMAND_FILE.open("r", encoding="utf-8") as file:
            return [CommandDefinition(**item) for item in json.load(file)]
    except (OSError, json.JSONDecodeError, ValueError) as error:
        from server.app.services.logger import logger

        logger.error("Failed to load command configuration: %s", error)
        return []


DATA = load_commands()
COMMANDS_BY_NAME = {command.command: command for command in DATA}
