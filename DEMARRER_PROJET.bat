@echo off
title UniHelp AI - Hackathon Launch
echo.
echo  ========================================
echo    UniHelp AI : Assistant Universitaire
echo           HACKATHON EDITION 2024
echo  ========================================
echo.

:: 1. Démarrer le Backend
echo [1/3] Demarrage du Backend sur le port 3001...
start "Backend" /D "ai-assistant-back" npm run start:dev

:: 2. Attendre quelques secondes
echo [2/3] Verification des dependances...
timeout /t 5 /nobreak > nul

:: 3. Démarrer le Frontend
echo [3/3] Demarrage de l'interface sur le port 5173...
start "Frontend" /D "ai-assistant-front" npm run dev

echo.
echo ========================================
echo  🚀 TOUT EST PRET !
echo  - Portail : http://localhost:5173
echo  - API Docs : http://localhost:3001/api
echo ========================================
echo.
pause
