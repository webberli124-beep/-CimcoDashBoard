' ============================================
'  CIMCO MDC Dashboard - One-Click Launcher
'  launch.vbs
' ============================================
Option Explicit

Dim fso, shell, baseDir, nodePath, nodeCmd, serverEntry
Dim envFile, port, logDir, logFile, logStream

Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

' -- Resolve base directory --
baseDir = fso.GetParentFolderName(WScript.ScriptFullName)
shell.CurrentDirectory = baseDir

' -- Setup logging --
logDir = baseDir & "\logs"
On Error Resume Next
If Not fso.FolderExists(logDir) Then fso.CreateFolder(logDir)
logFile = logDir & "\startup-" & FormatDateTime2(Now) & ".log"
Set logStream = fso.OpenTextFile(logFile, 8, True)
If Err.Number <> 0 Then
    ' Fallback: use temp dir if logs dir is locked
    logFile = fso.BuildPath(fso.GetSpecialFolder(2), "cimco-startup.log")
    Set logStream = fso.OpenTextFile(logFile, 8, True)
End If
On Error GoTo 0

WriteLog "=========================================="
WriteLog "Dashboard startup initiated"
WriteLog "Base directory: " & baseDir

' -- Step 1: Detect Node.js --
WriteLog "[Step 1] Detecting Node.js..."
nodePath = ""

' Priority 1: Bundled portable node\node.exe
If fso.FileExists(baseDir & "\node\node.exe") Then
    Dim bundledVer
    bundledVer = RunCmd("""" & baseDir & "\node\node.exe"" -v")
    If Len(bundledVer) > 0 And Left(bundledVer, 1) = "v" Then
        nodePath = baseDir & "\node\node.exe"
        WriteLog "  Found bundled Node.js: " & bundledVer
    Else
        WriteLog "  Bundled node.exe exists but failed to run"
    End If
End If

' Priority 2: System PATH
If nodePath = "" Then
    Dim sysVer
    sysVer = RunCmd("node -v")
    If Len(sysVer) > 0 And Left(sysVer, 1) = "v" Then
        nodePath = "node"
        WriteLog "  Found system Node.js: " & sysVer
    End If
End If

' Not found
If nodePath = "" Then
    WriteLog "[FAIL] Node.js not found"
    MsgBox "Node.js is not installed." & vbCrLf & vbCrLf & _
           "Please install Node.js v22 LTS from:" & vbCrLf & _
           "https://nodejs.org/" & vbCrLf & vbCrLf & _
           "Or use the Full package that includes portable Node.js.", _
           vbCritical, "CIMCO Dashboard - Error"
    shell.Run "https://nodejs.org/en/download", 1, False
    CleanupAndExit 1
End If

nodeCmd = nodePath

' -- Step 2: Check node_modules --
WriteLog "[Step 2] Checking dependencies..."
If Not fso.FolderExists(baseDir & "\node_modules\express") Then
    WriteLog "  express not found, running npm install..."
    Dim npmCmd, npmRet
    If fso.FileExists(baseDir & "\node\npm.cmd") Then
        npmCmd = """" & baseDir & "\node\npm.cmd"""
    Else
        npmCmd = "npm"
    End If
    npmRet = shell.Run("cmd /c cd /d """ & baseDir & """ && " & npmCmd & " install --omit=dev >nul 2>&1", 0, True)
    If npmRet <> 0 Then
        WriteLog "[FAIL] npm install failed (exit code: " & npmRet & ")"
        MsgBox "Failed to install dependencies (exit code: " & npmRet & ")." & vbCrLf & vbCrLf & _
               "Please check internet connection and run manually:" & vbCrLf & _
               "npm install --omit=dev" & vbCrLf & vbCrLf & _
               "Log: " & logFile, _
               vbCritical, "CIMCO Dashboard - Error"
        CleanupAndExit 1
    End If
    WriteLog "  npm install completed"
Else
    WriteLog "  Dependencies OK"
End If

' -- Step 3: Check dist/index.html --
WriteLog "[Step 3] Checking frontend files..."
If Not fso.FileExists(baseDir & "\dist\index.html") Then
    WriteLog "[FAIL] dist/index.html not found"
    MsgBox "Frontend files not found (dist/index.html)." & vbCrLf & vbCrLf & _
           "The package may be incomplete." & vbCrLf & _
           "Please re-download or contact support.", _
           vbCritical, "CIMCO Dashboard - Error"
    CleanupAndExit 1
End If
WriteLog "  Frontend files OK"

' -- Step 4: Check .env --
WriteLog "[Step 4] Checking configuration..."
envFile = baseDir & "\.env"
If Not fso.FileExists(envFile) Then
    If fso.FileExists(baseDir & "\.env.example") Then
        fso.CopyFile baseDir & "\.env.example", envFile
        WriteLog "  Created .env from .env.example"
    Else
        WriteLog "[FAIL] .env and .env.example both missing"
        MsgBox "Configuration file .env not found." & vbCrLf & vbCrLf & _
               "Please create a .env file. See INSTALL.md.", _
               vbCritical, "CIMCO Dashboard - Error"
        CleanupAndExit 1
    End If
End If
WriteLog "  Configuration OK"

' -- Step 5: Check server/dist/index.js --
WriteLog "[Step 5] Checking server files..."
serverEntry = baseDir & "\server\dist\index.js"
If Not fso.FileExists(serverEntry) Then
    WriteLog "[FAIL] server/dist/index.js not found"
    MsgBox "Server files not found (server/dist/index.js)." & vbCrLf & vbCrLf & _
           "The package may be incomplete." & vbCrLf & _
           "Please re-download or contact support.", _
           vbCritical, "CIMCO Dashboard - Error"
    CleanupAndExit 1
End If
WriteLog "  Server files OK"

' -- Step 6: Read SERVER_PORT from .env --
WriteLog "[Step 6] Reading port..."
port = "3002"
Dim envStream, envLine, eqPos
Set envStream = fso.OpenTextFile(envFile, 1)
Do While Not envStream.AtEndOfStream
    envLine = Trim(envStream.ReadLine)
    If Left(envLine, 1) <> "#" And Len(envLine) > 0 Then
        eqPos = InStr(envLine, "=")
        If eqPos > 0 Then
            If Trim(Left(envLine, eqPos - 1)) = "SERVER_PORT" Then
                Dim pVal
                pVal = Trim(Mid(envLine, eqPos + 1))
                If Len(pVal) > 0 Then port = pVal
            End If
        End If
    End If
Loop
envStream.Close
' Validate port is numeric and in range
If Not IsNumeric(port) Then
    WriteLog "[FAIL] Invalid SERVER_PORT: " & port
    MsgBox "Invalid SERVER_PORT value in .env: " & port & vbCrLf & vbCrLf & _
           "SERVER_PORT must be a number between 1 and 65535.", _
           vbCritical, "CIMCO Dashboard - Error"
    CleanupAndExit 1
End If
Dim portNum
portNum = CLng(port)
If portNum < 1 Or portNum > 65535 Then
    WriteLog "[FAIL] SERVER_PORT out of range: " & port
    MsgBox "SERVER_PORT out of range: " & port & vbCrLf & vbCrLf & _
           "Must be between 1 and 65535.", _
           vbCritical, "CIMCO Dashboard - Error"
    CleanupAndExit 1
End If
WriteLog "  SERVER_PORT = " & port

' -- Step 7: Check port in use --
WriteLog "[Step 7] Checking port..."
Dim portCheck
portCheck = RunCmd("netstat -an | findstr "":" & port & " """)
If InStr(portCheck, "LISTENING") > 0 Then
    WriteLog "[WARN] Port " & port & " already in use"
    Dim choice
    choice = MsgBox("Port " & port & " is already in use." & vbCrLf & vbCrLf & _
           "The dashboard may already be running." & vbCrLf & _
           "Open http://localhost:" & port & " ?" & vbCrLf & vbCrLf & _
           "[Yes] Open browser    [No] Exit", _
           vbQuestion + vbYesNo, "CIMCO Dashboard")
    If choice = vbYes Then
        shell.Run "http://localhost:" & port, 1, False
    End If
    CleanupAndExit 0
End If
WriteLog "  Port " & port & " available"

' -- Step 8: Start server (hidden window) --
WriteLog "[Step 8] Starting server..."
Dim cmdLine
If nodePath = "node" Then
    cmdLine = "node """ & serverEntry & """"
Else
    cmdLine = """" & nodePath & """ """ & serverEntry & """"
End If
WriteLog "  Command: " & cmdLine
shell.Run "cmd /c cd /d """ & baseDir & """ && " & cmdLine, 0, False
WriteLog "  Server launched"

' -- Step 9: Wait --
WriteLog "[Step 9] Waiting 3s for server..."
WScript.Sleep 3000

' -- Step 10: Open browser + show LAN IP --
WriteLog "[Step 10] Opening browser..."
Dim url
url = "http://localhost:" & port
shell.Run url, 1, False
WriteLog "  Opened: " & url

' Detect LAN IP for other devices (TV, phone, etc.)
Dim lanIP
lanIP = GetLanIP()
WriteLog "  LAN IP: " & lanIP

If Len(lanIP) > 0 Then
    WriteLog "  Network: http://" & lanIP & ":" & port
End If

WriteLog "Startup completed successfully"
WriteLog "=========================================="

CleanupAndExit 0

' ============================================
' Helper Functions
' ============================================

Sub WriteLog(msg)
    On Error Resume Next
    logStream.WriteLine FormatDateTime(Now, 0) & "  " & msg
    On Error GoTo 0
End Sub

Function FormatDateTime2(d)
    FormatDateTime2 = Year(d) & "-" & _
        Right("0" & Month(d), 2) & "-" & _
        Right("0" & Day(d), 2) & "_" & _
        Right("0" & Hour(d), 2) & _
        Right("0" & Minute(d), 2) & _
        Right("0" & Second(d), 2)
End Function

Function RunCmd(cmd)
    ' Use temp file to capture output (avoids Shell.Exec stdout deadlock)
    Dim tmpFile, result
    tmpFile = fso.BuildPath(fso.GetSpecialFolder(2), fso.GetTempName)
    result = ""
    On Error Resume Next
    shell.Run "cmd /c " & cmd & " > """ & tmpFile & """ 2>&1", 0, True
    If fso.FileExists(tmpFile) Then
        Dim f
        Set f = fso.OpenTextFile(tmpFile, 1)
        If Not f.AtEndOfStream Then
            result = Trim(f.ReadAll)
        End If
        f.Close
        fso.DeleteFile tmpFile, True
    End If
    On Error GoTo 0
    RunCmd = result
End Function

Function GetLanIP()
    ' Get LAN IPv4 address via WMI
    Dim ip
    ip = ""
    On Error Resume Next
    Dim wmi, adapters, adapter
    Set wmi = GetObject("winmgmts:\\.\root\cimv2")
    Set adapters = wmi.ExecQuery("SELECT IPAddress FROM Win32_NetworkAdapterConfiguration WHERE IPEnabled = True")
    For Each adapter In adapters
        If Not IsNull(adapter.IPAddress) Then
            Dim addr
            For Each addr In adapter.IPAddress
                ' Pick first non-loopback IPv4 address
                If addr <> "127.0.0.1" And InStr(addr, ".") > 0 And InStr(addr, ":") = 0 Then
                    If ip = "" Then ip = addr
                End If
            Next
        End If
    Next
    On Error GoTo 0
    GetLanIP = ip
End Function

Sub CleanupAndExit(code)
    On Error Resume Next
    If IsObject(logStream) Then logStream.Close
    Set logStream = Nothing
    Set fso = Nothing
    Set shell = Nothing
    On Error GoTo 0
    WScript.Quit code
End Sub
