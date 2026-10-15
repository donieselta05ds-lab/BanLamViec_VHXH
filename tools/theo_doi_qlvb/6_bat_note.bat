@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
> "%STARTUP%\BanLamViec_Note.vbs" echo CreateObject("WScript.Shell").Run "pyw ""%~dp0note_viec.pyw""", 0, False
start "" pyw "%~dp0note_viec.pyw"
echo Da mo note va cai tu mo khi bat may.
echo Tat tu mo: chay 7_tat_note.bat
pause
