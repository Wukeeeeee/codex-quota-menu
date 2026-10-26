$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot

if (-not $IsWindows -and $env:OS -ne 'Windows_NT') {
    throw 'ChatGPT Quota Menu requires Windows.'
}

$package = Get-AppxPackage -Name 'OpenAI.Codex' -ErrorAction SilentlyContinue |
    Sort-Object Version -Descending |
    Select-Object -First 1
if ($package) {
    $officialRoot = Join-Path $package.InstallLocation 'app'
} else {
    $packageDirectory = Get-ChildItem -LiteralPath 'C:\Program Files\WindowsApps' -Directory `
        -Filter 'OpenAI.Codex_*_x64__2p2nqsd0c76g0' -ErrorAction SilentlyContinue |
        Sort-Object Name -Descending |
        Select-Object -First 1
    if ($packageDirectory) { $officialRoot = Join-Path $packageDirectory.FullName 'app' }
}
if (-not $officialRoot) {
    $knownCurrentRoot = 'C:\Program Files\WindowsApps\OpenAI.Codex_26.1021.3705.0_x64__2p2nqsd0c76g0\app'
    if (Test-Path -LiteralPath (Join-Path $knownCurrentRoot 'ChatGPT.exe')) { $officialRoot = $knownCurrentRoot }
}
if (-not $officialRoot -or -not (Test-Path -LiteralPath (Join-Path $officialRoot 'ChatGPT.exe'))) {
    throw 'Microsoft Store 版 ChatGPT/Codex 未安装。请先安装官方桌面客户端。'
}
if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) {
    throw '找不到 Node.js。请安装 Node.js 并确认 node.exe 已加入 PATH。'
}

& (Join-Path $projectRoot 'install-shortcuts.ps1') | Out-Null
$launcher = Join-Path $projectRoot 'ChatGPT Menu.vbs'
Start-Process -FilePath (Join-Path $env:WINDIR 'System32\wscript.exe') -ArgumentList ('"' + $launcher + '"')
Write-Output 'ChatGPT Menu shortcut installed. The patched client is starting.'


