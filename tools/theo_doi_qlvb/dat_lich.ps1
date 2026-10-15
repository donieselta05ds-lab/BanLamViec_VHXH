# Tạo lịch tự quét qlvb: Thứ Hai đến Thứ Sáu lúc 7:30, 13:30, 17:00
#  - Máy đang ngủ (sleep) thì tự đánh thức để quét (WakeToRun)
#  - Lỡ giờ vì máy tắt thì mở máy lên là chạy bù ngay (StartWhenAvailable)
$thuMuc = Split-Path -Parent $MyInvocation.MyCommand.Path
$vbs = Join-Path $thuMuc "chay_an.vbs"
$ngay = @("Monday", "Tuesday", "Wednesday", "Thursday", "Friday")
$cacGio = @("07:30", "13:30", "17:00")
$trigger = foreach ($g in $cacGio) { New-ScheduledTaskTrigger -Weekly -DaysOfWeek $ngay -At $g }
$action = New-ScheduledTaskAction -Execute "wscript.exe" -Argument ('"' + $vbs + '"') -WorkingDirectory $thuMuc
$settings = New-ScheduledTaskSettingsSet -WakeToRun -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 20) -MultipleInstances IgnoreNew
# Xóa lịch cũ (nếu có)
foreach ($ten in @("TheoDoiQLVB", "QLVB_0730", "QLVB_1330", "QLVB_1700", "TuQuetQLVB")) {
  Unregister-ScheduledTask -TaskPath "\BanLamViec\" -TaskName $ten -Confirm:$false -ErrorAction SilentlyContinue
}
Register-ScheduledTask -TaskPath "\BanLamViec\" -TaskName "TuQuetQLVB" -Trigger $trigger -Action $action -Settings $settings `
  -Description "Quet qlvb va gui mail van ban moi (Ban lam viec Phong VHXH)" | Out-Null
Write-Host "Da bat: Thu Hai den Thu Sau, quet va gui mail luc 7:30, 13:30, 17:00."
Write-Host "May dang ngu thi tu danh thuc; lo gio vi tat may thi mo may len la chay bu."
