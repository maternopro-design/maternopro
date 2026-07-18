Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = Replace(WScript.ScriptFullName, WScript.ScriptName, "")
WshShell.Run "cmd /c """ & WshShell.CurrentDirectory & "MỞ TRANG WEB.bat""", 0, False
Set WshShell = Nothing
