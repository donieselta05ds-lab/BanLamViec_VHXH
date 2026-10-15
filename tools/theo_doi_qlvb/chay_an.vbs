' Chay script an (khong hien cua so den) - Task Scheduler goi tep nay luc 7:30, 13:30, 17:00
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
CreateObject("WScript.Shell").Run "cmd /c cd /d """ & dir & """ && py theo_doi_qlvb.py >> du_lieu\chay.log 2>&1", 0, False
