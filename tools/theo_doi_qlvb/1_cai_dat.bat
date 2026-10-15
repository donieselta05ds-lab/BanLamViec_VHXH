@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo === Cai thu vien Python can thiet ===
py -m pip install -r requirements.txt
if errorlevel 1 (echo Loi: chua cai Python. Tai tai https://www.python.org/downloads/ va tick "Add python.exe to PATH". & pause & exit /b 1)
if not exist cau_hinh.ini (copy cau_hinh.mau.ini cau_hinh.ini >nul & echo Da tao cau_hinh.ini - mo ra sua ten truy cap qlvb.)
echo.
echo Xong. Buoc tiep: sua cau_hinh.ini, roi chay 2_luu_mat_khau.bat
pause
