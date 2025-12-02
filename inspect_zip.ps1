Add-Type -AssemblyName System.IO.Compression.FileSystem
$zipPath = "C:\Users\emsok\Downloads\TFCU-procedure-formatter\tfcu-procedure-formatter.skill"

Write-Host "=== ZIP ENTRIES ===" -ForegroundColor Cyan
$zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)

foreach ($entry in $zip.Entries) {
    Write-Host ""
    Write-Host "Entry Name: [$($entry.FullName)]" -ForegroundColor Yellow

    # Get bytes for path analysis
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($entry.FullName)
    $hexString = [BitConverter]::ToString($bytes)
    Write-Host "  Hex: $hexString"
    Write-Host "  Size: $($entry.Length) bytes"

    # Check for problematic characters
    $hasBackslash = $entry.FullName -match '\\'
    $hasColon = $entry.FullName -match ':'
    $hasAbsolutePath = $entry.FullName -match '^[A-Za-z]:'
    $startsWithSlash = $entry.FullName.StartsWith('/')

    if ($hasBackslash) { Write-Host "  WARNING: Contains backslash" -ForegroundColor Red }
    if ($hasColon) { Write-Host "  WARNING: Contains colon" -ForegroundColor Red }
    if ($hasAbsolutePath) { Write-Host "  WARNING: Absolute path detected" -ForegroundColor Red }
    if ($startsWithSlash) { Write-Host "  WARNING: Starts with slash" -ForegroundColor Red }
}

$zip.Dispose()
Write-Host ""
Write-Host "=== ANALYSIS COMPLETE ===" -ForegroundColor Cyan
