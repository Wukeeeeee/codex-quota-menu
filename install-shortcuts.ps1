$ErrorActionPreference = 'Stop'
$patchRoot = $PSScriptRoot
$shell = New-Object -ComObject WScript.Shell
$destinations = @(
    (Join-Path $shell.SpecialFolders.Item('Desktop') 'ChatGPT Menu.lnk'),
    (Join-Path ([Environment]::GetFolderPath('Programs')) 'ChatGPT Menu.lnk')
)
foreach ($shortcutPath in $destinations) {
    if (Test-Path -LiteralPath $shortcutPath) {
        $previous = $shell.CreateShortcut($shortcutPath)
        if ($previous.Arguments -notlike ('*' + $patchRoot + '*')) {
            Copy-Item -LiteralPath $shortcutPath -Destination (Join-Path $patchRoot ('previous-' + [IO.Path]::GetFileName([IO.Path]::GetDirectoryName($shortcutPath)) + '.lnk')) -Force
        }
    }
    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = Join-Path $env:WINDIR 'System32\wscript.exe'
    $shortcut.Arguments = '"' + (Join-Path $patchRoot 'ChatGPT Menu.vbs') + '"'
    $shortcut.WorkingDirectory = $patchRoot
    $shortcut.IconLocation = (Join-Path $patchRoot 'client\ChatGPT.exe') + ',0'
    $shortcut.Description = 'ChatGPT 顶部菜单扩展'
    $shortcut.Save()
    $shortcutPath
}


