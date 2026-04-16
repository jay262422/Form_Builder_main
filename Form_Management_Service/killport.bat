@echo off
echo Killing process on port 3004...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3004') do taskkill /f /pid %%a
echo Port 3004 cleared. 