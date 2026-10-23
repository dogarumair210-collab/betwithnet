$t = [System.IO.File]::ReadAllText('scratch/main_index.js')
$m = [regex]::Matches($t, 'cc\._RF\.push\(t,"[^"]+","([^"]+)"\)')
foreach ($x in $m) {
    $name = $x.Groups[1].Value
    if ($name -match 'scene|round|game|versus|teen|patti|win|bet|result|payout') {
        Write-Host "$($x.Index) $name"
    }
}
