@echo off
chcp 65001 >nul
cd /d "%~dp0"
py theo_doi_qlvb.py --luu-mat-khau
py theo_doi_qlvb.py --gui-thu-mail
pause
