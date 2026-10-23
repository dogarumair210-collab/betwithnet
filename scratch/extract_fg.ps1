$stream = [System.IO.File]::OpenText("C:\Users\as\.gemini\antigravity\brain\b4266380-86c0-4133-aa57-2205f4dbbe4d\.system_generated\logs\transcript.jsonl")
while (($line = $stream.ReadLine()) -ne $null) {
    if ($line.Contains('"step_index":277') -or $line.Contains('"step_index":278') -or $line.Contains('"step_index":279')) {
        $o = ConvertFrom-Json $line
        if ($o.tool_calls) {
            foreach ($t in $o.tool_calls) {
                if ($t.name -eq "write_to_file" -and $t.args.TargetFile -like "*fortunegems2.html*") {
                    Write-Host "FOUND write_to_file fortunegems2.html at step $($o.step_index)"
                    $t.args.CodeContent | Out-File "scratch/fortunegems2_step2800.html" -Encoding utf8
                }
            }
        }
    }
}
$stream.Close()
