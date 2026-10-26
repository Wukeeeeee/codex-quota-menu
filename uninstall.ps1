$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath($PSScriptRoot).TrimEnd('\')
$clientRoot = [IO.Path]::GetFullPath((Join-Path $projectRoot 'client')).TrimEnd('\') + '\'
$shell = New-Object -ComObject WScript.Shell
$shortcutPaths = @(
    (Join-Path $shell.SpecialFolders.Item('Desktop') 'ChatGPT Menu.lnk'),
    (Join-Path ([Environment]::GetFolderPath('Programs')) 'ChatGPT Menu.lnk')
)

$running = Get-CimInstance Win32_Process -Filter "Name = 'ChatGPT.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.ExecutablePath -and $_.ExecutablePath.StartsWith($clientRoot, [StringComparison]::OrdinalIgnoreCase) }
foreach ($process in $running) {
    $app = Get-Process -Id $process.ProcessId -ErrorAction SilentlyContinue
    if ($app -and $app.MainWindowHandle -ne 0) { [void]$app.CloseMainWindow() }
}
if ($running) {
    Start-Sleep -Seconds 3
    $stillRunning = Get-CimInstance Win32_Process -Filter "Name = 'ChatGPT.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.ExecutablePath -and $_.ExecutablePath.StartsWith($clientRoot, [StringComparison]::OrdinalIgnoreCase) }
    if ($stillRunning) {
        throw 'ChatGPT Menu 仍在运行。请先关闭它，再重新运行 uninstall.ps1；未删除任何生成文件。'
    }
}

foreach ($shortcutPath in $shortcutPaths) {
    if (-not (Test-Path -LiteralPath $shortcutPath)) { continue }
    $shortcut = $shell.CreateShortcut($shortcutPath)
    $ownedByProject = $shortcut.Arguments -like ('*' + (Join-Path $projectRoot 'ChatGPT Menu.vbs') + '*')
    if (-not $ownedByProject) { continue }

    $backupName = 'previous-' + [IO.Path]::GetFileName([IO.Path]::GetDirectoryName($shortcutPath)) + '.lnk'
    $backupPath = Join-Path $projectRoot $backupName
    if (Test-Path -LiteralPath $backupPath) {
        Move-Item -LiteralPath $backupPath -Destination $shortcutPath -Force
    } else {
        Remove-Item -LiteralPath $shortcutPath -Force
    }
}

foreach ($relativePath in @('client', 'cache', 'launcher.log')) {
    $target = [IO.Path]::GetFullPath((Join-Path $projectRoot $relativePath))
    if (-not $target.StartsWith($projectRoot + '\', [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Generated path check failed; nothing outside the project will be removed.'
    }
    if (Test-Path -LiteralPath $target) { Remove-Item -LiteralPath $target -Recurse -Force }
}

Write-Output 'Removed ChatGPT Menu shortcuts and generated client/cache files. Official ChatGPT remains installed.'

