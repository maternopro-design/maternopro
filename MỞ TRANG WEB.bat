@echo off
title MaternoPro - Dang khoi dong...
echo ========================================
echo   MATERNOPRO - Dang khoi dong he thong
echo ========================================
echo.

:: Khoi dong backup server
echo [1/3] Khoi dong backup server...
start /min cmd /c "cd /d "%~dp0" && node backup_server.js"
timeout /t 2 /nobreak >nul

:: Khoi dong web server
echo [2/3] Khoi dong web server...
start /min cmd /c "cd /d "%~dp0" && npx serve . -p 3000"
timeout /t 3 /nobreak >nul

:: Mo trinh duyet
echo [3/3] Mo trinh duyet...
start "" "http://localhost:3000"

echo.
echo ========================================
echo   DA KHOI DONG XONG! 
echo   Du lieu cua co van con day du.
echo   Dong cua so nay di nhe!
echo ========================================
timeout /t 5 /nobreak >nul
