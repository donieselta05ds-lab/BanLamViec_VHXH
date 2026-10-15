@echo off
chcp 65001 >nul
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0dat_lich.ps1"
if errorlevel 1 (echo Khong tao duoc lich. & pause & exit /b 1)
echo.
echo Luu y: de may tu thuc day khi dang ngu, vao Control Panel - Power Options - Change plan settings -
echo Change advanced power settings - Sleep - Allow wake timers: Enable.
echo Tat lich: chay 5_tat_tu_dong.bat
pause
