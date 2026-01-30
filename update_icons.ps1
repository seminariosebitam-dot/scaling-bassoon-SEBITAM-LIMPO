$sourceImage = "C:/Users/eduka/.gemini/antigravity/brain/8f51fbce-b7d6-4561-bf77-f40a5bc55a03/uploaded_media_1769792672538.jpg"
$baseDir = "android/app/src/main/res"
$densities = @("mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi")

# Verify source exists
if (-not (Test-Path $sourceImage)) {
    Write-Error "Source image not found at $sourceImage"
    exit 1
}

Write-Host "Updating icons using: $sourceImage"

foreach ($density in $densities) {
    $targetDir = Join-Path $baseDir "mipmap-$density"
    
    # Create dir if not exists (though it should)
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir | Out-Null
    }

    # Define targets
    $targets = @("ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png")

    foreach ($targetFile in $targets) {
        $destPath = Join-Path $targetDir $targetFile
        Copy-Item -Path $sourceImage -Destination $destPath -Force
        Write-Host "Updated: $destPath"
    }
}

Write-Host "Icon update complete!"
