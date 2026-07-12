; MagicRemoteService installer
;
; Packages the already-built PC client/service binaries (from a tagged
; release of this fork) and handles the two things the raw zip doesn't:
;   1. Tearing down any already-running instance (client or service) so a
;      stale process/mutex can't silently block a fresh launch.
;   2. Registering + starting the Windows Service properly, and seeding
;      the registry Version value the app expects - Application.cs's
;      VersionScript() calls `new Version((string)GetValue("Version"))`
;      with no null-check, which throws immediately on a truly first run
;      (before any window or tray icon is ever created) if that value is
;      missing. Seeding it here avoids that crash entirely.
;
;      The .csproj doesn't set Prefer32Bit, and MSBuild's default for an
;      AnyCPU WinExe targeting .NET Framework 4.5+ is Prefer32Bit=true,
;      so the process actually runs 32-bit even on 64-bit Windows. That
;      means it reads HKLM\SOFTWARE\WOW6432Node\... via the WOW64
;      registry redirector, not the real 64-bit HKLM\SOFTWARE\... - a
;      64-bit install (e.g. from a 64-bit PowerShell session) writing
;      only the real view leaves the 32-bit-redirected view empty, and
;      the app still crashes despite the key visibly "being there".
;      Writing both views sidesteps needing to know the actual bitness.
;
; Build with: makensis MagicRemoteService.nsi
; Expects the built app files (MagicRemoteService.exe, its .config, DLLs,
; es/, fr/) in .\payload relative to this script.

!include "MUI2.nsh"

!ifndef VERSION
  !define VERSION "1.3.0.2"
!endif

Name "MagicRemoteService"
OutFile "MagicRemoteService-Setup-${VERSION}.exe"
InstallDir "$PROGRAMFILES64\MagicRemoteService"
InstallDirRegKey HKLM "Software\MagicRemoteService" "InstallDir"
RequestExecutionLevel admin

!define SERVICE_NAME "MagicRemoteService"
!define UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\MagicRemoteService"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

Function .onInit
  SetRegView 64
FunctionEnd

Function un.onInit
  SetRegView 64
FunctionEnd

Function TeardownExisting
  ; Stop and remove any previously registered service first (its binPath
  ; may point at an older install location we're about to replace).
  nsExec::ExecToLog 'sc.exe stop "${SERVICE_NAME}"'
  Sleep 1000
  nsExec::ExecToLog 'sc.exe delete "${SERVICE_NAME}"'

  ; Kill any running instance - service host or GUI client - so its
  ; single-instance mutexes are released before we install over it.
  nsExec::ExecToLog 'taskkill /F /IM MagicRemoteService.exe /T'
  Sleep 500
FunctionEnd

Function FindInstallUtil
  ; .NET Framework 4.x all share the v4.0.30319 runtime folder regardless
  ; of the specific 4.x sub-version installed.
  StrCpy $0 "$WINDIR\Microsoft.NET\Framework64\v4.0.30319\InstallUtil.exe"
  IfFileExists $0 done
  StrCpy $0 "$WINDIR\Microsoft.NET\Framework\v4.0.30319\InstallUtil.exe"
  IfFileExists $0 done
  StrCpy $0 ""
  done:
FunctionEnd

Section "Install"
  Call TeardownExisting

  SetOutPath "$INSTDIR"
  File "payload\MagicRemoteService.exe"
  File "payload\MagicRemoteService.exe.config"
  File "payload\*.dll"
  File /r "payload\es"
  File /r "payload\fr"

  ; Seed the Version value VersionScript() expects, for both HKLM (the
  ; service, and any elevated GUI launch) and the installing user's HKCU
  ; (a non-elevated GUI launch) - the crash happens in either hive if the
  ; value is missing there, and the check runs per-hive depending on how
  ; the app is later launched. Written to both the 64-bit and WOW6432Node
  ; (32-bit) registry views, since the process's actual bitness isn't
  ; guaranteed - see the note above.
  SetRegView 64
  WriteRegStr HKLM "Software\MagicRemoteService" "Version" "${VERSION}"
  WriteRegStr HKLM "Software\MagicRemoteService" "InstallDir" "$INSTDIR"
  SetShellVarContext current
  WriteRegStr HKCU "Software\MagicRemoteService" "Version" "${VERSION}"

  SetRegView 32
  WriteRegStr HKLM "Software\MagicRemoteService" "Version" "${VERSION}"
  WriteRegStr HKLM "Software\MagicRemoteService" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "Software\MagicRemoteService" "Version" "${VERSION}"
  SetRegView 64

  Call FindInstallUtil
  StrCmp $0 "" installUtilMissing
  nsExec::ExecToLog '"$0" /enable "$INSTDIR\MagicRemoteService.exe"'
  nsExec::ExecToLog 'sc.exe start "${SERVICE_NAME}"'
  Goto installUtilDone
  installUtilMissing:
    MessageBox MB_ICONEXCLAMATION "Could not find InstallUtil.exe (.NET Framework 4.x) - the MagicRemoteService Windows Service was not registered. Verify .NET Framework 4.7.2+ is installed, then re-run this installer."
  installUtilDone:

  CreateDirectory "$SMPROGRAMS\MagicRemoteService"
  CreateShortcut "$SMPROGRAMS\MagicRemoteService\MagicRemoteService.lnk" "$INSTDIR\MagicRemoteService.exe"
  CreateShortcut "$SMPROGRAMS\MagicRemoteService\Uninstall.lnk" "$INSTDIR\Uninstall.exe"

  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr HKLM "${UNINST_KEY}" "DisplayName" "MagicRemoteService"
  WriteRegStr HKLM "${UNINST_KEY}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKLM "${UNINST_KEY}" "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKLM "${UNINST_KEY}" "InstallLocation" "$INSTDIR"
  WriteRegDWORD HKLM "${UNINST_KEY}" "NoModify" 1
  WriteRegDWORD HKLM "${UNINST_KEY}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Call un.TeardownExisting

  Call un.FindInstallUtil
  StrCmp $0 "" un.installUtilMissing
  nsExec::ExecToLog '"$0" /u "$INSTDIR\MagicRemoteService.exe"'
  un.installUtilMissing:

  Delete "$INSTDIR\MagicRemoteService.exe"
  Delete "$INSTDIR\MagicRemoteService.exe.config"
  Delete "$INSTDIR\*.dll"
  RMDir /r "$INSTDIR\es"
  RMDir /r "$INSTDIR\fr"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"

  Delete "$SMPROGRAMS\MagicRemoteService\MagicRemoteService.lnk"
  Delete "$SMPROGRAMS\MagicRemoteService\Uninstall.lnk"
  RMDir "$SMPROGRAMS\MagicRemoteService"

  DeleteRegKey HKLM "${UNINST_KEY}"
  ; Deliberately not deleting HKLM/HKCU Software\MagicRemoteService here -
  ; that's where paired-TV/PC settings live, and a reinstall should keep
  ; them. Remove manually if a clean wipe is actually wanted.
SectionEnd

Function un.TeardownExisting
  nsExec::ExecToLog 'sc.exe stop "${SERVICE_NAME}"'
  Sleep 1000
  nsExec::ExecToLog 'taskkill /F /IM MagicRemoteService.exe /T'
  Sleep 500
FunctionEnd

Function un.FindInstallUtil
  StrCpy $0 "$WINDIR\Microsoft.NET\Framework64\v4.0.30319\InstallUtil.exe"
  IfFileExists $0 un.done
  StrCpy $0 "$WINDIR\Microsoft.NET\Framework\v4.0.30319\InstallUtil.exe"
  IfFileExists $0 un.done
  StrCpy $0 ""
  un.done:
FunctionEnd
