$stream = [System.IO.File]::OpenText("C:\Users\as\.gemini\antigravity\brain\b4266380-86c0-4133-aa57-2205f4dbbe4d\.system_generated\logs\transcript.jsonl")
while (($line = $stream.ReadLine()) -ne $null) {
    if ($line.Contains('ab_engine')) {
        $o = ConvertFrom-Json $line
        Write-Host "Step $($o.step_index) ($($o.source)): $($o.type)"
        if ($o.type -eq "USER_INPUT") {
            Write-Host "USER: $($o.content)"
        }
    }
}
$stream.Close()
