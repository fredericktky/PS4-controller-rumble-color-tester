@echo off
echo Starting PS4 Controller Rumble Test...

:: Check if node_modules exists
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

:: Enable HIDAPI for PS4 controllers (important for Rumble/LED support)
set SDL_JOYSTICK_HIDAPI=1
set SDL_JOYSTICK_HIDAPI_PS4=1
set SDL_JOYSTICK_HIDAPI_PS4_RUMBLE=1
set SDL_JOYSTICK_RAWINPUT=0

:: Run the script
node test-rumble.js

:: Keep window open if it crashes or finishes
echo.
echo Test complete or crashed.
pause
