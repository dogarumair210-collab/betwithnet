$stream = [System.IO.File]::OpenText("C:\Users\as\.gemini\antigravity\brain\b4266380-86c0-4133-aa57-2205f4dbbe4d\.system_generated\logs\transcript.jsonl")
while (($line = $stream.ReadLine()) -ne $null) {
    if ($line.Contains('"step_index":2753')) {
        $o = ConvertFrom-Json $line
        $t = $o.tool_calls[0]
        $t.args.CodeContent | Out-File "scratch/fortunegems2_step2753.html" -Encoding utf8
        Write-Host "Target: $($t.args.TargetFile)"
        break
    }
}
$stream.Close()
