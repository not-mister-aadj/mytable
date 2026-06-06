# Reads Google Ads vars from .env.local and pushes them to Vercel Production.
# Usage: fill NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID and NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL in .env.local, then:
#   powershell -ExecutionPolicy Bypass -File scripts/set-google-vercel-env.ps1

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$envFile = Join-Path $root ".env.local"
if (-not (Test-Path $envFile)) {
  Write-Error ".env.local not found. Add Google Ads conversion vars first."
  exit 1
}

$vars = @{}
Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') {
    $vars[$matches[1].Trim()] = $matches[2].Trim()
  }
}

$conversionId = $vars["NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID"]
$conversionLabel = $vars["NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL"]

if (-not $conversionId -or -not $conversionLabel) {
  Write-Error "Missing NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID or NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL in .env.local"
  exit 1
}

Push-Location (Join-Path $PSScriptRoot "..")
try {
  Write-Host "Setting NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID on Vercel Production..."
  $conversionId | npx vercel env add NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID production --force
  Write-Host "Setting NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL on Vercel Production..."
  $conversionLabel | npx vercel env add NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL production --force
  Write-Host "Done. Redeploy with: npx vercel --prod"
} finally {
  Pop-Location
}
