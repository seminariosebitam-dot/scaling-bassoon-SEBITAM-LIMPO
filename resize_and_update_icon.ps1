Add-Type -AssemblyName System.Drawing

$sourcePath = "C:/Users/eduka/.gemini/antigravity/brain/8f51fbce-b7d6-4561-bf77-f40a5bc55a03/uploaded_media_1769795143587.jpg"
$workDir = "C:/Users/eduka/Desktop/SEBITAM LIMPO"
$destPath = Join-Path $workDir "icon_resized.png"

Write-Host "Resizing image from: $sourcePath"

try {
    $img = [System.Drawing.Image]::FromFile($sourcePath)
    $newWidth = [int]($img.Width * 0.5)
    $newHeight = [int]($img.Height * 0.5)

    Write-Host "Original Size: $($img.Width)x$($img.Height)"
    Write-Host "New Size: ${newWidth}x${newHeight}"

    $bitmap = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
    $graph = [System.Drawing.Graphics]::FromImage($bitmap)
    $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graph.DrawImage($img, 0, 0, $newWidth, $newHeight)

    $bitmap.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Resized image saved to: $destPath"

    $img.Dispose()
    $bitmap.Dispose()
    $graph.Dispose()
}
catch {
    Write-Error "Failed to resize image: $_"
    exit 1
}

# Distribute to Android folders
$baseDir = Join-Path $workDir "android/app/src/main/res"
$densities = @("mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi")

Write-Host "Updating Android resource folders..."

foreach ($density in $densities) {
    $targetDir = Join-Path $baseDir "mipmap-$density"
    if (test-path $targetDir) {
        Copy-Item -Path $destPath -Destination (Join-Path $targetDir "ic_launcher.png") -Force
        Copy-Item -Path $destPath -Destination (Join-Path $targetDir "ic_launcher_round.png") -Force
        Copy-Item -Path $destPath -Destination (Join-Path $targetDir "ic_launcher_foreground.png") -Force
        Write-Host "Updated $density"
    }
    else {
        Write-Warning "Directory not found: $targetDir"
    }
}

Write-Host "Icon update process completed successfully."
