Param(
    [int]$Interval = 1,
    [int]$Top = 5,
    [int]$Samples = 0
)

# Simple network bandwidth monitor for Windows (PowerShell)
# Shows Bytes/sec and Mbps per network interface, refreshed every $Interval seconds.

Clear-Host
Write-Host "Starting network monitor (interval ${Interval}s). Press Ctrl+C to stop.`n"

$count = 0
while ($Samples -eq 0 -or $count -lt $Samples) {
    $count++

    try {
        $counters = Get-Counter '\Network Interface(*)\Bytes Total/sec' -ErrorAction Stop
    } catch {
        Write-Error "Failed to read performance counters: $_"
        break
    }

    $rows = $counters.CounterSamples | ForEach-Object {
        [PSCustomObject]@{
            Interface = $_.InstanceName
            BytesPerSec = [math]::Round($_.CookedValue, 2)
            Mbps = [math]::Round(($_.CookedValue * 8) / 1MB, 3)
        }
    }

    $rows = $rows | Sort-Object -Property BytesPerSec -Descending | Select-Object -First $Top

    Clear-Host
    Write-Host "Network Monitor — Sample $count — $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    $rows | Format-Table @{Label='Interface';Expression={$_.Interface};Width=40}, @{Label='Bytes/s';Expression={$_.BytesPerSec};Width=12}, @{Label='Mbps';Expression={$_.Mbps};Width=8} -AutoSize

    Start-Sleep -Seconds $Interval
}

Write-Host "Network monitor stopped."