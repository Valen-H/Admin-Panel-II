rem starts compilers

taskkill /f /t /fi "windowtitle eq build"
taskkill /f /t /fi "windowtitle eq start"
taskkill /f /t /fi "windowtitle eq cmd"

start "tsc" /realtime /min /i cmd.exe /f:on /u /k "mode con: lines=35 cols=85 & npm run build"
start "start" /realtime /i cmd.exe /f:on /u /k "mode con: lines=35 cols=85 & npm test"
start "cmd" /realtime /i cmd.exe /f:on /u /k "mode con: lines=35 cols=85"
