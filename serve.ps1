# Serveur Web statique natif en PowerShell (.NET HttpListener)
# Fonctionne sur n'importe quel PC Windows sans dépendance (sans Node, sans Python)

$port = 8085
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$port/")

try {
    $listener.Start()
} catch {
    Write-Error "Impossible de démarrer le serveur sur le port $port. Il est peut-être déjà utilisé."
    Exit
}

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "🎮 Arcade local démarré avec succès !" -ForegroundColor Green
Write-Host "URL : http://127.0.0.1:$port" -ForegroundColor Cyan
Write-Host "Pour arrêter le serveur, fermez simplement cette fenêtre." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green

# Ouvrir le navigateur automatiquement
Start-Process "http://127.0.0.1:$port"

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $url = $request.Url.LocalPath
        
        # Redirection des dossiers vers index.html
        if ($url.EndsWith("/")) {
            $url = $url + "index.html"
        }
        
        # Convertir les chemins URL en chemins Windows
        $relativePath = $url.TrimStart('/').Replace('/', '\')
        $filePath = Join-Path $pwd.Path $relativePath
        
        # Si c'est un dossier, chercher index.html
        if ((Test-Path $filePath) -and (Get-Item $filePath).PSIsContainer) {
            $filePath = Join-Path $filePath "index.html"
        }
        
        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = "application/octet-stream"
            
            # Types MIME courants
            switch ($ext) {
                ".html" { $mime = "text/html; charset=utf-8" }
                ".htm"  { $mime = "text/html; charset=utf-8" }
                ".js"   { $mime = "text/javascript; charset=utf-8" }
                ".mjs"  { $mime = "text/javascript; charset=utf-8" }
                ".css"  { $mime = "text/css; charset=utf-8" }
                ".json" { $mime = "application/json; charset=utf-8" }
                ".png"  { $mime = "image/png" }
                ".jpg"  { $mime = "image/jpeg" }
                ".jpeg" { $mime = "image/jpeg" }
                ".gif"  { $mime = "image/gif" }
                ".svg"  { $mime = "image/svg+xml" }
                ".ico"  { $mime = "image/x-icon" }
            }
            
            $response.ContentType = $mime
            
            # Lecture du fichier
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $response.ContentType = "text/plain; charset=utf-8"
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("Fichier non trouvé : $url")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()
    } catch {
        # Ignorer les erreurs de déconnexion du navigateur pour continuer la boucle
    }
}
