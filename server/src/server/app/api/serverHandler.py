from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

import server.app.core.commands as command_handlers
from server.app.services.commandJsonHandler import COMMANDS_BY_NAME, DATA as COMMANDS
from server.app.services.logger import logger
from server.app.services.whitelistJsonHandler import is_authorized, verify_token
from server.data.command import CommandRequest

app = FastAPI(title="PocketControl Server")


class AuthRequest(BaseModel):
    token: str
    device_id: str


def execute_command(command_name: str, args: dict, transport: str) -> None:
    definition = COMMANDS_BY_NAME.get(command_name)
    if definition is None:
        raise ValueError(f"Unknown command: {command_name}")
    if definition.transport != transport:
        raise ValueError(f"Command {command_name} requires {definition.transport} transport")

    handler = getattr(command_handlers, command_name, None)
    if handler is None or not callable(handler):
        raise ValueError(f"Command handler is not available: {command_name}")

    handler(**args)


def request_device_id(request: Request) -> str:
    return request.headers.get("X-Device-ID", "")


@app.on_event("startup")
async def on_startup():
    logger.info("PocketControl server started")


@app.get("/api/v1/getCommands")
def get_commands(request: Request):
    device_id = request_device_id(request)
    logger.info("Command configuration requested from %s", request.client.host)
    if not is_authorized(device_id):
        logger.warning("Command configuration denied for device %s", device_id or "<missing>")
        return {"status": "error", "reason": "auth_required"}

    return {"commands": [command.model_dump() for command in COMMANDS], "status": "ok"}


@app.post("/api/v1/auth")
async def auth(request_data: AuthRequest, request: Request):
    client_ip = request.client.host
    if verify_token(request_data.token, request_data.device_id, client_ip):
        return {"success": True}
    return {"success": False, "reason": "invalid_token"}


@app.post("/api/v1/command")
def handle_command(command: CommandRequest, request: Request):
    logger.info("HTTP command %s requested by %s", command.command, request.client.host)
    if not is_authorized(command.device_id):
        logger.warning("Command denied for device %s", command.device_id)
        return {"status": "error", "reason": "auth_required"}

    try:
        execute_command(command.command, command.args, "http")
    except (TypeError, ValueError, OSError) as error:
        logger.error("Command %s failed: %s", command.command, error)
        return {"status": "error", "reason": str(error)}

    logger.info("Command %s completed", command.command)
    return {"status": "ok"}


@app.websocket("/api/v1/commandWS")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    client_ip = websocket.client.host
    logger.info("WebSocket connection accepted from %s", client_ip)

    try:
        auth_message = await websocket.receive_json()
        device_id = auth_message.get("device_id")
        if auth_message.get("type") != "auth" or not is_authorized(device_id):
            logger.warning("WebSocket authentication denied from %s", client_ip)
            await websocket.send_json({"type": "auth", "success": False, "error": "auth_required"})
            await websocket.close(code=1008)
            return

        await websocket.send_json({"type": "auth", "success": True})
        logger.info("WebSocket authenticated for device %s", device_id)

        while True:
            data = await websocket.receive_json()
            request_id = data.get("id")
            command_name = data.get("command")
            args = data.get("args") or {}

            try:
                execute_command(command_name, args, "websocket")
                await websocket.send_json({"id": request_id, "success": True})
                # logger.info("WebSocket command %s completed", command_name)
            except (TypeError, ValueError, OSError) as error:
                logger.error("WebSocket command %s failed: %s", command_name, error)
                await websocket.send_json({
                    "id": request_id,
                    "success": False,
                    "error": str(error),
                })
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected from %s", client_ip)
    except Exception:
        logger.exception("Unexpected WebSocket failure from %s", client_ip)
    finally:
        logger.info("WebSocket connection closed for %s", client_ip)
