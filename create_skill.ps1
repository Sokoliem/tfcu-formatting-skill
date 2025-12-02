# Create a properly formatted .skill file with forward slashes in paths
# TFCU Procedure Formatter v4.5
# This fixes the "invalid characters" error caused by backslash path separators

param(
    [string]$SourceDir = "C:\Users\emsok\Downloads\TFCU-procedure-formatter\extracted-skill\tfcu-procedure-formatter",
    [string]$OutputPath = "C:\Users\emsok\Downloads\TFCU-procedure-formatter\tfcu-procedure-formatter-v4.5.skill"
)

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

# Remove existing output file if it exists
if (Test-Path $OutputPath) {
    Remove-Item $OutputPath -Force
    Write-Host "Removed existing file: $OutputPath" -ForegroundColor Yellow
}

# Create new ZIP archive
$zipStream = [System.IO.File]::Create($OutputPath)
$archive = New-Object System.IO.Compression.ZipArchive($zipStream, [System.IO.Compression.ZipArchiveMode]::Create)

# Define files to include with their correct ZIP paths (using forward slashes)
# Structure follows Claude skills convention:
#   SKILL.md (required entry point)
#   resources/ (reference documentation)
#   scripts/ (helper utilities)
#   templates/ (configuration templates)
#   assets/ (template files)
$fileMappings = @(
    # Core skill files
    @{ Source = "$SourceDir\SKILL.md"; ZipPath = "SKILL.md" },
    @{ Source = "$SourceDir\REFERENCE.md"; ZipPath = "REFERENCE.md" },
    @{ Source = "$SourceDir\CHANGELOG.md"; ZipPath = "CHANGELOG.md" },

    # Dependencies
    @{ Source = "$SourceDir\package.json"; ZipPath = "package.json" },
    @{ Source = "$SourceDir\requirements.txt"; ZipPath = "requirements.txt" },

    # Python processors
    @{ Source = "$SourceDir\screenshot_processor.py"; ZipPath = "screenshot_processor.py" },
    @{ Source = "$SourceDir\setup_workspace.py"; ZipPath = "setup_workspace.py" },

    # Scripts directory
    @{ Source = "$SourceDir\scripts\generate_figure_index.py"; ZipPath = "scripts/generate_figure_index.py" },
    @{ Source = "$SourceDir\scripts\validate_procedure.py"; ZipPath = "scripts/validate_procedure.py" },
    @{ Source = "$SourceDir\scripts\text_color_parser.py"; ZipPath = "scripts/text_color_parser.py" },
    @{ Source = "$SourceDir\scripts\report_generator.py"; ZipPath = "scripts/report_generator.py" },

    # Templates directory
    @{ Source = "$SourceDir\templates\annotation_template.json"; ZipPath = "templates/annotation_template.json" },

    # Resources directory (reference documentation)
    @{ Source = "$SourceDir\resources\screenshot_handling.md"; ZipPath = "resources/screenshot_handling.md" },
    @{ Source = "$SourceDir\resources\visual_elements.md"; ZipPath = "resources/visual_elements.md" },
    @{ Source = "$SourceDir\resources\writing_standards.md"; ZipPath = "resources/writing_standards.md" },
    @{ Source = "$SourceDir\resources\vision_prompts.md"; ZipPath = "resources/vision_prompts.md" },

    # Assets directory
    @{ Source = "$SourceDir\assets\Procedure_Template.docx"; ZipPath = "assets/Procedure_Template.docx" }
)

Write-Host "`n=== Creating TFCU Procedure Formatter v4.5 .skill package ===" -ForegroundColor Cyan

$addedCount = 0
$skippedCount = 0

foreach ($mapping in $fileMappings) {
    $sourcePath = $mapping.Source
    $zipPath = $mapping.ZipPath

    if (Test-Path $sourcePath) {
        # Create the entry with forward slash path
        $entry = $archive.CreateEntry($zipPath, [System.IO.Compression.CompressionLevel]::Optimal)

        # Write file contents
        $entryStream = $entry.Open()
        $fileBytes = [System.IO.File]::ReadAllBytes($sourcePath)
        $entryStream.Write($fileBytes, 0, $fileBytes.Length)
        $entryStream.Close()

        Write-Host "  Added: $zipPath ($([math]::Round($fileBytes.Length/1024, 1)) KB)" -ForegroundColor Green
        $addedCount++
    } else {
        Write-Host "  SKIP: $zipPath (not found)" -ForegroundColor Yellow
        $skippedCount++
    }
}

# Close archive
$archive.Dispose()
$zipStream.Close()

Write-Host "`n=== Verification ===" -ForegroundColor Cyan

# Verify the created archive
$verifyZip = [System.IO.Compression.ZipFile]::OpenRead($OutputPath)
Write-Host "Created: $OutputPath" -ForegroundColor Green
Write-Host "Total entries: $($verifyZip.Entries.Count)"

$hasBackslash = $false
foreach ($entry in $verifyZip.Entries) {
    $pathCheck = if ($entry.FullName -match '\\') {
        $hasBackslash = $true
        "BACKSLASH DETECTED!"
    } else {
        "OK"
    }
    Write-Host "  [$pathCheck] $($entry.FullName)" -ForegroundColor $(if ($pathCheck -eq "OK") { "Gray" } else { "Red" })
}

$verifyZip.Dispose()

# Calculate file size
$fileSize = (Get-Item $OutputPath).Length
$fileSizeKB = [math]::Round($fileSize / 1024, 1)

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "  Files added: $addedCount"
Write-Host "  Files skipped: $skippedCount"
Write-Host "  Package size: $fileSizeKB KB"

if ($hasBackslash) {
    Write-Host "`nERROR: Archive still contains backslashes!" -ForegroundColor Red
} else {
    Write-Host "`nSUCCESS: All paths use forward slashes (ZIP spec compliant)" -ForegroundColor Green
    Write-Host "`nFile ready for Claude.ai: $OutputPath" -ForegroundColor Cyan
    Write-Host "Upload via: Settings > Capabilities > Skills" -ForegroundColor Gray
}
