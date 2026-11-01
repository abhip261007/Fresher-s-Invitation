@echo off
title SAARTHI 2026 - Freshers Party Portal
echo ========================================================
echo   Launching SAARTHI 2026 - Freshers Celebration Portal
echo   College of Agriculture Information Technology (CAIT)
echo ========================================================
echo.
timeout /t 2 /nobreak >nul
start http://localhost:5173/
npm run dev -- --host 0.0.0.0 --port 5173
