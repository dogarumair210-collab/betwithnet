Add-Type -AssemblyName System.Speech
$audioDir = "c:\Users\as\Desktop\bet with net\assets\games\fruitslice\audio"
if (!(Test-Path $audioDir)) {
    New-Item -ItemType Directory -Path $audioDir -Force
}

# Copy the fruity BGM
Copy-Item "c:\Users\as\Desktop\bet with net\assets\games\wheel\audio\fruity_bgm.mp3" "$audioDir\fruity_bgm.mp3" -Force
Copy-Item "c:\Users\as\Desktop\bet with net\assets\games\russian_roulette\audio\bang.mp3" "$audioDir\bomb_explode.mp3" -Force
Copy-Item "c:\Users\as\Desktop\bet with net\assets\games\russian_roulette\audio\cashout.mp3" "$audioDir\cashout.mp3" -Force
Copy-Item "c:\Users\as\Desktop\bet with net\assets\games\wheel\audio\win.mp3" "$audioDir\fruit_win.mp3" -Force

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 2  # slightly faster, arcade style
$synth.Volume = 100

$voiceClips = @{
    "voice_start.wav" = "Ready! Go!"
    "voice_combo.wav" = "Combo!"
    "voice_mega_combo.wav" = "Mega Combo!"
    "voice_juicy.wav" = "Juicy!"
    "voice_perfect.wav" = "Perfect Slice!"
    "voice_bomb.wav" = "Bomb hit! Game Over!"
    "voice_cashout.wav" = "Cashout! You win!"
    "voice_game_over.wav" = "Game Over!"
    "voice_timeout.wav" = "Time's up!"
}

foreach ($item in $voiceClips.GetEnumerator()) {
    $targetPath = Join-Path $audioDir $item.Key
    $synth.SetOutputToWaveFile($targetPath)
    $synth.Speak($item.Value)
}

$synth.Dispose()
Write-Host "Generated audio files in $audioDir"
Get-ChildItem $audioDir | Select-Object Name, Length
