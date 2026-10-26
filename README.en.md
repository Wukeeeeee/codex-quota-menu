# ChatGPT Quota Menu

A Windows desktop experiment that displays the 5-hour and 7-day allowance, SVG rings, reset times, and countdowns beside the **Help** item in the ChatGPT desktop app's top menu bar.

> **Experimental prototype.** The menu was observed on Microsoft Store build `OpenAI.Codex 26.1021.3705.0`. Launching through the original shortcut, update compatibility, and rollback have not been verified. This is not an official OpenAI plugin and is not supported by OpenAI.

## Important: launch method and signature

This project creates a separate local copy of the ChatGPT desktop client and edits the copy's `app.asar` and matching integrity record. It does not modify the official installation under WindowsApps, but the modified copy no longer has OpenAI's original digital signature.

For a cold start, use the **ChatGPT Menu** shortcut created by this project or double-click `ChatGPT Menu.vbs`. The original shortcut does not load this patch on cold start. If the official client is already running, its shortcut may only bring the same process to the foreground. Fully exit the official client before starting the patched copy.

## Install and start

Requires Windows, the Microsoft Store ChatGPT/Codex desktop app, and Node.js available on `PATH`.

1. Download or clone this repository.
2. Double-click `ChatGPT Menu.vbs`. The launcher reads the official installation, builds a local copy in the repository folder, and starts it.
3. Optional: run `install-shortcuts.ps1` to create **ChatGPT Menu** shortcuts on the Desktop and in the Start menu.
4. Use **ChatGPT Menu** for later cold starts. If prompted, fully exit the official app from the system tray first.

The menu reads the app's existing quota response; it does not call a model. Ring percentages show remaining allowance. Countdown labels update automatically, and quota data refreshes about every two minutes.

## Uninstall

Close the patched copy, delete the **ChatGPT Menu** shortcuts and this repository folder. Start the official client from its original shortcut to return to the unmodified app. This project does not replace the official shortcut.

## Known limitations

- Original-shortcut cold-start integration is not implemented. This is a separate-copy launcher, not an extension automatically attached to the official process.
- Display was verified only on the version listed above. An app update may change internal scripts and require an adaptation.
- The current build/launch flow has no complete transactional rollback. Interrupted updates, concurrent launches, and same-version rebuilds have not been verified.
- The official app and patched copy use the same user data directory by default. Do not run both at once or rely on the patched copy as your only client for important data.
- The modified copy does not retain OpenAI's original signature. Do not distribute generated `client/` files or any official binaries; this repository contains project source only.

## Development

Close all ChatGPT/Codex desktop processes before changing the patch. The builder depends on the official app's packaged-file format and private internal function structure. It stops when it cannot recognize the expected version. Do not disable Windows or application security checks to work around a failure.

## Disclaimer

This is an independent community experiment and is not affiliated with OpenAI or Microsoft. ChatGPT, Codex, and related marks belong to their respective owners. Use of a modified desktop client is at your own risk.

License: MIT. See [LICENSE](LICENSE).

