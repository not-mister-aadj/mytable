# Sync .env.local → Vercel (production + preview)
# Run once:  npx vercel login
# Then:      .\scripts\push-vercel-env.ps1

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

$envFile = Join-Path $root ".env.local"
if (-not (Test-Path $envFile)) {
  Write-Error ".env.local not found"
}

$overrides = @{
  "NEXT_PUBLIC_SITE_URL"       = "https://mytable.club"
  "NEXT_PUBLIC_ADMIN_URL"      = "https://dashboard.mytable.club"
  "ADMIN_HOST"                 = "dashboard.mytable.club"
  "USE_DB_EVENTS"              = "true"
  "NEXT_PUBLIC_USE_DB_EVENTS"  = "true"
}

$vars = @{}
Get-Content $envFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq "" -or $line.StartsWith("#")) { return }
  $i = $line.IndexOf("=")
  if ($i -lt 1) { return }
  $key = $line.Substring(0, $i).Trim()
  $val = $line.Substring($i + 1).Trim()
  $vars[$key] = $val
}
foreach ($k in $overrides.Keys) { $vars[$k] = $overrides[$k] }

$skipIfEmpty = @(
  "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "RESEND_API_KEY", "MAPKIT_TEAM_ID", "MAPKIT_KEY_ID", "MAPKIT_PRIVATE_KEY"
)

# Never push local/dev database or Supabase keys to Vercel from .env.local
$neverPush = @(
  "DATABASE_URL", "PROD_DATABASE_URL", "PROD_SUPABASE_PROJECT_REF",
  "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY",
  "DEV_SYNC_ON_START"
)

$environments = @("production", "preview")

if (-not (Test-Path (Join-Path $root ".vercel\project.json"))) {
  Write-Host "Linking project (if needed)..." -ForegroundColor Cyan
  cmd /c "npx vercel@latest link --yes >nul 2>nul"
}

Write-Host "Pushing environment variables..." -ForegroundColor Cyan
foreach ($key in ($vars.Keys | Sort-Object)) {
  if ($neverPush -contains $key) {
    Write-Host "  skip $key (local/dev only)" -ForegroundColor DarkGray
    continue
  }
  $value = $vars[$key]
  if ([string]::IsNullOrWhiteSpace($value)) {
    if ($skipIfEmpty -contains $key) {
      Write-Host "  skip $key (empty)" -ForegroundColor DarkGray
      continue
    }
    Write-Warning "  skip $key (empty)"
    continue
  }
  $sensitive = $key -notmatch "^NEXT_PUBLIC_"
  foreach ($env in $environments) {
    Write-Host "  $key -> $env" -ForegroundColor Gray
    $args = @(
      "vercel@latest", "env", "add", $key, $env,
      "--force", "--yes",
      "--value", $value
    )
    if ($sensitive) { $args += "--sensitive" }
    cmd /c "npx vercel@latest env add $key $env --force --yes --value `"$value`" $(if ($sensitive) { '--sensitive' } else { '' }) >nul 2>&1"
    if ($LASTEXITCODE -ne 0) {
      Write-Host "FAILED: $key ($env)" -ForegroundColor Red
      exit 1
    }
  }
}

Write-Host "Done. Redeploy production in Vercel." -ForegroundColor Green
