$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
& "C:\Program Files\nodejs\node.exe" "$scriptPath\server.js"

