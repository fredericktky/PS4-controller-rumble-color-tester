@echo off
echo Starting PS4 Battery Longevity Tester...

:: Set SDL environment variables for HIDAPI support (Critical for PS4 Bluetooth Rumble)
set SDL_JOYSTICK_HIDAPI=1
set SDL_JOYSTICK_HIDAPI_PS4=1
set SDL_JOYSTICK_HIDAPI_PS4_RUMBLE=1
set SDL_JOYSTICK_RAWINPUT=0

echo Pattern: Vibrating every 10 seconds.
echo Data will be logged to battery_longevity_log.csv
node test-battery-life.js
pause
