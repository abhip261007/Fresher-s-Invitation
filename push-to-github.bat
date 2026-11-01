@echo off
title Push to GitHub - Fresher's Invitation
echo ========================================================
echo   Pushing code to https://github.com/abhip261007/Fresher-s-Invitation
echo ========================================================
echo.
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Code successfully pushed to GitHub!
) else (
    echo [NOTE] If you were prompted to sign in, complete the login in your browser and try again.
)
echo.
pause
