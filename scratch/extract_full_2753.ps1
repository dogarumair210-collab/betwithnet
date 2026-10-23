$stream = [System.IO.File]::OpenText("C:\Users\as\.gemini\antigravity\brain\b4266380-86c0-4133-aa57-2205f4dbbe4d\.system_generated\logs\transcript_full.jsonl")
while (($line = $stream.ReadLine()) -ne $null) {
    if ($line.Contains('"step_index":2753')) {
        $o = ConvertFrom-Json $line
        $code = $o.tool_calls[0].args.CodeContent
        [System.IO.File]::WriteAllText("c:\Users\as\Desktop\bet with net\scratch\step2753_untruncated.html", $code)
        Write-Host "Length: $($code.Length)"
        break
    }
}
$stream.Close()
