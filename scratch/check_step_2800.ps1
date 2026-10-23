$stream = [System.IO.File]::OpenText("C:\Users\as\.gemini\antigravity\brain\b4266380-86c0-4133-aa57-2205f4dbbe4d\.system_generated\logs\transcript.jsonl")
while (($line = $stream.ReadLine()) -ne $null) {
    if ($line.Contains('"step_index":279') -or $line.Contains('"step_index":2800') -or $line.Contains('"step_index":2801')) {
        $o = ConvertFrom-Json $line
        if ($o.type -eq "PLANNER_RESPONSE" -and $o.content) {
            Write-Host "RESPONSE: $($o.content)"
        }
    }
}
$stream.Close()
