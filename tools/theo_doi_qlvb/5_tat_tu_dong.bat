@echo off
schtasks /Delete /TN "BanLamViec\TuQuetQLVB" /F
schtasks /Delete /TN "BanLamViec\QLVB_0730" /F >nul 2>&1
schtasks /Delete /TN "BanLamViec\QLVB_1330" /F >nul 2>&1
schtasks /Delete /TN "BanLamViec\QLVB_1700" /F >nul 2>&1
schtasks /Delete /TN "BanLamViec\TheoDoiQLVB" /F >nul 2>&1
pause
