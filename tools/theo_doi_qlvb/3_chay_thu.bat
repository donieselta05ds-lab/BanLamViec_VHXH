@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Chrome se mo ra de ban xem script dang nhap va doc qlvb...
py theo_doi_qlvb.py --thu
pause
