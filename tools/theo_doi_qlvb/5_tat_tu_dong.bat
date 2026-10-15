@echo off
schtasks /Delete /TN "BanLamViec\QLVB_0730" /F
schtasks /Delete /TN "BanLamViec\QLVB_1330" /F
schtasks /Delete /TN "BanLamViec\QLVB_1700" /F
schtasks /Delete /TN "BanLamViec\TheoDoiQLVB" /F >nul 2>&1
pause
