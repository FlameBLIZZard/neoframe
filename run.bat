@echo off
title NEOFRAME local preview
echo Starting NEOFRAME on http://localhost:8080 (the waitlist form only works on the deployed site) ...
cd /d "%~dp0"
python server.py
pause
