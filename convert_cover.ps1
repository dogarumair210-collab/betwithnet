Add-Type -AssemblyName System.Drawing
try {
    $img = [System.Drawing.Image]::FromFile("gold_rush_template/standalone_game/assets/images/cover_71040.jpeg")
    Write-Output "Image is valid: $($img.Width) x $($img.Height) format: $($img.RawFormat)"
    $img.Save("gold_rush_template/standalone_game/assets/images/cover_71040.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $img.Dispose()
    Write-Output "Saved cover_71040.png successfully!"
} catch {
    Write-Output "Invalid image: $_"
}
