<#
  setup-local-db.ps1  —  Run as Administrator.

  Resets the local Postgres 18 superuser password to 'postgres', creates the
  'devdocs' database, and tries to enable the pgvector extension.

  It does this by briefly switching pg_hba.conf to 'trust' (so it can log in
  without the unknown password), restarting the service, applying the changes,
  then restoring the original pg_hba.conf and restarting again.

  Usage (in an elevated PowerShell):
    powershell -ExecutionPolicy Bypass -File scripts\setup-local-db.ps1
#>

$ErrorActionPreference = 'Stop'

$PgRoot  = 'C:\Program Files\PostgreSQL\18'
$DataDir = "$PgRoot\data"
$Service = 'postgresql-x64-18'
$Psql    = "$PgRoot\bin\psql.exe"
$Hba     = "$DataDir\pg_hba.conf"
$NewPass = 'postgres'
$DbName  = 'devdocs'

# --- must be admin ---
$id = [Security.Principal.WindowsIdentity]::GetCurrent()
$pr = New-Object Security.Principal.WindowsPrincipal($id)
if (-not $pr.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Write-Error 'This script must be run from an elevated (Administrator) PowerShell.'
  exit 1
}

Write-Host '==> Backing up pg_hba.conf'
Copy-Item $Hba "$Hba.devdocs.bak" -Force

try {
  Write-Host '==> Switching localhost auth to trust (temporary)'
  (Get-Content $Hba) -replace 'scram-sha-256', 'trust' | Set-Content $Hba -Encoding ascii

  Write-Host '==> Restarting Postgres service'
  Restart-Service $Service -Force
  Start-Sleep -Seconds 3

  Write-Host '==> Setting postgres password'
  & $Psql -U postgres -h 127.0.0.1 -d postgres -c "ALTER USER postgres PASSWORD '$NewPass';"

  Write-Host '==> Creating database (if missing)'
  $exists = (& $Psql -U postgres -h 127.0.0.1 -d postgres -tA -c "SELECT 1 FROM pg_database WHERE datname='$DbName';")
  if ($exists -ne '1') {
    & $Psql -U postgres -h 127.0.0.1 -d postgres -c "CREATE DATABASE $DbName;"
  } else {
    Write-Host "    database '$DbName' already exists"
  }

  Write-Host '==> Checking pgvector availability'
  $vec = (& $Psql -U postgres -h 127.0.0.1 -d postgres -tA -c "SELECT 1 FROM pg_available_extensions WHERE name='vector';")
  if ($vec -eq '1') {
    & $Psql -U postgres -h 127.0.0.1 -d $DbName -c "CREATE EXTENSION IF NOT EXISTS vector;"
    Write-Host '    pgvector OK (extension created in devdocs)'
  } else {
    Write-Warning 'pgvector is NOT installed on this server. The app will not work until you install it.'
    Write-Warning 'See docs/LOCAL_DB_SETUP.md for install options.'
  }
}
finally {
  Write-Host '==> Restoring original pg_hba.conf'
  Copy-Item "$Hba.devdocs.bak" $Hba -Force
  Write-Host '==> Restarting Postgres service'
  Restart-Service $Service -Force
  Start-Sleep -Seconds 3
}

Write-Host ''
Write-Host '==> Verifying login with postgres/postgres'
$env:PGPASSWORD = $NewPass
& $Psql -U postgres -h 127.0.0.1 -d $DbName -c "SELECT current_database(), current_user;"
$env:PGPASSWORD = ''
Write-Host 'Done. DATABASE_URL=postgresql://postgres:postgres@localhost:5432/devdocs'
