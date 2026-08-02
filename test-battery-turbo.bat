@echo off
echo Starting PS4 Battery TURBO Stress Test...

:: Set SDL environment variables for HIDAPI support (Critical for PS4 Bluetooth Rumble)
set SDL_JOYSTICK_HIDAPI=1
set SDL_JOYSTICK_HIDAPI_PS4=1
set SDL_JOYSTICK_HIDAPI_PS4_RUMBLE=1
set SDL_JOYSTICK_RAWINPUT=0

echo Intensity: CONSTANT 50%% Rumble (Safe Mode).
echo Goal: Run for 15-30 minutes and watch for battery drop.
node test-battery-turbo.js
pause
