$ErrorActionPreference = 'Stop'
$patchRoot = $PSScriptRoot
$clientRoot = Join-Path $patchRoot 'client'
$logPath = Join-Path $patchRoot 'launcher.log'
try {
    $sourceRoot = $null
    $package = Get-AppxPackage -Name 'OpenAI.Codex' -ErrorAction SilentlyContinue | Sort-Object Version -Descending | Select-Object -First 1
    if ($package) { $sourceRoot = Join-Path $package.InstallLocation 'app' }
    if (-not $sourceRoot) {
        $candidates = Get-ChildItem -LiteralPath 'C:\Program Files\WindowsApps' -Directory -Filter 'OpenAI.Codex_*_x64__2p2nqsd0c76g0' -ErrorAction SilentlyContinue | Sort-Object Name -Descending
        if ($candidates) { $sourceRoot = Join-Path $candidates[0].FullName 'app' }
    }
    if (-not $sourceRoot) {
        $knownCurrentRoot = 'C:\Program Files\WindowsApps\OpenAI.Codex_26.1021.3705.0_x64__2p2nqsd0c76g0\app'
        if (Test-Path -LiteralPath (Join-Path $knownCurrentRoot 'ChatGPT.exe')) { $sourceRoot = $knownCurrentRoot }
    }
    if (-not $sourceRoot -or -not (Test-Path -LiteralPath (Join-Path $sourceRoot 'ChatGPT.exe'))) { throw '找不到官方 ChatGPT 安装。请先安装官方桌面客户端。' }
    $nodePath = (Get-Command node.exe -ErrorAction Stop).Source
    $metaPath = Join-Path $clientRoot 'quota-patch.json'
    if (Test-Path -LiteralPath $metaPath) {
        $meta = Get-Content -LiteralPath $metaPath -Raw | ConvertFrom-Json
        if ($meta.source -ne $sourceRoot) {
            $runningCopy = Get-Process -Name ChatGPT -ErrorAction SilentlyContinue | Where-Object { $_.Path -and $_.Path.StartsWith($clientRoot + '\', [StringComparison]::OrdinalIgnoreCase) }
            if ($runningCopy) { throw '请先退出正在运行的 ChatGPT Menu 客户端，再启动更新。' }
            $resolvedClient = [IO.Path]::GetFullPath($clientRoot)
            $expectedClient = [IO.Path]::GetFullPath((Join-Path $patchRoot 'client'))
            if ($resolvedClient -ne $expectedClient -or -not $resolvedClient.StartsWith([IO.Path]::GetFullPath($patchRoot) + '\', [StringComparison]::OrdinalIgnoreCase)) { throw '补丁目录检查失败。' }
            Remove-Item -LiteralPath $resolvedClient -Recurse -Force
        }
    }
    & $nodePath (Join-Path $patchRoot 'build-patch.cjs') $sourceRoot 2>&1 | Out-File -LiteralPath $logPath -Append -Encoding utf8
    if ($LASTEXITCODE -ne 0) { throw ('补丁生成失败。详情见：' + $logPath) }
    $officialRunning = Get-Process -Name ChatGPT -ErrorAction SilentlyContinue | Where-Object { $_.Path -and $_.Path.StartsWith($sourceRoot + '\', [StringComparison]::OrdinalIgnoreCase) }
    if ($officialRunning) { throw '补丁已准备好。请先从托盘完全退出当前 ChatGPT，再从“ChatGPT ChatGPT Menu”启动。' }
    $patchCache = Join-Path $patchRoot 'cache'
    Start-Process -FilePath (Join-Path $clientRoot 'ChatGPT.exe') -ArgumentList ('--disk-cache-dir="' + $patchCache + '"') -WindowStyle Normal
} catch {
    Add-Content -LiteralPath $logPath -Value $_.Exception.Message -Encoding utf8
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, 'ChatGPT ChatGPT Menu', 'OK', 'Information') | Out-Null
}



