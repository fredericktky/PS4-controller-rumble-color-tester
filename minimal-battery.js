import HID from 'node-hid';

/**
 * Minimal PS4 Controller Battery Reader
 * ------------------------------------
 * Works for both USB (Report 0x01) and Bluetooth (Report 0x11).
 */

const DS4_VENDOR_ID = 0x054C;
const DS4_PRODUCT_IDS = [0x05C4, 0x09CC, 0x0BA0];

// Map raw levels (0-10) to approximate percentages
const mapBattery = (level) => {
  const map = { 10: 100, 9: 80, 8: 65, 7: 55, 6: 45, 5: 35, 4: 25, 3: 15, 2: 5, 1: 0, 0: 0 };
  return map[level] ?? 0;
};

// 1. Find the first available controller
const device = HID.devices().find(d => 
  d.vendorId === DS4_VENDOR_ID && 
  DS4_PRODUCT_IDS.includes(d.productId) && 
  (d.usagePage === 0x0001 || !d.usagePage)
);

if (!device) {
  console.error("❌ No DualShock 4 controller found.");
  process.exit(1);
}

const controller = new HID.HID(device.path);

/**
 * 2. Kickstart Extended Mode (Critical for Bluetooth)
 * This allows the controller to send Report 0x11 which contains
 * high-resolution battery and sensor data.
 */
try { controller.getFeatureReport(0x05, 41); } catch (e) {}

console.log(`✅ Connected to: ${device.product}`);
console.log("Monitoring battery... (Press Ctrl+C to exit)");

// 3. Listen for data reports
controller.on('data', (data) => {
  let rawLevel, isCharging;

  if (data[0] === 0x11) { 
    // Bluetooth Data Stream
    rawLevel = data[32] & 0x0F;
    isCharging = (data[32] & 0x10) !== 0;
  } else if (data[0] === 0x01) { 
    // USB Data Stream
    rawLevel = data[30] & 0x0F;
    isCharging = (data[30] & 0x10) !== 0;
  }

  if (rawLevel !== undefined) {
    const percent = mapBattery(rawLevel);
    
    // Clear console and print status
    process.stdout.write(`\rBattery: ${percent}% [${rawLevel}/10] ${isCharging ? '⚡ Charging' : '🔋 Discharging'}   `);
  }
});

controller.on('error', (err) => {
  console.error("\n❌ Controller error:", err.message);
  process.exit(1);
});
