Add-Type -AssemblyName System.IO.Compression.FileSystem
$zipPath = 'C:\Users\emsok\Downloads\TFCU-procedure-formatter\tfcu-procedure-formatter-v2.3.skill'
$zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
Write-Host "Archive entries:"
foreach ($entry in $zip.Entries) {
    Write-Host "  $($entry.FullName)"
}
$zip.Dispose()
