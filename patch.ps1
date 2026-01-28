$content = Get-Content 'c:\Users\eduka\Desktop\SEBITAM LIMPO\main.js' -Raw
$newContent = $content -replace 'image: fd.get\(''image''\) \|\| `https://api.dicebear.com/7.x/avataaars/svg\?seed=\$\{fd.get\(''name''\)\}`', 'email: fd.get(''email''),`n                            image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fd.get(''name'')}`'
$newContent | Set-Content 'c:\Users\eduka\Desktop\SEBITAM LIMPO\main.js'
