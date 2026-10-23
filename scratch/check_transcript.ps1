$path = "C:\Users\as\.gemini\antigravity\brain\b4266380-86c0-4133-aa57-2205f4dbbe4d\.system_generated\logs\transcript.jsonl"
$lines = Get-Content -Path $path -Tail 50
foreach ($line in $lines) {
    if ($line.Trim().Length -eq 0) { continue }
    try {
        $obj = ConvertFrom-Json $line
        if ($obj.type -eq "USER_INPUT") {
            Write-Host "USER STEP $($obj.step_index): $($obj.content)"
        } elseif ($obj.type -eq "PLANNER_RESPONSE") {
            if ($obj.content) {
                Write-Host "MODEL STEP $($obj.step_index): $($obj.content.Substring(0, [Math]::Min(100, $obj.content.Length)))"
            }
        }
    } catch {}
}
