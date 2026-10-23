$stream = [System.IO.File]::OpenText("C:\Users\as\.gemini\antigravity\brain\b4266380-86c0-4133-aa57-2205f4dbbe4d\.system_generated\logs\transcript.jsonl")
$list = New-Object System.Collections.Generic.List[string]
while (($line = $stream.ReadLine()) -ne $null) {
    if ($line.Contains('"USER_INPUT"')) {
        $list.Add($line)
    }
}
$stream.Close()
Write-Host "Total user inputs: $($list.Count)"
foreach ($u in $list) {
    try {
        $o = ConvertFrom-Json $u
        Write-Host "[$($o.step_index)] $($o.content)"
    } catch {}
}
