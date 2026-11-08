# Apply CREATE + INSERT to the Compose Postgres service (empty DB only).
# Usage (from repo root):  powershell -File database/apply-manual.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "Ensuring postgres is up..."
docker compose up -d postgres

$ready = $false
for ($i = 0; $i -lt 30; $i++) {
  docker compose exec -T postgres pg_isready -U ams_user -d ams_db 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { $ready = $true; break }
  Start-Sleep -Seconds 2
}
if (-not $ready) { throw "Postgres did not become ready in time." }

Write-Host "Applying 01_create_schema.sql ..."
Get-Content "$PSScriptRoot\01_create_schema.sql" -Raw |
  docker compose exec -T postgres psql -U ams_user -d ams_db -v ON_ERROR_STOP=1
if ($LASTEXITCODE -ne 0) { throw "Schema script failed." }

Write-Host "Applying 02_insert_data.sql ..."
Get-Content "$PSScriptRoot\02_insert_data.sql" -Raw |
  docker compose exec -T postgres psql -U ams_user -d ams_db -v ON_ERROR_STOP=1
if ($LASTEXITCODE -ne 0) { throw "Insert script failed." }

Write-Host "Applying 03_exclusive_roles_cleanup.sql ..."
Get-Content "$PSScriptRoot\03_exclusive_roles_cleanup.sql" -Raw |
  docker compose exec -T postgres psql -U ams_user -d ams_db -v ON_ERROR_STOP=1
if ($LASTEXITCODE -ne 0) { throw "Exclusive-role cleanup failed." }

Write-Host "Done. Demo login: admin / Password@123 (Student cannot Manage Courses)."
