$stream = [System.IO.File]::OpenText("C:\Users\as\.gemini\antigravity\brain\b4266380-86c0-4133-aa57-2205f4dbbe4d\.system_generated\logs\transcript.jsonl")
while (($line = $stream.ReadLine()) -ne $null) {
    if ($line.Contains('"write_to_file"') -and $line.Contains('fortunegems2')) {
        $o = ConvertFrom-Json $line
        Write-Host "write_to_file step: $($o.step_index)"
    }
}
$stream.Close()
