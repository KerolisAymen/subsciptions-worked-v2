@echo off
echo ===== Frontend Troubleshooting Script =====
echo.

echo Checking Node.js installation...
node --version
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    exit /b 1
)

echo Checking for package.json...
if not exist package.json (
    echo WARNING: No package.json found in current directory
    echo Please navigate to your frontend project root
) else (
    echo Installing dependencies...
    call npm install
    
    echo Checking for common frontend frameworks...
    findstr /C:"react" /C:"vue" /C:"angular" package.json > nul
    if %ERRORLEVEL% EQU 0 (
        echo Frontend framework detected, running additional checks...
        call npm audit fix
    )
)

echo Checking for Azure configuration files...
if exist .env (
    echo Found .env file, checking for Azure configurations...
    findstr /C:"AZURE_" /C:"REACT_APP_AZURE_" /C:"VUE_APP_AZURE_" .env > nul
    if %ERRORLEVEL% EQU 0 (
        echo Azure configuration found in .env file
    )
)

echo.
echo ===== Frontend Check Complete =====
echo.
echo Next steps:
echo 1. Run 'npm start' or your specific start command
echo 2. Check browser console for JavaScript errors
echo 3. Verify network requests in browser developer tools
echo.
echo If using Azure services, verify your connection strings and credentials are correct.
