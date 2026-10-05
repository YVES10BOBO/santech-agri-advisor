@echo off
REM Stops the backend (port 8000), the frontend (port 3000) and ngrok started by start-all.bat.

for %%P in (8000 3000) do (
    for /f "tokens=5" %%I in ('netstat -ano ^| findstr /r /c:":%%P .*LISTENING"') do (
        echo Stopping process %%I on port %%P...
        taskkill /PID %%I /T /F >nul 2>&1
    )
)
taskkill /IM ngrok.exe /F >nul 2>&1 && echo Stopped ngrok.
echo Done.
