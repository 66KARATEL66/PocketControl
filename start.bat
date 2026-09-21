@echo off
setlocal

pushd "%~dp0"
echo [PocketControl] Starting server...

if not exist "server\.venv\Scripts\python.exe" (
    echo [ERROR] server\.venv was not found.
    echo Create it with: python -m venv server\.venv
    popd
    exit /b 1
)

if not exist "client\node_modules" (
    echo [ERROR] client dependencies are not installed.
    echo Install them with: cd client ^&^& npm install
    popd
    exit /b 1
)

where npm.cmd >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm was not found on PATH.
    popd
    exit /b 1
)

start "PocketControl Server" /D "%~dp0" cmd /k ""%~dp0server\.venv\Scripts\python.exe" "%~dp0server\main.py""

echo [PocketControl] Starting Expo client...
pushd "client"
call npm.cmd run start
if errorlevel 1 (
    echo [ERROR] Expo failed to start.
    popd
    popd
    exit /b 1
)

popd
popd
endlocal
