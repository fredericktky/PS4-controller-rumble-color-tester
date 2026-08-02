# PS4 Controller Rumble & Color Tester 🎮

A sleek Node.js utility to test and verify the **Light Bar (LED)**, **Haptic Feedback (Rumble)**, and **Battery Status** of DualShock 4 (PS4) controllers.

---

## ✨ Features

- 🌈 **LED Color Cycling**: Test the RGB light bar by cycling through Red, Green, Blue, and Magenta.
- 📳 **Haptic Feedback Test**: Independent testing of Low-Frequency (Heavy) and High-Frequency (Light) rumble motors.
- 🔋 **Battery Monitor**: Premium dashboard to monitor multiple controllers' battery levels and charging states.
- ⏳ **Longevity Stress Test**: Automatically vibrates the controller every 10 seconds and logs depletion to a CSV file.
- 🔌 **Plug & Play Support**: Detects controllers added after the script has started.
- 🪟 **Windows Batch Support**: Includes `.bat` files for easy execution.

---

## 🚀 Quick Start (Windows)

1. Connect your PS4 controller.
2. Double-click `test-battery.bat` to see **Battery Status**.
3. Double-click `test-battery-life.bat` to start a **Longevity Stress Test**.
4. Double-click `test.bat` for **LED Colors**.
5. Double-click `test-rumble.bat` for **Vibration/Rumble**.

---

## 🛠️ Main Utilities

### 1. Battery Monitor
Monitor precise 0-100% battery levels even over Bluetooth.
```bash
node test-battery.js
```

### 2. Battery Longevity Tester
Stress test the battery by vibrating every 10 seconds. Logs data to `battery_longevity_log.csv`.
```bash
node test-battery-life.js
```

### 3. LED & Rumble Tests
Verify the hardware functionality of the light bar and motors.
```bash
node test-led.js
node test-rumble.js
```

---

## 💡 Important Notes

- **Bluetooth on Windows**: For high-accuracy battery data, the script uses a "kickstart" technique to enable extended reports.
- **Data Logging**: The longevity test saves a timestamped CSV file in the project directory for later analysis.

---

## 📄 License
This project is open-source and available under the MIT License.
