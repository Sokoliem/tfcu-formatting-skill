Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$srcDir = 'C:\Users\emsok\Downloads\TFCU-procedure-formatter\extracted-skill\tfcu-procedure-formatter'
$destFile = 'C:\Users\emsok\Downloads\TFCU-procedure-formatter\tfcu-procedure-formatter-v4.0.skill'

# Remove existing file if present
if (Test-Path $destFile) { Remove-Item $destFile }

# Create new ZIP with forward slashes
$zip = [System.IO.Compression.ZipFile]::Open($destFile, 'Create')

Get-ChildItem $srcDir -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Substring($srcDir.Length + 1).Replace('\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $relativePath, 'Optimal') | Out-Null
    Write-Host "Added: $relativePath"
}

$zip.Dispose()
Write-Host ''
Write-Host "Created: $destFile"
Get-Item $destFile | Select-Object Name, Length
