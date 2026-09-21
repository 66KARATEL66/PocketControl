from fastapi import FastAPI
from server.app.services.logger import logger
import server.app.core.commands as commands
from server.data.command import Command
from pydantic import BaseModel
from fastapi import Request
from server.app.services.whitelistJsonHandler import tokenVerification, readFile
from server.app.services.commandJsonHandler import DATA as DATA_COMMANDS

app = FastAPI()

whitelist = readFile()

class AuthRequest(BaseModel):
    token: str
    device_id: str

#execute command by find equal def in commands.py
def execute_command(command_name: str, args: dict):                 
    handler = getattr(commands, command_name, None)

    if handler is None:
        raise ValueError(f"Unknown command: {command_name}")

    handler(**args)

# get commmands list
@app.post("/api/v1/getCommands")
def getCommands(request: Request):
    logger.info(f"IP: {request.client.host} POST: Get Commands")
    if(DATA_COMMANDS):
        logger.info("Commands return")
        return {
                "commands": DATA_COMMANDS,
                "status": "ok",
            }

    logger.info("Get commands unsuccess")
    return { "status": "error"}

# auth
@app.post("/api/v1/auth")
async def auth(request_data: AuthRequest, request: Request):

    data = {
        "token": request_data.token,
        "device_id": request_data.device_id,
        "ip_address": request.client.host
    }

    logger.info(data["device_id"] + " " + data["ip_address"] + ": Sent Auth request")

    if(tokenVerification(data)):
        if data["device_id"] not in whitelist:
            whitelist.append(data["device_id"])

        logger.info("Verification successful")
        return {"success": True}

    logger.info("Access is denied")
    return {"success": False}

# GET POST
@app.post("/api/v1/command")
def handle_command(command: Command, request: Request):
    logger.info(f"IP: {request.client.host} POST {command}")

    if command.device_id not in whitelist:
        return {"status": "error", "reason": "auth_required"}

    try:
        execute_command(command.command, command.args)

    except ValueError as e:
        logger.warning(e)
        return {"status": "error", "reason": str(e)}

    return {
        "status": "ok"
    }

    