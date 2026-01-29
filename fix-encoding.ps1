$content = Get-Content -Path "main.js" -Raw -Encoding UTF8
$Utf8NoBomEncoding = New-Object System.Text.UTF8Encoding $False
[System.IO.File]::WriteAllLines("main.js", $content, $Utf8NoBomEncoding)
Write-Host "Arquivo main.js convertido para UTF-8 sem BOM com sucesso!"
