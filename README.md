# PocketControl

PocketControl is a local-network remote-control application. The FastAPI server exposes a small command API, and the Expo/React Native client scans a pairing QR code, retrieves the server command configuration, and generates the available controls from that configuration.

## Architecture

```text
server/src/server/data/commands.json
                |
                v
FastAPI server -> authenticated HTTP/WebSocket endpoints
                |
                v
Expo client -> SecureStore session -> command configuration -> generated controls
```

- `server/src/server/app/api/serverHandler.py` contains the HTTP and WebSocket API.
- `server/src/server/app/core/commands.py` contains the local command handlers.
- `server/src/server/app/services/commandJsonHandler.py` loads the data-driven command definition.
- `server/src/server/app/services/whitelistJsonHandler.py` stores authenticated device IDs.
- `client/src/data/context.jsx` owns connection state, persisted sessions, and the command cache.
- `client/src/data/auth.jsx` scans QR codes and persists the server session.
- `client/src/data/commands.jsx` performs authenticated command-list and command-execution requests.
- `client/src/component/ScrollView.jsx` renders controls from the server response.

## Installation

### Server

Python 3.12 or newer is required.

```powershell
python -m venv server\.venv
server\.venv\Scripts\python.exe -m pip install -e server
```

If the editable install does not provide the optional command-handler dependencies on a new environment, install the packages declared by the server implementation (for example `fastapi`, `uvicorn`, `pydantic`, `qrcode`, and `pyautogui`).

### Client

```powershell
cd client
npm install
```

The client uses Expo SDK 57. Follow the versioned Expo documentation when changing native packages or configuration.

## Running

From the repository root:

```bat
start.bat
```

The script opens the server in a separate console, starts the server on port `8000`, prints the pairing QR code, and starts the Expo client. The phone and computer must be reachable on the same local network.

To start components separately:

```powershell
$env:PYTHONPATH = "$PWD\server\src"
server\.venv\Scripts\python.exe -m server.main

cd client
npm run start
```

The server log is written to `server/logs/pocketcontrol.log` and also emitted to the server console. If the log file cannot be written, console logging continues.

## Authentication and reconnect

The server creates a pairing token when it starts and embeds the token, server URL, and endpoint paths in the QR code. The client scans the QR code and sends the token plus its device ID to `/api/v1/auth`. Successful device IDs are stored in `server/src/server/data/whitelist.json`.

After successful pairing, the client stores the authenticated server endpoints and device ID in Expo SecureStore on native platforms. Web uses browser local storage because SecureStore is native-only. On application startup, the stored session is validated by fetching the current command list. Invalid or expired sessions are removed automatically.

Connecting to another server clears the old command list before fetching the new one. This prevents controls from a previous server from remaining visible during reconnect. A failed authorization response clears the local session and returns the UI to the disconnected state.

## Command-driven UI

The client does not contain a separate hard-coded button list. It renders the objects returned by `GET /api/v1/getCommands`. Each definition includes:

```json
{
  "id": 2,
  "command": "open_url",
  "transport": "http",
  "isSolid": true,
  "args": { "url": "https://www.google.com" }
}
```

To add a new command:

1. Add a handler function to `server/src/server/app/core/commands.py`.
2. Add an entry to `server/src/server/data/commands.json` with the handler name and transport.
3. Restart the server so the new configuration is loaded.

Solid commands are executed directly from the main command list. Non-solid
commands navigate to the generic Expo Router route
`client/src/app/command/[commandName].tsx`, where the command name selects the
dedicated screen implementation. `ScrollView` does not contain a per-command
navigation table. To add a new non-solid screen, add its screen implementation
to the dynamic command route; adding the server command itself still requires
only the handler and JSON definition.

HTTP commands are sent to `/api/v1/command`. WebSocket commands use `/api/v1/commandWS`; the client authenticates the socket before sending commands. The server validates command names against the JSON registry, so adding an arbitrary public function does not expose it automatically.

## Logging

Important startup, authentication, command, WebSocket, and error events use timestamped INFO/WARNING/ERROR log entries. Authentication tokens and credentials are never logged. Log rotation keeps three files of approximately 2 MB each.

## Licensing

Original PocketControl source code and original material created for this
repository are released under the [MIT License](LICENSE). Third-party
dependencies, Expo starter material, icons, logos, and other external assets
remain under their respective licenses and are not relicensed by PocketControl.
See [`THIRD-PARTY-LICENSES.md`](THIRD-PARTY-LICENSES.md) for the audit,
attribution requirements, source links, compatibility notes, and resources
requiring manual verification.

## Limitations and known issues

- Pairing currently uses an HTTP URL and a QR token on the local network; it is not a substitute for TLS or a production authentication service.
- The whitelist is a local JSON file and is intended for a single server instance.
- Mouse movement is optimized for interactive use and may discard movement accumulated during a lost WebSocket connection.
- The server command handlers operate the local computer and therefore require appropriate OS permissions.
