$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = "C:\Users\Petpooja-1406\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"

if (-not (Test-Path $python)) {
  throw "Bundled Python runtime was not found at $python"
}

Set-Location $root
Write-Host "Starting Enterprise Sales Control Tower at http://127.0.0.1:4173"
Write-Host "Keep this window open while using the CRM."
& $python -m http.server 4173 --bind 127.0.0.1
