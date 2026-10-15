@echo off
chcp 65001 >nul
cd /d "%~dp0"
rem Xoa lich cu (moi tieng 1 lan) neu co
schtasks /Delete /TN "BanLamViec\TheoDoiQLVB" /F >nul 2>&1
set TR=wscript.exe "%~dp0chay_an.vbs"
schtasks /Create /TN "BanLamViec\QLVB_0730" /TR "%TR%" /SC WEEKLY /D MON,TUE,WED,THU,FRI /ST 07:30 /F
if errorlevel 1 (echo Khong tao duoc lich. & pause & exit /b 1)
schtasks /Create /TN "BanLamViec\QLVB_1330" /TR "%TR%" /SC WEEKLY /D MON,TUE,WED,THU,FRI /ST 13:30 /F
schtasks /Create /TN "BanLamViec\QLVB_1700" /TR "%TR%" /SC WEEKLY /D MON,TUE,WED,THU,FRI /ST 17:00 /F
echo.
echo Da bat: Thu Hai den Thu Sau, quet va gui mail luc 7:30, 13:30, 17:00.
echo Tat: chay 5_tat_tu_dong.bat
pause
