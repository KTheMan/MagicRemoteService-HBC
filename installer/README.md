# Building the installer

This packages the already-built PC app (`MagicRemoteService.exe` + its
dependencies) into a Windows installer that handles two things the raw
release zip doesn't:

- Kills any already-running instance (client or service) before
  installing, so a stale process/mutex can't block a fresh launch.
- Registers the Windows Service and seeds the registry `Version` value
  the app expects on first run, avoiding a crash in `VersionScript()`
  when that value doesn't exist yet.

## Build

1. Install [NSIS](https://nsis.sourceforge.io/) 3.x.
2. Copy the built app files into a `payload/` folder next to
   `MagicRemoteService.nsi`:
   - `MagicRemoteService.exe`
   - `MagicRemoteService.exe.config`
   - all `*.dll` dependencies
   - `es/` and `fr/` resource folders
3. `makensis -DVERSION=1.2.5.4 MagicRemoteService.nsi`

`payload/` is gitignored - it holds compiled binaries from a release,
not source.
