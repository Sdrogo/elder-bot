@echo off
rem Avvia Elder Overlay. Lascia aperta questa finestra mentre usi OBS.
cd /d "%~dp0"
node src\server.ts
pause
