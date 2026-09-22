# PocketControl Development Guide

This document describes the implementation currently in this repository. It is
intended as a re-entry point for maintaining PocketControl after a long break.
The source code is authoritative; update this document when the architecture,
routes, command schema, or development workflow changes.

## 1. What the project is

PocketControl is a local-network remote-control application. An Android/iOS
Expo client discovers a running Windows host server by scanning a QR code. The
client then loads the command definitions from the server and renders controls
from that response. Commands run on the host computer, not on the phone:

- The **client** scans the QR code, authenticates its device ID, persists the
  resulting server session, loads the available commands, renders buttons, and
  sends HTTP or WebSocket command requests.
- The **server** runs on the host PC, creates pairing information, owns the
  device whitelist, validates requests, resolves command names to Python
  handlers, and performs host-side actions such as volume changes, opening a
  URL, and mouse control.
- The phone and PC communicate over the same local network using HTTP/JSON and
  a WebSocket for the interactive mouse-control command.

Current technologies:

- Python 3.12+ (`server/pyproject.toml`)
- FastAPI and Uvicorn
- Pydantic request/command models
- `pyautogui` for volume keys
- Windows `ctypes.windll.user32` for mouse control
- `qrcode` for terminal QR output
- Expo SDK 57, React Native 0.86, React 19, and Expo Router
- `expo-secure-store` on native platforms and browser `localStorage` on web
- `react-native-data-scanner` for QR scanning
- `react-native-device-info` for the device ID

### Architecture

```text
                        same local network
┌─────────────────────┐       HTTP / JSON        ┌──────────────────────────┐
│ Expo React Native   │ ───────────────────────> │ FastAPI / Uvicorn server │
│ phone client        │                          │ running on host PC       │
│                     │ <─────────────────────── │                          │
│ - QR scan           │       JSON responses     │ - pairing token/QR        │
│ - persisted session │                          │ - whitelist auth          │
│ - generated buttons │       WebSocket          │ - command registry        │
│ - mouse trackpad    │ ═══════════════════════> │ - Python host actions     │
└─────────────────────┘                          └──────────────┬───────────┘
                                                                │
                                                                ▼
                                                     Windows desktop APIs /
                                                     pyautogui / os.startfile
```

The server's command registry is the source of truth for the main command
list. The client does not hard-code the volume/open-URL button list.

## 2. Repository map

Only the files that matter when continuing development are listed here.
`client/android` and `client/ios` are intentionally ignored generated native
directories; they are not part of the tracked source tree.

```text
PocketControl/
├── start.bat
├── README.md
├── DEVELOPMENT.md
├── LICENSE
├── THIRD-PARTY-LICENSES.md
├── client/
│   ├── package.json
│   ├── package-lock.json
│   ├── app.json
│   ├── eas.json
│   ├── tsconfig.json
│   ├── scripts/reset-project.js
│   └── src/
│       ├── app/
│       │   ├── _layout.tsx
│       │   ├── index.tsx
│       │   ├── settings.jsx
│       │   ├── mouseControl.jsx
│       │   └── command/[commandName].tsx
│       ├── component/
│       ├── data/
│       └── stylesheet/styles.tsx
└── server/
    ├── pyproject.toml
    ├── uv.lock
    ├── main.py
    └── src/server/
        ├── main.py
        ├── app/
        │   ├── api/serverHandler.py
        │   ├── auth/
        │   ├── core/
        │   └── services/
        └── data/
```

### Root files

| File | Responsibility | Modify when |
| --- | --- | --- |
| `start.bat` | Windows convenience launcher. Verifies the Python venv, client dependencies, and `npm`, then opens the server and runs Expo. | Startup prerequisites or the local development launch sequence changes. |
| `README.md` | Short project setup, architecture, authentication, command, and logging overview. | Keep it aligned with major setup or behavior changes; this file contains the detailed maintainer notes. |
| `DEVELOPMENT.md` | Detailed implementation and maintenance reference. | Any documented route, state flow, file location, build command, or design decision changes. |
| `.gitignore` | Ignores dependencies, local environments, secrets/certificates, logs, and generated native folders. | A new generated/local artifact must not be committed. |
| `THIRD-PARTY-LICENSES.md` | License and attribution audit for dependencies/assets. | Dependencies or externally sourced assets change. |

### Server files

| File | Responsibility | Modify when |
| --- | --- | --- |
| `server/main.py` | Thin console entry point that imports `server.main.main()`. | The installed/server script entry point changes. |
| `server/src/server/main.py` | Logs startup, prints the QR, and starts Uvicorn on `0.0.0.0:8000`. | Server startup host/port or startup sequence changes. |
| `server/src/server/app/api/serverHandler.py` | FastAPI application, request model for auth, all HTTP/WebSocket routes, authorization checks, and command dispatch. | Adding/changing an endpoint, transport, request shape, or API error behavior. |
| `server/src/server/app/auth/auth.py` | Compresses `AUTHDATA` with zlib, converts it to hex, and prints the QR as terminal ASCII. | Pairing encoding or QR generation changes. |
| `server/src/server/app/auth/network.py` | Finds the local IPv4 address by opening a UDP socket toward `8.8.8.8`; builds the `http://IP:8000` base URL. | Address discovery or port selection changes. |
| `server/src/server/data/authDATA.py` | Generates a new UUID token at import time and defines the base URL plus endpoint paths placed in the QR payload. | Pairing payload fields or endpoint paths change. |
| `server/src/server/app/services/whitelistJsonHandler.py` | Reads/writes `data/whitelist.json`, checks device IDs, and adds a device after a valid token. | Whitelist storage or authorization policy changes. |
| `server/src/server/data/whitelist.json` | Persistent list of authorized device IDs. | Normally do not edit manually; remove a device here to revoke it. Do not copy real IDs into documentation. |
| `server/src/server/data/command.py` | Pydantic models for command definitions and HTTP command requests. | The command JSON schema or HTTP request body changes. |
| `server/src/server/data/commands.json` | Data-driven command registry sent to clients. | Adding/removing a command, changing transport, default args, or whether it has a dedicated screen. |
| `server/src/server/app/services/commandJsonHandler.py` | Loads `commands.json` at module import and exposes `DATA` and `COMMANDS_BY_NAME`. | Command loading/validation/caching behavior changes. |
| `server/src/server/app/core/commands.py` | Public Python handlers currently exposed by the registry: `volume_up`, `volume_down`, `open_url`, and `mouseControl`. | Implementing or changing a host action. |
| `server/src/server/app/core/mouseControl.py` | Windows-only cursor movement/click implementation using `user32`. | Mouse sensitivity, bounds, click behavior, or OS integration changes. |
| `server/src/server/app/services/logger.py` | Console logger and rotating file logger. | Log format, level, path, or rotation changes. |
| `server/pyproject.toml` / `server/uv.lock` | Python metadata, dependencies, script entry point, and locked resolution. | Python dependencies or supported Python version changes. |

### Client files

| File | Responsibility | Modify when |
| --- | --- | --- |
| `client/src/app/_layout.tsx` | Root Expo Router layout: safe area, header, context provider, and stack with hidden native headers. | Global providers, root layout, or navigation options change. |
| `client/src/app/index.tsx` | Home route; renders the command list. | The initial screen changes. |
| `client/src/app/settings.jsx` | Settings route wrapper for `SettingsPage`. | Settings route composition changes. |
| `client/src/app/command/[commandName].tsx` | Dynamic dedicated-command route. Currently maps `mouseControl` to `MouseControlPage` and shows a fallback for unknown screens. | Adding a command-specific screen or changing dynamic routing. |
| `client/src/app/mouseControl.jsx` | Alternate direct route wrapper for `MouseControlPage`. | The direct mouse-control route is changed or removed. |
| `client/src/data/context.jsx` | Global auth/session/command state, session restoration, connect/logout, refresh, and stale-command prevention. | Connection lifecycle or shared state behavior changes. |
| `client/src/data/auth.jsx` | QR scanning, QR decoding, device ID retrieval, authentication, and persisted session storage. | Pairing, storage, or auth request behavior changes. |
| `client/src/data/commands.jsx` | Authenticated command-list fetch and HTTP command execution. | HTTP request/response formats or command error handling changes. |
| `client/src/component/ScrollView.jsx` | Loads shared state, renders command buttons, routes non-solid commands, and executes solid commands. | Main command-list UI or button behavior changes. |
| `client/src/component/Button.jsx` | Reusable pressable button presentation. | Button layout or press behavior changes. |
| `client/src/component/Header.jsx` | App title and settings navigation button. | Header or settings navigation changes. |
| `client/src/component/settingsPage.jsx` | Connect/disconnect UI and user-facing auth status. | Settings actions or connection status display changes. |
| `client/src/component/mouseControlPage.jsx` | WebSocket auth/reconnect, touch-to-delta conversion, click detection, and mouse-control UI. | WebSocket behavior, trackpad gestures, or mouse UX changes. |
| `client/src/stylesheet/styles.tsx` | Shared visual styles and icon sizing. | UI styling or dimensions change. |
| `client/package.json` / `package-lock.json` | Expo scripts and JavaScript dependencies. | Client dependencies or scripts change. |
| `client/app.json` | Expo app identity, Android package, camera permission, plugins, and SDK configuration. | Native app configuration or permissions change. |
| `client/eas.json` | EAS development/preview/production profiles. | Cloud/local build profiles change. |

## 3. Startup and complete lifecycle

### Server startup

1. `start.bat` starts `server\.venv\Scripts\python.exe server\main.py` in a
   separate console.
2. `server/main.py` delegates to `server.src/server/main.py` through the
   installed `server.main` module entry point.
3. `server/src/server/main.py` logs startup, calls `create_qr_code()`, then
   runs `uvicorn` with `server.app.api.serverHandler:app`, host `0.0.0.0`,
   port `8000`.
4. Importing `server.data.authDATA` creates a fresh UUID token and computes a
   local base URL. The QR is compressed and printed as ASCII in the server
   console.
5. Importing `server.app.services.commandJsonHandler` reads
   `server/src/server/data/commands.json` into Pydantic `CommandDefinition`
   objects. The server keeps both the list (`DATA`) and a name lookup
   (`COMMANDS_BY_NAME`) in memory.
6. FastAPI emits its startup log. The server is ready to accept requests.

The token is generated for that server process/import. Restarting the server
therefore means scanning the newly printed QR again if the client is not
already authorized by the persisted whitelist.

### Client startup

1. Expo enters through `expo-router/entry`, configured as `main` in
   `client/package.json`.
2. `client/src/app/_layout.tsx` creates the safe-area shell, renders `Header`,
   mounts `ContextProvider`, and creates a headerless Expo Router stack.
3. `ContextProvider` starts in `status = "loading"` and attempts to restore a
   session from native SecureStore or web `localStorage`.
4. If a stored session exists, `establishSession()` clears the old command
   cache, fetches `/api/v1/getCommands`, and only then marks the app
   authenticated. If restoration fails, stored data is deleted and the app
   becomes unauthenticated.
5. The home route renders `ScrollView`. While loading it shows
   `Connecting...`; while unauthenticated it shows `Connect to a server`; when
   authenticated it renders `Refresh commands` and the server-provided list.

### Pairing and first use

```text
Server process starts
    ↓
Fresh UUID + local HTTP URL + endpoint paths are put in AUTHDATA
    ↓
zlib-compress JSON → hex string → ASCII QR in server console
    ↓
Client scans QR with DataScanner
    ↓
Client hex-decodes and pako-inflates the JSON
    ↓
Client obtains its device ID
    ↓
POST /api/v1/auth with token + device_id
    ↓
Server validates token and adds device ID to whitelist.json
    ↓
Client builds and persists a session containing endpoint URLs/device ID
    ↓
GET /api/v1/getCommands with X-Device-ID
    ↓
Client renders command buttons
```

## 4. Client architecture

### Routing and screens

Expo Router uses the files under `client/src/app`:

- `/` → `index.tsx` → `ScrollView`.
- `/settings` → `settings.jsx` → `SettingsPage`.
- `/mouseControl` → `mouseControl.jsx` → `MouseControlPage` (direct wrapper).
- `/command/[commandName]` → dynamic command screen. The current dedicated
  implementation is `mouseControl`; other names receive a visible
  “No screen is registered” fallback.

`Header` is outside the Router `Stack`, so it is present across the app. The
settings icon uses `router.push("/settings")`.

### Shared state and data flow

`ContextProvider` owns:

```text
session: persisted server/device endpoint information or null
commands: last successful server command list
status: "loading" | "authenticated" | "unauthenticated"
error: last connection/restore error or null
```

It exposes `authStatus`, `connect`, `refreshCommands`, and `logout` through
`useAuth()`.

The normal data path is:

```text
QR/session or stored session
        ↓
ContextProvider.establishSession()
        ↓
data/commands.fetchCommands()
        ↓
commands state
        ↓
ScrollView FlatList
        ↓
Button.press
        ├── solid command → data/commands.executeCommand() → HTTP
        └── non-solid command → /command/[commandName] → dedicated screen
```

### Authentication state and persistent storage

`client/src/data/auth.jsx` stores one JSON session under
`pocketcontrol.session`:

```json
{
  "deviceId": "<device id>",
  "commandRequest": "http://<host>:8000/api/v1/command",
  "getCommandsRequest": "http://<host>:8000/api/v1/getCommands",
  "commandWebSocketRequest": "ws://<host>:8000/api/v1/commandWS"
}
```

Native platforms use `expo-secure-store`; web uses `globalThis.localStorage`.
The session does not contain the pairing token after authentication. It does
contain the device ID and derived endpoint URLs.

`establishSession()` deliberately replaces the command cache with an empty
list before fetching the new server's commands. This prevents controls from a
previous server remaining visible during reconnect. A failed `auth_required`
response clears the session and command list. Logout only clears the local
session/commands; there is no server-side “remove device” endpoint.

### Command rendering

`ScrollView` receives the command array from context and renders it in a
two-column `FlatList`. The button title is `item.command`, and the list key is
`item.id`.

- `isSolid !== false` means execute directly through the HTTP command endpoint.
- `isSolid === false` means treat `item.command` as a dedicated screen name.
  The name must match `/^[A-Za-z0-9_-]+$/` before navigation.
- The route, not `ScrollView`, decides which dedicated implementation exists.

Loading/error behavior is intentionally simple:

- Loading: one disabled-looking `Connecting...` button.
- No auth: a button that navigates to settings.
- Command HTTP failure: an alert; `auth_required` also triggers a command
  refresh, which can clear the session.
- Manual refresh failure: an alert.
- Invalid command data from the server: `fetchCommands` throws instead of
  silently rendering it.

### Mouse-control client behavior

`MouseControlPage` opens `session.commandWebSocketRequest`. On open it sends:

```json
{ "type": "auth", "device_id": "<device id>" }
```

After the server replies with successful WebSocket authentication, touch
movement is converted into incremental deltas. A short touch without movement
becomes a click. Movement waits until a 300 ms hold and a 10-pixel total
movement threshold. Requests are serialized: while one command is in flight,
additional deltas are accumulated in `pendingDelta` and sent after a success.

The page reconnects after close with exponential backoff, capped at 10 seconds,
for up to five attempts. Closing/unmounting sets the attempt count to the
maximum and closes the socket so cleanup does not start a reconnect loop.
Pending movement is discarded on socket close. The current screen displays
`connecting`, `connected`, or `disconnected`.

## 5. Server architecture

### Application and dispatch

`server/src/server/app/api/serverHandler.py` creates the FastAPI app. The
`execute_command()` helper is the central dispatch boundary:

1. Find the command in `COMMANDS_BY_NAME`.
2. Confirm the request transport matches the registry (`http` or `websocket`).
3. Resolve a same-named callable from `server.app.core.commands`.
4. Call it with `handler(**args)`.

This means a Python function is not publicly callable merely because it exists;
it must also be present in `commands.json` and requested over its configured
transport.

### Endpoints

#### `POST /api/v1/auth`

**Purpose:** Pair a device using the token from the QR code.

**Request:**

```json
{
  "token": "<QR token>",
  "device_id": "<client device id>"
}
```

**Response on success:**

```json
{ "success": true }
```

**Response on rejection:**

```json
{ "success": false, "reason": "invalid_token" }
```

**Authentication:** This is the pairing operation; it validates the generated
token rather than requiring a whitelist entry. A valid device ID is appended
to `server/src/server/data/whitelist.json`.

**Used by:** `client/src/data/auth.jsx` after QR decoding.

#### `GET /api/v1/getCommands`

**Purpose:** Return the current command registry.

**Request:** No body. Requires:

```http
X-Device-ID: <whitelisted device id>
```

**Response on success:**

```json
{
  "commands": [
    {
      "id": 0,
      "command": "volume_up",
      "transport": "http",
      "isSolid": true,
      "args": {}
    }
  ],
  "status": "ok"
}
```

The exact array is generated from `commands.json`; omitted `args` are emitted
by Pydantic as the model default `{}`.

**Response when not authorized:**

```json
{ "status": "error", "reason": "auth_required" }
```

**Used by:** `fetchCommands()` during startup, pairing, reconnect, and manual
refresh.

#### `POST /api/v1/command`

**Purpose:** Execute a registry command over HTTP.

**Request:**

```json
{
  "command": "open_url",
  "device_id": "<whitelisted device id>",
  "args": { "url": "https://www.google.com" }
}
```

**Response on success:**

```json
{ "status": "ok" }
```

**Response on authorization or execution failure:**

```json
{ "status": "error", "reason": "auth_required" }
```

or:

```json
{ "status": "error", "reason": "<handler/validation error>" }
```

**Authentication:** Device ID is read from the body and must be in the
whitelist.

**Used by:** `client/src/data/commands.jsx` for solid commands.

#### `WebSocket /api/v1/commandWS`

**Purpose:** Long-lived interactive command transport, currently used by the
  mouse-control screen.

**First client message:**

```json
{ "type": "auth", "device_id": "<whitelisted device id>" }
```

**Server auth response:**

```json
{ "type": "auth", "success": true }
```

For each command, the client sends an ID, command name, and args:

```json
{
  "id": "client-generated-request-id",
  "command": "mouseControl",
  "args": { "x": 1, "y": -1, "isClick": false },
  "device_id": "<device id>"
}
```

The current server does not use `device_id` from command messages after the
initial WebSocket auth. It uses the authenticated connection's earlier
whitelist check. Success is:

```json
{ "id": "client-generated-request-id", "success": true }
```

Execution failure is:

```json
{
  "id": "client-generated-request-id",
  "success": false,
  "error": "<handler/validation error>"
}
```

Unauthorized sockets receive an auth failure and close with WebSocket code
1008. The server logs disconnects and unexpected failures.

There is no separate API version negotiation. The `/api/v1/` path prefix is
the current versioning convention and is embedded in the QR payload.

## 6. Pairing and authentication in detail

### QR generation

`server/src/server/data/authDATA.py` builds this structure at import time:

```json
{
  "token": "<fresh UUID>",
  "ip": "http://<local IPv4>:8000",
  "authRequest": "/api/v1/auth",
  "commandRequest": "/api/v1/command",
  "commandWebSocketRequest": "/api/v1/commandWS",
  "getCommandsRequest": "/api/v1/getCommands"
}
```

`server/src/server/app/auth/auth.py` JSON-serializes that object, compresses
the UTF-8 bytes with zlib, converts the compressed bytes to a hexadecimal
string, and puts that string into a terminal ASCII QR code. The token and
server URL are therefore in the QR payload, but are not printed as a readable
log message.

The local IP lookup creates a UDP socket and connects it to `8.8.8.8:80` only
to select the local interface; it does not send an application request through
that socket. If this discovery fails or selects the wrong interface, pairing
will fail from the phone.

### Client decoding and device ID

`scanBarcode()` asks `DataScanner.scanBarcode()` for a QR value. `decodeAuthData`
rejects non-hex or odd-length strings, converts each pair of hex characters to
a byte, inflates the bytes with `pako`, and parses the resulting JSON.

The client obtains a device ID with `react-native-device-info.getUniqueId()`.
It sends that ID with the decoded token to the decoded `ip + authRequest` URL.

### Whitelist behavior

`verify_token()` compares the submitted token with the current in-memory
`AUTHDATA["token"]`. If valid, it reads the JSON list and appends the device
ID if it is not already present. `write_file()` stores a sorted, de-duplicated
list. A device ID is not removed on client logout.

All protected requests use `is_authorized(device_id)`, which rereads the JSON
file and checks membership. This means a manually removed device is rejected
without restarting the server.

### Invalid/stale authentication

- Invalid token: `/auth` returns `success: false`; the client throws and
  clears any stored session.
- Missing/removed whitelist entry: protected HTTP routes return
  `reason: "auth_required"`. The client clears its session when this occurs
  while refreshing commands; command execution also attempts a refresh before
  showing its alert.
- Stored malformed session: `loadStoredSession()` deletes it and reports
  unauthenticated.
- Server restart: the QR token changes, but an already-whitelisted device can
  still use the stored session because protected routes check the whitelist,
  not the current token.

### Logout/disconnect

The Settings screen's Disconnect button calls `logout()`, which deletes
`pocketcontrol.session`, clears commands, clears the error, and changes status
to `unauthenticated`. It does not edit `whitelist.json`; revocation requires
removing the device ID from that file.

## 7. Command system

### Registry and JSON model

Each command is a `CommandDefinition`:

```json
{
  "id": 2,
  "command": "open_url",
  "transport": "http",
  "isSolid": true,
  "args": {
    "url": "https://www.google.com"
  }
}
```

Fields:

- `id`: integer used by the client as the FlatList key.
- `command`: both the registry key and the Python handler name.
- `transport`: exactly `http` or `websocket`; dispatch rejects mismatches.
- `isSolid`: client presentation flag. `true`/omitted behavior means direct
  command button; `false` means a dedicated route is required.
- `args`: default arguments advertised to the client. The current solid
  command path sends this dictionary unchanged; the mouse screen supplies its
  own runtime values.

The server loads the file once when `commandJsonHandler.py` is imported.
Malformed/unreadable configuration is logged and produces an empty command
list; it does not stop the process at import time.

### Current commands

| Registry entry | Handler | Transport | UI behavior |
| --- | --- | --- | --- |
| `volume_up` | `commands.volume_up()` → `pyautogui.press("volumeup")` | HTTP | Direct button |
| `volume_down` | `commands.volume_down()` → `pyautogui.press("volumedown")` | HTTP | Direct button |
| `open_url` | `commands.open_url(url)` → `os.startfile(url)` | HTTP | Direct button; configured URL is passed as `args.url` |
| `mouseControl` | `commands.mouseControl(x, y, isClick)` → Windows cursor API | WebSocket | Dedicated `/command/mouseControl` screen |

### End-to-end command path

```text
commands.json
    ↓ load_commands() → CommandDefinition
GET /api/v1/getCommands
    ↓
ContextProvider.commands
    ↓
ScrollView generates FlatList buttons
    ├── isSolid true → POST /api/v1/command
    └── isSolid false → /command/[commandName]
                              ↓
                         MouseControlPage
                              ↓
                    WebSocket auth + command messages
                              ↓
                    execute_command()
                              ↓
                    server.app.core.commands
                              ↓
                    host-side action
```

Arguments for HTTP commands are the `args` field on the command object. The
client adds `device_id` and `command` to the request body. Arguments for the
mouse screen are generated from touch deltas and passed as `x`, `y`, and
`isClick`. The server invokes the handler with keyword expansion (`handler(**args)`).

Errors from `TypeError`, `ValueError`, and `OSError` are converted into JSON
error responses and logged. Other unexpected HTTP exceptions are not caught by
the endpoint handler. WebSocket has a broader outer exception log for socket
failures, but command execution still handles the same expected exception
types.

## 8. Adding a new command

### A. Simple command

For a no-parameter host action:

1. Add a callable to `server/src/server/app/core/commands.py`, for example:

   ```python
   def mute():
       pyautogui.press("volumemute")
   ```

2. Add a matching registry entry to
   `server/src/server/data/commands.json`:

   ```json
   {
     "id": 4,
     "command": "mute",
     "transport": "http",
     "isSolid": true
   }
   ```

3. Restart the server. The registry is loaded at module import, so editing
   the JSON file does not update the in-memory list until restart.
4. The client fetches the new definition on startup, reconnect, or Refresh
   commands. No client button file needs to change.
5. Pressing the generated button sends `POST /api/v1/command` with
   `{"command":"mute","args":{},"device_id":"..."}`. The server resolves
   `commands.mute` and calls it.

The handler name, JSON `command`, and requested command name must match
exactly. The command ID should be unique because the client uses it as the
FlatList key.

### B. Command with parameters

For a handler such as:

```python
def move_mouse(x: int, y: int):
    ...
```

the HTTP path requires a command definition with argument defaults or values:

```json
{
  "id": 5,
  "command": "move_mouse",
  "transport": "http",
  "isSolid": true,
  "args": { "x": 0, "y": 0 }
}
```

The current generated-button UI does not provide an argument editor. It will
send the configured `args` object unchanged. To supply user-entered values,
add a dedicated screen (`isSolid: false`) and have that screen call the
appropriate transport, or add a separate client UI and request builder.

For a dedicated WebSocket command, the screen should send:

```json
{
  "id": "unique-client-request-id",
  "command": "move_mouse",
  "args": { "x": 10, "y": -4 },
  "device_id": "<device id>"
}
```

The server will validate that the registry transport is `websocket` before
calling `move_mouse(**args)`.

### C. Command requiring a dedicated screen

1. Implement the host handler in `server/src/server/app/core/commands.py` (or
   a helper imported there).
2. Add its `commands.json` entry with `"isSolid": false`.
3. Choose `http` or `websocket` based on the screen's request behavior.
4. Add a screen implementation in `client/src/component/`, following the
   `MouseControlPage` pattern if it needs shared auth/session state.
5. Register the command name in
   `client/src/app/command/[commandName].tsx`:

   ```tsx
   if (commandName === "newCommand") {
       return <NewCommandPage commandName={commandName} />;
   }
   ```

6. Restart the server and refresh commands in the client.

The route is dynamic, but the screen implementation is intentionally explicit.
There is no automatic component lookup or arbitrary component import from JSON.
Unknown non-solid commands show the fallback “No screen is registered” message.

## 9. Networking

### Address discovery and QR

The server derives its base URL from the local address selected by
`get_local_ip()`, normally `http://<LAN-IP>:8000`. It binds Uvicorn to
`0.0.0.0`, allowing other devices on the LAN to connect. The selected base URL
and relative route paths are encoded into the QR payload.

The phone must be able to reach that exact IP and port. This is not internet
service discovery and there is no mDNS, cloud relay, TLS certificate, or
automatic IP update mechanism.

### Transport summary

| Operation | Method/transport | Auth material |
| --- | --- | --- |
| Pair | `POST /api/v1/auth` | QR token and JSON `device_id` |
| Load commands | `GET /api/v1/getCommands` | `X-Device-ID` header |
| Solid command | `POST /api/v1/command` | JSON `device_id` |
| Interactive command | `WebSocket /api/v1/commandWS` | First message contains `device_id` |

All HTTP payloads are JSON. The server currently returns application-level
error objects rather than HTTP 401/4xx responses for expected auth/command
failures; the client therefore checks both `response.ok` and response fields.

### Connection loss and reconnect

The main HTTP client does not maintain a connection. Each fetch fails at the
request level if the host is unavailable, and the caller displays an alert.
The user can reconnect from Settings or use Refresh commands after the server
is available.

The mouse WebSocket has its own reconnect loop: close/error sets a disconnected
state, then close schedules up to five attempts with exponential delay capped
at ten seconds. The current implementation does not re-authenticate the
global session after a WebSocket auth rejection; it marks the screen
disconnected and closes/retries until the attempt limit.

## 10. State management

### Main application states

```text
ContextProvider mount
        ↓
loading
   ├── no stored session → unauthenticated
   └── stored session → fetch commands
                            ├── success → authenticated
                            └── failure → clear session → unauthenticated

Settings Connect
        ↓
loading + clear command cache
        ↓
scan/decode/authenticate
        ↓
fetch commands
   ├── success → authenticated
   └── failure → clear session/cache → unauthenticated
```

The authoritative shared state is in `ContextProvider`; the mouse screen has
separate local WebSocket state. There is no Redux or external state store.

Important stale-state rules:

- `establishSession()` clears `commands` before fetching a new server list.
- `clearSession()` clears both the persisted session and in-memory commands.
- A protected command-list response with `auth_required` invalidates the local
  session.
- Mouse pending deltas are cleared when the socket closes.

One subtle implementation detail: `refreshCommands()` returns immediately
without changing status if there is no active session. Callers should not use
it as a replacement for `connect()`.

## 11. Logging and debugging

### Server logs

`server/src/server/app/services/logger.py` creates logger `pocketcontrol`:

- Console: timestamped output on stdout.
- File: `server/logs/pocketcontrol.log`.
- Rotation: 2 MiB per file, three backups.
- Level: `INFO`.
- If the log file cannot be created, console logging continues and a warning is
  emitted.

Important events include server startup, command-list requests, auth success
/rejection, HTTP command start/completion/failure, WebSocket connect/auth/
disconnect, and unexpected WebSocket exceptions. Tokens are not deliberately
logged.

### Practical diagnosis checklist

**Client cannot connect or scan**

1. Confirm the server console is running and printed a QR.
2. Confirm the phone and PC are on the same network.
3. Read the QR's server address indirectly by checking the server-selected
   local IP and whether the phone can reach `http://<IP>:8000`.
4. Check Windows Firewall for Python/Uvicorn port 8000 access.
5. If the wrong network interface was selected, investigate
   `server/app/auth/network.py`; it chooses the address through the UDP
   `8.8.8.8` probe.
6. Scan the QR printed by the current server process, not an old screenshot.

**Pairing/authentication fails**

1. Check the client alert and the server log for an authentication rejection.
2. Confirm the scanned value is the compressed hexadecimal payload, not a
   cropped/partial QR.
3. Check that `server/src/server/data/whitelist.json` is readable and writable.
4. Check that the client device ID is stable and that the whitelist contains
   the intended device.
5. If stored session data is stale or malformed, use Disconnect or clear the
   app's SecureStore/local storage and scan again.

**Commands are missing or stale**

1. Check `server/src/server/data/commands.json` for valid JSON and unique IDs.
2. Restart the server because command definitions are loaded at import time.
3. Press Refresh commands.
4. Check the server log for command configuration loading errors.
5. Remember that reconnect clears the old list before the new list loads.

**A direct command fails**

1. Confirm the command's `transport` is `http`.
2. Confirm its handler exists in `server/app/core/commands.py` with the exact
   same name.
3. Check that `args` names match the Python function parameters.
4. Check the server log for `TypeError`, `ValueError`, or `OSError`.
5. Check host permissions and whether the action is supported by Windows/
   `pyautogui`/`os.startfile`.

**Mouse control disconnects**

1. Confirm the command registry says `mouseControl` uses `websocket`.
2. Watch the screen's `Mouse control: ...` status.
3. Check server logs for WebSocket auth or disconnect messages.
4. Confirm the stored server URL is still reachable after a network change.
5. Reopen the screen or reconnect the app after five failed retries.
6. Expect unsent accumulated movement to be discarded when the socket closes.

**Server will not start**

1. Confirm `server\.venv\Scripts\python.exe` exists.
2. Reinstall the editable server package if imports fail.
3. Check Python is 3.12 or newer.
4. Check that port 8000 is free.
5. On non-Windows systems, `mouseControl.py` will not work because it
   accesses `ctypes.windll.user32`; the project currently targets Windows host
   control.

## 12. Running the project

### Prerequisites

- Windows host PC for the current command handlers.
- Python 3.12 or newer.
- Node.js/npm compatible with Expo SDK 57.
- Android Studio/SDK and a device or emulator for `expo run:android`.
- A phone and host on the same LAN.

The repository does not define a separate `.env` configuration for the
application. Pairing data is generated at runtime.

### Server setup

From the repository root:

```powershell
python -m venv server\.venv
server\.venv\Scripts\python.exe -m pip install -e server
```

The declared server dependencies are in `server/pyproject.toml` and are
locked by `server/uv.lock`. The package installs the `server` script mapped to
`server.main:main`.

### Client setup

```powershell
cd client
npm install
```

The lockfile is `client/package-lock.json`. The Expo app uses SDK 57 packages
as declared in `client/package.json`. Native package/configuration changes
should be checked against the versioned Expo SDK 57 documentation before
changing `app.json` or generating native projects.

### Run everything with the batch file

From the repository root:

```bat
start.bat
```

The script:

1. Changes to the repository directory.
2. Verifies `server\.venv\Scripts\python.exe`.
3. Verifies `client\node_modules`.
4. Verifies `npm.cmd` is on `PATH`.
5. Opens a new console for the server.
6. Runs `npm run start` in `client`.

It does not install missing dependencies and it does not verify that port 8000
is available.

### Run separately

Server:

```powershell
$env:PYTHONPATH = "$PWD\server\src"
server\.venv\Scripts\python.exe -m server.main
```

Client:

```powershell
cd client
npm run start
```

Other defined client scripts:

```powershell
npm run android
npm run ios
npm run web
npm run lint
```

`npm run android` and `npm run ios` use `expo run:*`, which can generate/use
native projects. Those generated `android`/`ios` directories are ignored by
the root `.gitignore`.

## 13. Build and release process

The repository contains an Expo/EAS configuration but no server packaging
configuration or release script.

### Development build

Use the development EAS profile in `client/eas.json`:

- profile: `development`
- `developmentClient: true`
- `distribution: internal`

Local native Android development is exposed through `npm run android`.

### Internal/preview APK

`client/eas.json` defines:

- `preview`: internal distribution
- `preview1`: Android `buildType: "apk"`

The exact EAS CLI invocation is not stored in the repository. Use the installed
EAS/Expo tooling and the profile name rather than inventing a repository
script. `client/app.json` contains the EAS project ID and Android package
identity.

### Production

The `production` profile enables `autoIncrement: true` and a production submit
profile exists. Before releasing, verify:

- `client/app.json` version/package/permissions and assets.
- The server URL discovery still matches the network where the APK will be
  used.
- The app can scan the terminal QR and authenticate.
- The command list loads after a clean install.
- HTTP commands and WebSocket mouse control both work.
- No local session, device IDs, logs, or generated native folders are being
  packaged or committed.

There is no current server executable/container packaging flow. The server is
run from the Python environment on the host PC.

## 14. Configuration and persistent data

| Configuration/data | Location | Controls | Commit/change guidance |
| --- | --- | --- | --- |
| Python version | `server/pyproject.toml`, `server/.python-version` | Supported server interpreter. | Change deliberately with dependency compatibility checks. |
| Python dependencies | `server/pyproject.toml`, `server/uv.lock` | FastAPI, Uvicorn, qrcode, pyautogui, and resolved transitive packages. | Update both through the package manager when changing dependencies. |
| Server port/host | `server/src/server/main.py` | Uvicorn bind (`0.0.0.0`, port `8000`). | Manual source change; also affects QR URL and firewall requirements. |
| Server URL discovery | `server/src/server/app/auth/network.py` | Local IP selected for QR. | Manual source change if discovery policy changes. |
| Pairing endpoints | `server/src/server/data/authDATA.py` | Relative paths embedded in QR. | Keep synchronized with FastAPI decorators and client session construction. |
| Pairing token | Generated in `server/src/server/data/authDATA.py` | Current process's pairing secret. | Never hard-code or document a value. |
| Authorized devices | `server/src/server/data/whitelist.json` | Persistent whitelist. | Runtime data; do not add real device IDs to documentation. |
| Command registry | `server/src/server/data/commands.json` | Available command names, transports, UI mode, args. | Safe configuration to commit; validate handler/name alignment. |
| Server logs | `server/logs/` | Runtime diagnostics. | Ignored; never commit logs. |
| Client identity/permissions | `client/app.json` | Expo name, package, camera permission, plugins, assets. | Safe to commit; native behavior changes require SDK 57 review. |
| Build profiles | `client/eas.json` | Development, preview, APK, production distribution settings. | Safe to commit; inspect before publishing. |
| Client session | SecureStore/localStorage key `pocketcontrol.session` | Device ID and derived server endpoints. | Runtime data; never commit/export. |

There are no application environment variables currently required by the
source. `start.bat` relies on `npm` being on `PATH` and the standard venv path.

## 15. Common failure cases

| Problem | Likely cause | Where to investigate | Possible solution |
| --- | --- | --- | --- |
| QR scanner finds no usable data | Partial/old QR, camera permission, or scanner/platform issue | `client/src/data/auth.jsx`, `client/app.json`, server console | Grant camera permission, scan the current full terminal QR, and verify the decoded value is hex. |
| QR decodes but auth rejects | Token from another server process or unreachable/wrong IP | `server/data/authDATA.py`, `auth.py`, `network.py`, server log | Restart/scan the current QR; fix local interface/firewall/network reachability. |
| Pairing succeeds but command list is denied | Device ID missing from or removed from whitelist | `whitelistJsonHandler.py`, `whitelist.json`, `context.jsx` | Verify file access and device ID; pair again or restore intended whitelist state. |
| Stored session points to old host | Session persists across server/network changes | `auth.jsx`, `context.jsx` | Disconnect/clear storage and scan the new server QR. |
| Old buttons remain after reconnect | A future change bypassed `establishSession()` cache clearing | `context.jsx` | Preserve the clear-before-fetch behavior. |
| New command does not appear | Server did not restart, JSON invalid, or command load returned empty | `commands.json`, `commandJsonHandler.py`, log | Fix JSON, restart server, and press Refresh commands. |
| New dedicated command shows no screen | Missing registration in dynamic route | `client/src/app/command/[commandName].tsx` | Add an explicit name-to-component branch. |
| HTTP command returns handler error | Name/args mismatch or host API failure | `commands.py`, `serverHandler.py`, server log | Match the JSON name and keyword args; test the host action locally. |
| Mouse screen retries then disconnects | Wrong WebSocket URL, auth rejection, unavailable host, or retry cap | `mouseControlPage.jsx`, WebSocket endpoint, server log | Reconnect the session, verify whitelist/network, and reopen the screen. |
| Mouse movement disappears during network loss | Pending deltas are intentionally cleared on socket close | `mouseControlPage.jsx` | Reapply movement after reconnection; change buffering only with care. |
| `start.bat` exits immediately | Missing venv, `node_modules`, or `npm` | `start.bat` | Run the documented setup commands and ensure npm is on `PATH`. |
| Android build fails after dependency/config changes | Missing Android SDK/native dependency incompatibility/generated project state | `client/package.json`, `app.json`, Expo SDK 57 docs | Reinstall dependencies/regenerate native folders and follow SDK 57 package compatibility guidance. |
| Server starts on the wrong interface | UDP address probe selected a different local adapter | `server/app/auth/network.py` | Inspect local interfaces and adjust discovery policy if necessary. |

Rows above are based on current implementation. A future issue not represented
by source behavior should be marked `TODO: verify` here rather than documented
as fact.

## 16. Design and architecture decisions

The following are observable design decisions. Historical motivations are not
recorded in the repository, so the consequences below are technical
observations rather than claims about original intent.

### HTTP/JSON plus WebSocket

The app uses ordinary HTTP requests for authentication, command discovery, and
simple commands. It uses a WebSocket for the high-frequency mouse-control
interaction. This keeps simple operations request/response based while
allowing a long-lived interactive channel. It also means there are two auth
flows to keep compatible: `X-Device-ID`/body auth for HTTP and a first-message
auth handshake for WebSocket.

### QR-based local pairing

The server prints all connection bootstrap data as a compressed hex payload in
a terminal QR. This avoids hard-coding the host IP in the mobile app and makes
the local server easy to discover manually. It also means pairing depends on
terminal visibility, camera scanning, the selected LAN interface, and an
HTTP (not HTTPS) local-network URL.

### Device whitelist

The token is used to add a device ID to a local JSON whitelist. Subsequent
protected requests use the whitelist rather than resubmitting the token. This
allows an already-paired client to survive a server restart, but it also means
logout is local only and revocation requires editing/removing the device ID
from `whitelist.json`.

### Data-driven command generation

The server owns `commands.json` and returns it to the client. This keeps the
main client button list extensible without a client change for every simple
host command. The consequence is that registry names, handler names, argument
keys, IDs, transport, and UI mode form a cross-project contract.

### Explicit dynamic command routing

`isSolid: false` means “navigate to a command screen,” but the dynamic route
still explicitly maps supported names to components. This avoids importing
arbitrary code from server data and makes unsupported screens visible instead
of silently failing. Adding a non-solid command requires both server registry
data and a client route registration.

### Client/server separation

The client never performs host actions directly. It owns presentation,
session state, touch interpretation, and transport requests; the server owns
authorization, command resolution, and OS integration. A new host capability
therefore normally requires a server handler and registry entry, with client
changes only if it needs runtime input or a dedicated screen.

## 17. Where do I look if I want to change X?

| I want to... | Look here |
| --- | --- |
| Add a server command | `server/src/server/app/core/commands.py` and `server/src/server/data/commands.json` |
| Add command parameters | Handler signature in `server/src/server/app/core/commands.py`; defaults/config in `commands.json`; runtime input in a client screen if needed |
| Add a dedicated command screen | New component under `client/src/component/`, then registration in `client/src/app/command/[commandName].tsx` |
| Change authentication | `server/src/server/app/api/serverHandler.py`, `server/src/server/app/services/whitelistJsonHandler.py`, and `client/src/data/auth.jsx` |
| Change pairing | `server/src/server/data/authDATA.py`, `server/src/server/app/auth/auth.py`, `server/src/server/app/auth/network.py`, and `client/src/data/auth.jsx` |
| Change an API endpoint | FastAPI decorators/handlers in `server/src/server/app/api/serverHandler.py`, QR path data in `authDATA.py`, and client request builders in `client/src/data/` |
| Change command buttons | `client/src/component/ScrollView.jsx` and `client/src/component/Button.jsx` |
| Change navigation | `client/src/app/_layout.tsx`, route files under `client/src/app/`, and `client/src/component/Header.jsx` |
| Change logging | `server/src/server/app/services/logger.py` and log calls in `serverHandler.py`/services |
| Change server configuration | `server/src/server/main.py`, `server/src/server/app/auth/network.py`, `server/pyproject.toml`, and `server/src/server/data/` |
| Change UI styling | `client/src/stylesheet/styles.tsx` |
| Change mouse gestures/reconnect | `client/src/component/mouseControlPage.jsx` |
| Change host mouse behavior | `server/src/server/app/core/mouseControl.py` and wrapper in `commands.py` |
| Change Android build settings | `client/app.json`, `client/eas.json`, `client/package.json`; generated `client/android` is ignored and should not be treated as source |
| Change dependencies | `server/pyproject.toml`/`uv.lock` or `client/package.json`/`package-lock.json` |

## 18. Returning-to-the-project checklist

```text
[ ] Read README.md and this DEVELOPMENT.md.
[ ] Check git status and avoid committing local logs, whitelist changes,
    node_modules, .venv, or generated native folders.
[ ] Confirm Python 3.12+ and Node/npm are installed.
[ ] Confirm server\.venv and client\node_modules exist.
[ ] Start the server and verify it prints a fresh QR.
[ ] Start the Expo client with start.bat or npm run start.
[ ] Test QR scanning and /api/v1/auth pairing.
[ ] Test command-list loading and Refresh commands.
[ ] Test volume/open-URL HTTP commands.
[ ] Test mouseControl WebSocket auth, movement, click, and reconnect.
[ ] Check server console and server/logs/pocketcontrol.log.
[ ] Run npm run lint after client changes.
[ ] Recheck commands.json, endpoint paths, and this document after
    architecture changes.
```

## 19. Documentation maintenance

When changing the implementation:

1. Update the relevant source and its directly related section here in the
   same change.
2. Search for all references to changed route paths, command names, storage
   keys, and config fields before editing.
3. Verify examples against the Pydantic models and actual client request
   builders.
4. Run the smallest relevant validation:
   - `npm run lint` for client changes.
   - Start the server and exercise the affected endpoint for server changes.
   - Pair a client and run a command when changing auth, networking, or the
     command contract.
5. If a behavior cannot be established from source or a reproducible test,
   write `TODO: verify` instead of guessing.

