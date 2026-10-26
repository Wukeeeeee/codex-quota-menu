# ChatGPT Quota Menu

A Windows desktop experiment that displays the 5-hour and 7-day allowance, SVG rings, reset times, and countdowns beside the **Help** item in the ChatGPT desktop app's top menu bar.

> **Experimental prototype.** The menu was observed on Microsoft Store build `OpenAI.Codex 26.1021.3705.0`. Launching through the original shortcut, update compatibility, and rollback have not been verified. This is not an official OpenAI plugin and is not supported by OpenAI.

## Important: launch method and signature

This project creates a separate local copy of the ChatGPT desktop client and edits the copy's `app.asar` and matching integrity record. It does not modify the official installation under WindowsApps, but the modified copy no longer has OpenAI's original digital signature.

For a cold start, use the **ChatGPT Menu** shortcut created by this project or double-click `ChatGPT Menu.vbs`. The original shortcut does not load this patch on cold start. If the official client is already running, its shortcut may only bring the same process to the foreground. Fully exit the official client before starting the patched copy.

## Install and start

Requires Windows, the Microsoft Store ChatGPT/Codex desktop app, and Node.js available on `PATH`.

1. Download or clone this repository.
2. Open the repository in a local agent that can access this Windows computer and run local scripts, then send it this prompt. The agent will check prerequisites, run the installer, and report the result:

   ```text
   Install and start this repository's ChatGPT Quota Menu on this Windows computer. Read the README first, check that the Microsoft Store ChatGPT/Codex app and Node.js are available, then run install.ps1 from this repository. Do not modify the official shortcut, WindowsApps installation, or registry. If the official app is running, do not force-close it; tell me to exit it fully before continuing. Afterward, verify whether the ChatGPT Menu shortcut was created and whether the patched client actually started, and report the result and any errors accurately.
   ```

3. Use **ChatGPT Menu** for later cold starts. If the agent reports that the official app is still running, fully exit it from the system tray and ask the agent to continue.

The menu reads the app's existing quota response; it does not call a model. Ring percentages show remaining allowance. Countdown labels update automatically, and quota data refreshes about every two minutes.

## Uninstall

Open this repository in a local agent and send it the prompt below. The script removes this project's shortcuts and generated client/cache while preserving the source repository. It does not uninstall or modify the official ChatGPT app:

```text
Uninstall ChatGPT Quota Menu from this Windows computer. Read the README first, then run uninstall.ps1 from this repository. Remove only the ChatGPT Menu shortcuts and this project's generated client copy, cache, and log; preserve the repository source, and do not touch the official ChatGPT installation, its shortcut, or the registry. If this project's client cannot close normally, stop and tell me; do not force-terminate it. Verify and report what was actually removed.
```

To return to the official app, keep the source repository if you want and launch ChatGPT from its original shortcut. Delete the repository folder separately only if you also want to remove the source.

Start the official client from its original shortcut to return to the unmodified app. This project does not replace the official shortcut.

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



