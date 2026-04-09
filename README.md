# PS4 Controller Rumble & Color Tester 🎮

A sleek Node.js utility to test and verify the **Light Bar (LED)** and **Haptic Feedback (Rumble)** functionality of DualShock 4 (PS4) controllers. This tool uses the robust `SDL2` library via `@kmamal/sdl` to ensure high-performance controller interaction.

---

## ✨ Features

- 🌈 **LED Color Cycling**: Test the RGB light bar by cycling through Red, Green, Blue, and Magenta.
- 📳 **Haptic Feedback Test**: Independent testing of Low-Frequency (Heavy) and High-Frequency (Light) rumble motors.
- 🛠️ **Dual-Engine Support**: Automatically attempts to use the specialized Controller API, with a fallback to the Joystick API for maximum compatibility.
- 🔌 **Plug & Play Support**: Detects controllers added after the script has started.
- 🪟 **Windows Batch Support**: Includes `.bat` files for easy execution without manually typing commands.

---

## 🚀 Quick Start (Windows)

The simplest way to run the tests on Windows:

1. Connect your PS4 controller (USB recommended for first run).
2. Double-click `test.bat` to test **LED Colors**.
3. Double-click `test-rumble.bat` to test **Vibration/Rumble**.

---

## 🛠️ Manual Setup

If you prefer to use the terminal:

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (Version 16 or higher recommended)
- A DualShock 4 (PS4) Controller

### 2. Installation
Clone this repository and install dependencies:
```bash
npm install
```

### 3. Running Tests

**Test LED Colors:**
```bash
# This script sets necessary SDL environment variables for HIDAPI support
test.bat
# OR manually
node test-led.js
```

**Test Rumble/Vibration:**
```bash
test-rumble.bat
# OR manually
node test-rumble.js
```

---

## 💡 Important Configuration (Windows & Bluetooth)

For PS4 controllers, especially over Bluetooth, SDL requires specific environment variables to enable advanced features like LED and Rumble. The included `.bat` files handle this automatically, but if you run the scripts manually, ensure these are set:

```powershell
$env:SDL_JOYSTICK_HIDAPI="1"
$env:SDL_JOYSTICK_HIDAPI_PS4="1"
$env:SDL_JOYSTICK_HIDAPI_PS4_RUMBLE="1"
$env:SDL_JOYSTICK_RAWINPUT="0"
```

## 📂 Project Structure

- `test-led.js`: Main logic for cycling LED colors.
- `test-rumble.js`: Main logic for motor pulses.
- `test.bat` / `test-rumble.bat`: Quick-launch scripts with pre-configured environment variables.
- `package.json`: Project dependencies and metadata.

---

## 📄 License
This project is open-source and available under the MIT License.
