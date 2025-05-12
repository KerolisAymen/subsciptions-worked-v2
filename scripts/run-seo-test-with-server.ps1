# SEO Testing with Server Script
# This script starts the server, runs the SEO tests, and then stops the server

# Function to check if port 3000 is in use
function is_port_in_use() {
    $portCheck = Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet -ErrorAction SilentlyContinue -WarningAction SilentlyContinue
    return $portCheck
}

# Check if the server is already running
$serverRunning = is_port_in_use
if ($serverRunning) {
    Write-Host "A server is already running on port 3000. Using the existing server for testing." -ForegroundColor Yellow
    Write-Host "Running SEO tests..." -ForegroundColor Cyan
    npm run test-seo
    exit 0
}

# Start the server
Write-Host "Starting the server..." -ForegroundColor Green
$job = Start-Job -ScriptBlock {
    Set-Location -Path $using:PWD
    npm run start
}

# Wait for server to start (max 10 seconds)
Write-Host "Waiting for server to start..." -ForegroundColor Blue
$maxWait = 10
$waited = 0
$serverStarted = $false

while ($waited -lt $maxWait) {
    Start-Sleep -Seconds 1
    $waited++
    Write-Host "." -NoNewLine
    
    $serverRunning = is_port_in_use
    if ($serverRunning) {
        $serverStarted = $true
        break
    }
}

Write-Host ""

if (-not $serverStarted) {
    Write-Host "Server did not start within $maxWait seconds. Running test anyway..." -ForegroundColor Yellow
}

# Wait an additional second for the server to fully initialize
Start-Sleep -Seconds 2

# Run the SEO tests
Write-Host "Running SEO tests..." -ForegroundColor Cyan
npm run test-seo

# Stop the server job
Write-Host "Tests completed. Stopping server..." -ForegroundColor Green
Stop-Job -Job $job
Remove-Job -Job $job

Write-Host "Done!" -ForegroundColor Magenta
