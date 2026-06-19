@echo off
title Console Arcade Jeux
echo Demarrage du serveur local pour l'Arcade de Jeux...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
pause
