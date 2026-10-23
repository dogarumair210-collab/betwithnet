$sampleRate = 44100
$audioDir = "assets/games/treasure_chest/audio"
if (!(Test-Path $audioDir)) { New-Item -ItemType Directory -Path $audioDir -Force }

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

# 1. CHEST OPEN (Heavy wood friction creak + brass lock latch snap)
$dur = 0.8
$n = [int]($sampleRate * $dur)
$samples = New-Object double[] $n
for ($i = 0; $i -lt $n; $i++) {
    $t = $i / $sampleRate
    $v = 0.0
    # Initial latch snap (0 - 0.08s)
    if ($t -lt 0.08) {
        $snapEnv = [Math]::Exp(-$t * 80)
        $snapFreq = 1800.0 * [Math]::Exp(-$t * 60) + 400.0
        $v += [Math]::Sin(2 * [Math]::PI * $snapFreq * $t) * $snapEnv * 0.9
        $v += ($rand.NextDouble() * 2.0 - 1.0) * $snapEnv * 0.5
    }
    # Heavy wood hinge creak (0.05 - 0.75s)
    if ($t -gt 0.04 -and $t -lt 0.75) {
        $tc = $t - 0.04
        $creakEnv = [Math]::Sin($tc / 0.71 * [Math]::PI) * [Math]::Exp(-$tc * 2.5)
        # pitch modulation simulating wood friction
        $fmod = 120.0 + 75.0 * [Math]::Sin(2 * [Math]::PI * 18.0 * $tc) + 30.0 * [Math]::Sin(2 * [Math]::PI * 45.0 * $tc)
        $wood = [Math]::Sin(2 * [Math]::PI * $fmod * $tc)
        $woodNoise = ($rand.NextDouble() * 2.0 - 1.0) * 0.3 * [Math]::Sin(2 * [Math]::PI * 12.0 * $tc)
        $v += ($wood + $woodNoise) * $creakEnv * 0.8
    }
    $samples[$i] = $v
}
Write-WavFile "$audioDir/chest_open.wav" $samples

# 2. COINS WIN (Gold Doubloons clinking cascade)
$dur = 1.4
$n = [int]($sampleRate * $dur)
$samples = New-Object double[] $n
$coinHits = @(0.0, 0.08, 0.15, 0.23, 0.31, 0.40, 0.48, 0.57, 0.68, 0.82)
$coinFreqs = @(2400.0, 3100.0, 2800.0, 3600.0, 2600.0, 3400.0, 4200.0, 3000.0, 3900.0, 4400.0)
for ($i = 0; $i -lt $n; $i++) {
    $t = $i / $sampleRate
    $v = 0.0
    for ($k = 0; $k -lt $coinHits.Length; $k++) {
        $ht = $coinHits[$k]
        if ($t -ge $ht) {
            $dt = $t - $ht
            if ($dt -lt 0.25) {
                $freq = $coinFreqs[$k]
                $env = [Math]::Exp(-$dt * 32.0)
                $metalRing = [Math]::Sin(2 * [Math]::PI * $freq * $dt) + 0.4 * [Math]::Sin(2 * [Math]::PI * ($freq * 1.54) * $dt)
                $v += $metalRing * $env * 0.45
            }
        }
    }
    # Underlying warm chord shimmer
    if ($t -lt 1.3) {
        $shimmerEnv = [Math]::Exp(-$t * 2.2)
        $cMajor = 0.15 * [Math]::Sin(2 * [Math]::PI * 523.25 * $t) + 0.12 * [Math]::Sin(2 * [Math]::PI * 659.25 * $t) + 0.15 * [Math]::Sin(2 * [Math]::PI * 783.99 * $t)
        $v += $cMajor * $shimmerEnv
    }
    $samples[$i] = $v
}
Write-WavFile "$audioDir/coins_win.wav" $samples

# 3. KRAKEN CURSE (Deep ocean rumble, monster splash, sinister bass roar)
$dur = 1.6
$n = [int]($sampleRate * $dur)
$samples = New-Object double[] $n
for ($i = 0; $i -lt $n; $i++) {
    $t = $i / $sampleRate
    $v = 0.0
    # Monster roar & low rumble
    $subFreq = 65.0 * [Math]::Exp(-$t * 1.5) + 38.0
    $subEnv = [Math]::Exp(-$t * 1.8)
    $growl = [Math]::Sin(2 * [Math]::PI * $subFreq * $t + [Math]::Sin(2 * [Math]::PI * 25.0 * $t) * 2.0)
    $v += $growl * $subEnv * 0.95
    # Violent water splash & tentacle whip noise (0 - 0.5s)
    if ($t -lt 0.6) {
        $splashEnv = [Math]::Exp(-$t * 7.0)
        $waterNoise = ($rand.NextDouble() * 2.0 - 1.0)
        $v += $waterNoise * $splashEnv * 0.7
    }
    # Sinister dissonant tritone chime
    if ($t -lt 1.4) {
        $triEnv = [Math]::Exp(-$t * 2.5)
        $tritone = 0.25 * [Math]::Sin(2 * [Math]::PI * 233.08 * $t) + 0.25 * [Math]::Sin(2 * [Math]::PI * 330.0 * $t)
        $v += $tritone * $triEnv
    }
    $samples[$i] = $v
}
Write-WavFile "$audioDir/kraken_curse.wav" $samples

# 4. CLICK (Crisp wooden chest tap)
$dur = 0.12
$n = [int]($sampleRate * $dur)
$samples = New-Object double[] $n
for ($i = 0; $i -lt $n; $i++) {
    $t = $i / $sampleRate
    $v = 0.0
    $env = [Math]::Exp(-$t * 65.0)
    $freq = 850.0 * [Math]::Exp(-$t * 40.0) + 180.0
    $v += [Math]::Sin(2 * [Math]::PI * $freq * $t) * $env * 0.8
    $v += ($rand.NextDouble() * 2.0 - 1.0) * $env * 0.25
    $samples[$i] = $v
}
Write-WavFile "$audioDir/click.wav" $samples

# 5. JACKPOT (Grand victory fanfare)
$dur = 2.2
$n = [int]($sampleRate * $dur)
$samples = New-Object double[] $n
$notes = @(523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98) # C5, E5, G5, C6, E6, G6
for ($i = 0; $i -lt $n; $i++) {
    $t = $i / $sampleRate
    $v = 0.0
    for ($k = 0; $k -lt $notes.Length; $k++) {
        $startTime = $k * 0.12
        if ($t -ge $startTime) {
            $dt = $t - $startTime
            $f = $notes[$k]
            $env = [Math]::Exp(-$dt * 1.9)
            $sine = [Math]::Sin(2 * [Math]::PI * $f * $dt)
            $sine2 = [Math]::Sin(4 * [Math]::PI * $f * $dt) * 0.3
            $v += ($sine + $sine2) * $env * 0.28
        }
    }
    # Golden shimmer high sparkle
    if ($t -gt 0.7) {
        $st = $t - 0.7
        $sparkle = [Math]::Sin(2 * [Math]::PI * 3520.0 * $st) * [Math]::Exp(-$st * 1.5) * 0.2
        $v += $sparkle
    }
    $samples[$i] = $v
}
Write-WavFile "$audioDir/jackpot.wav" $samples

Get-ChildItem $audioDir | Select-Object Name, Length
