from fastapi import FastAPI, WebSocketDisconnect
from server.app.services.logger import logger
import server.app.core.commands as commands
from server.data.command import Command
from pydantic import BaseModel
from fastapi import Request
from server.app.services.whitelistJsonHandler import tokenVerification, readFile
from server.app.services.commandJsonHandler import DATA as DATA_COMMANDS
from fastapi import WebSocket

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
@app.get("/api/v1/getCommands")
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

# WebSocket endpoint
@app.websocket("/api/v1/commandWS")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info(f"WebSocket connection accepted from {websocket.client.host}")

    try:
        while True:
            data = await websocket.receive_json()
            # logger.info(f"Received data from WebSocket: {data}")

            command_name = data.get("command")
            args = data.get("args", {})

            try:
                execute_command(command_name, args)
                await websocket.send_json({"success": True})
                # logger.info(f"Executed command '{command_name}' successfully")

            except ValueError as e:
                logger.warning(e)
                await websocket.send_json({"success": False, "error": str(e)})

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")

    except Exception as e:
        logger.error(f"WebSocket error: {e}")

    finally:
        logger.info("WebSocket connection closed")
    