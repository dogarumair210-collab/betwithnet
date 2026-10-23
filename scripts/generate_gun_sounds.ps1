$sampleRate = 44100

function Write-WavFile($filePath, $samples) {
    $totalSamples = $samples.Length
    $bytes = New-Object byte[] (44 + $totalSamples * 2)
    $enc = [System.Text.Encoding]::ASCII
    
    [Array]::Copy($enc.GetBytes("RIFF"), 0, $bytes, 0, 4)
    [System.BitConverter]::GetBytes([int](36 + $totalSamples * 2)).CopyTo($bytes, 4)
    [Array]::Copy($enc.GetBytes("WAVE"), 0, $bytes, 8, 4)
    [Array]::Copy($enc.GetBytes("fmt "), 0, $bytes, 12, 4)
    [System.BitConverter]::GetBytes([int]16).CopyTo($bytes, 16)
    [System.BitConverter]::GetBytes([int16]1).CopyTo($bytes, 20)
    [System.BitConverter]::GetBytes([int16]1).CopyTo($bytes, 22)
    [System.BitConverter]::GetBytes([int]$sampleRate).CopyTo($bytes, 24)
    [System.BitConverter]::GetBytes([int]($sampleRate * 2)).CopyTo($bytes, 28)
    [System.BitConverter]::GetBytes([int16]2).CopyTo($bytes, 32)
    [System.BitConverter]::GetBytes([int16]16).CopyTo($bytes, 34)
    [Array]::Copy($enc.GetBytes("data"), 0, $bytes, 36, 4)
    [System.BitConverter]::GetBytes([int]($totalSamples * 2)).CopyTo($bytes, 40)
    
    for ($i = 0; $i -lt $totalSamples; $i++) {
        $val = [Math]::Max(-1.0, [Math]::Min(1.0, $samples[$i]))
        $s = [int16]($val * 32000)
        [System.BitConverter]::GetBytes($s).CopyTo($bytes, 44 + $i * 2)
    }
    
    [System.IO.File]::WriteAllBytes($filePath, $bytes)
    Write-Host "Created: $filePath ($($bytes.Length) bytes)"
}

$rand = New-Object System.Random

# 1. GUN SHOT (BANG)
$durBang = 1.3
$countBang = [int]($sampleRate * $durBang)
$samplesBang = New-Object double[] $countBang

for ($i = 0; $i -lt $countBang; $i++) {
    $t = $i / $sampleRate
    $v = 0.0
    
    # Supersonic crack transient (0 - 0.035s)
    if ($t -lt 0.035) {
        $crackEnv = [Math]::Exp(-$t * 120)
        $whiteNoise = ($rand.NextDouble() * 2.0 - 1.0)
        $v += $whiteNoise * $crackEnv * 1.3
    }
    
    # Sub-bass body punch (0 - 0.35s)
    if ($t -lt 0.35) {
        $punchEnv = [Math]::Exp(-$t * 18)
        $freq = 180.0 * [Math]::Exp(-$t * 28) + 42.0
        $sine = [Math]::Sin(2.0 * [Math]::PI * $freq * $t)
        $sine2 = [Math]::Sin(4.0 * [Math]::PI * $freq * $t) * 0.4
        $v += ($sine + $sine2) * $punchEnv * 1.1
    }
    
    # Cavernous room reverb & powder tail (0.01 - 1.25s)
    if ($t -gt 0.01) {
        $tailEnv = [Math]::Exp(-$t * 3.8)
        $tailNoise = ($rand.NextDouble() * 2.0 - 1.0) * 0.45
        $rumble = [Math]::Sin(2.0 * [Math]::PI * 48.0 * $t) * 0.3
        $v += ($tailNoise + $rumble) * $tailEnv
    }
    
    # Nonlinear distortion & saturation (creates authentic explosive punch)
    if ($v -gt 0.8) { $v = 0.8 + ($v - 0.8) * 0.3 }
    if ($v -lt -0.8) { $v = -0.8 + ($v + 0.8) * 0.3 }
    $samplesBang[$i] = $v * 0.95
}
Write-WavFile "assets\games\russian_roulette\audio\bang.wav" $samplesBang

# 2. DRY HAMMER CLICK (EMPTY CHAMBER)
$durClick = 0.22
$countClick = [int]($sampleRate * $durClick)
$samplesClick = New-Object double[] $countClick

for ($i = 0; $i -lt $countClick; $i++) {
    $t = $i / $sampleRate
    $v = 0.0
    
    # Sharp firing pin impact transient (0 - 0.02s)
    if ($t -lt 0.02) {
        $envImpact = [Math]::Exp(-$t * 220)
        $noise = ($rand.NextDouble() * 2.0 - 1.0)
        $ping = [Math]::Sin(2.0 * [Math]::PI * 3400.0 * $t)
        $v += ($noise * 0.7 + $ping * 0.6) * $envImpact * 1.2
    }
    
    # Metallic steel body resonance (0 - 0.18s)
    if ($t -lt 0.2) {
        $envRes = [Math]::Exp(-$t * 35)
        $tone1 = [Math]::Sin(2.0 * [Math]::PI * 1850.0 * $t) * 0.45
        $tone2 = [Math]::Sin(2.0 * [Math]::PI * 920.0 * $t) * 0.35
        $v += ($tone1 + $tone2) * $envRes
    }
    
    $samplesClick[$i] = $v * 0.95
}
Write-WavFile "assets\games\russian_roulette\audio\click.wav" $samplesClick

# 3. REVOLVER HAMMER COCK (COCKING MECHANISM)
$durCock = 0.28
$countCock = [int]($sampleRate * $durCock)
$samplesCock = New-Object double[] $countCock

for ($i = 0; $i -lt $countCock; $i++) {
    $t = $i / $sampleRate
    $v = 0.0
    
    # Part 1: Half-cock latch at t=0.03s
    if ($t -ge 0.02 -and $t -lt 0.08) {
        $tLocal = $t - 0.02
        $env1 = [Math]::Exp(-$tLocal * 120)
        $v += ([Math]::Sin(2.0 * [Math]::PI * 2400.0 * $tLocal) + ($rand.NextDouble() * 0.5)) * $env1 * 0.65
    }
    
    # Part 2: Full-cock heavy lock at t=0.12s
    if ($t -ge 0.10 -and $t -lt 0.25) {
        $tLocal = $t - 0.10
        $env2 = [Math]::Exp(-$tLocal * 65)
        $v += ([Math]::Sin(2.0 * [Math]::PI * 1200.0 * $tLocal) + [Math]::Sin(2.0 * [Math]::PI * 2800.0 * $tLocal) * 0.5 + ($rand.NextDouble() * 0.4)) * $env2 * 0.95
    }
    
    $samplesCock[$i] = $v
}
Write-WavFile "assets\games\russian_roulette\audio\cock.wav" $samplesCock

# 4. CYLINDER SPIN (RAPID RATCHET CLICKS)
$durSpin = 0.65
$countSpin = [int]($sampleRate * $durSpin)
$samplesSpin = New-Object double[] $countSpin

$clickTimes = @(0.02, 0.05, 0.09, 0.13, 0.18, 0.23, 0.29, 0.36, 0.43, 0.51, 0.58, 0.63)
foreach ($ct in $clickTimes) {
    $startIdx = [int]($ct * $sampleRate)
    $endIdx = [Math]::Min($countSpin, [int](($ct + 0.025) * $sampleRate))
    for ($i = $startIdx; $i -lt $endIdx; $i++) {
        $tLocal = ($i - $startIdx) / $sampleRate
        $env = [Math]::Exp(-$tLocal * 180)
        $samplesSpin[$i] += ([Math]::Sin(2.0 * [Math]::PI * 2100.0 * $tLocal) + ($rand.NextDouble() * 0.6)) * $env * 0.6
    }
}
Write-WavFile "assets\games\russian_roulette\audio\spin.wav" $samplesSpin

Write-Host "All realistic gun sounds generated successfully!" -ForegroundColor Green
