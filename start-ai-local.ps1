# start-ai-local.ps1
# Launches the SAM backend + Vite frontend together for local AI-enabled dev.
#
# Prerequisites:
#   - AWS SAM CLI installed (sam --version)
#   - Node.js 22+
#   - backend/env.local.json exists (copy from backend/env.local.example.json and fill in your key)
#   - npm install run from repo root
#   - cd backend && npm install (first time only)
#
# Usage:  .\start-ai-local.ps1

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

# ── Checks ──────────────────────────────────────────────────────────────────

if (-not (Get-Command sam -ErrorAction SilentlyContinue)) {
  Write-Error "SAM CLI not found. Install from https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html"
  exit 1
}

$envLocal = Join-Path $root "backend\env.local.json"
if (-not (Test-Path $envLocal)) {
  Write-Error "backend\env.local.json not found.`nCopy backend\env.local.example.json, rename it, and fill in your OpenAI key."
  exit 1
}

# ── Build SAM ────────────────────────────────────────────────────────────────

Write-Host "`n[1/3] Building SAM backend..." -ForegroundColor Cyan
Push-Location (Join-Path $root "backend")
  npm install --silent
  sam build --quiet
Pop-Location

# ── Start SAM local API (background) ────────────────────────────────────────

Write-Host "[2/3] Starting SAM local API on http://localhost:3001 ..." -ForegroundColor Cyan
$samJob = Start-Job -ScriptBlock {
  param($backendDir, $envFile)
  Set-Location $backendDir
  sam local start-api --port 3001 --env-vars $envFile --warm-containers EAGER 2>&1
} -ArgumentList (Join-Path $root "backend"), $envLocal

# Give SAM a moment to initialise
Start-Sleep -Seconds 3
Write-Host "  SAM running (job id: $($samJob.Id))" -ForegroundColor DarkGray

# ── Start Vite dev server (foreground) ──────────────────────────────────────

Write-Host "[3/3] Starting Vite dev server (AI + analytics enabled)..." -ForegroundColor Cyan
Write-Host "  Press Ctrl+C to stop both servers.`n" -ForegroundColor DarkGray

$env:VITE_API_BASE_URL   = "http://localhost:3001"
$env:VITE_ENABLE_AI      = "true"
$env:VITE_ENABLE_ANALYTICS = "true"

try {
  npm run dev
} finally {
  Write-Host "`nStopping SAM local API..." -ForegroundColor Yellow
  Stop-Job $samJob -ErrorAction SilentlyContinue
  Remove-Job $samJob -ErrorAction SilentlyContinue
  # Clean up env vars
  Remove-Item Env:\VITE_API_BASE_URL      -ErrorAction SilentlyContinue
  Remove-Item Env:\VITE_ENABLE_AI         -ErrorAction SilentlyContinue
  Remove-Item Env:\VITE_ENABLE_ANALYTICS  -ErrorAction SilentlyContinue
  Write-Host "Done." -ForegroundColor Green
}
