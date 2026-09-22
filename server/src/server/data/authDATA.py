from uuid import uuid4
import server.app.auth.network as network

rand_token = str(uuid4())
server_ip = network.get_server_url()

AUTHDATA = {
    "token": rand_token,
    "ip": server_ip,
    "authRequest": "/api/v1/auth",
    "commandRequest": "/api/v1/command",
    "commandWebSocketRequest": "/api/v1/commandWS",
    "getCommandsRequest": "/api/v1/getCommands"
}