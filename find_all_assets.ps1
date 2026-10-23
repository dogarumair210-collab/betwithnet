Get-ChildItem -Path "gold_rush_template" -Recurse | Where-Object {
    $_.Extension -match '\.(png|jpg|mp4|webm|json|mp3)$'
} | Select-Object Name, Length, FullName | Format-Table -AutoSize
