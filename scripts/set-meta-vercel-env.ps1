# Reads Meta vars from .env.local and pushes them to Vercel Production.
# Usage: fill NEXT_PUBLIC_META_PIXEL_ID and META_CAPI_ACCESS_TOKEN in .env.local, then:
#   powershell -ExecutionPolicy Bypass -File scripts/set-meta-vercel-env.ps1

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$envFile = Join-Path $root ".env.local"
if (-not (Test-Path $envFile)) {
  Write-Error ".env.local not found. Add NEXT_PUBLIC_META_PIXEL_ID and META_CAPI_ACCESS_TOKEN first."
  exit 1
}

$vars = @{}
Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') {
    $vars[$matches[1].Trim()] = $matches[2].Trim()
  }
}

$pixelId = $vars["NEXT_PUBLIC_META_PIXEL_ID"]
$capiToken = $vars["META_CAPI_ACCESS_TOKEN"]
$testCode = $vars["META_CAPI_TEST_EVENT_CODE"]

if (-not $pixelId -or -not $capiToken) {
  Write-Error "Missing NEXT_PUBLIC_META_PIXEL_ID or META_CAPI_ACCESS_TOKEN in .env.local"
  exit 1
}

Push-Location (Join-Path $PSScriptRoot "..")
try {
  Write-Host "Setting NEXT_PUBLIC_META_PIXEL_ID on Vercel Production..."
  $pixelId | npx vercel env add NEXT_PUBLIC_META_PIXEL_ID production --force
  Write-Host "Setting META_CAPI_ACCESS_TOKEN on Vercel Production..."
  $capiToken | npx vercel env add META_CAPI_ACCESS_TOKEN production --force
  if ($testCode) {
    Write-Host "Setting META_CAPI_TEST_EVENT_CODE on Vercel Production..."
    $testCode | npx vercel env add META_CAPI_TEST_EVENT_CODE production --force
  }
  Write-Host "Done. Redeploy with: npx vercel --prod"
} finally {
  Pop-Location
}
