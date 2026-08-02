import HID from 'node-hid';

/**
 * PS4 Multi-Controller Battery Dashboard (Premium Edition)
 * - Accurate high-res battery monitoring
 * - Professional ANSI-colored UI
 */

const VENDOR_ID = 0x054C;
const PRODUCT_IDS = [0x05C4, 0x09CC, 0x0BA0];

const COLORS = {
  RESET: "\x1b[0m",
  GREEN: "\x1b[32m",
  YELLOW: "\x1b[33m",
  RED: "\x1b[31m",
  CYAN: "\x1b[36m",
  WHITE_BG: "\x1b[47m\x1b[30m",
  BOLD: "\x1b[1m"
};

const controllers = new Map();

const getBatteryColor = (percent) => {
  if (percent > 60) return COLORS.GREEN;
  if (percent > 25) return COLORS.YELLOW;
  return COLORS.RED;
};

const mapBatteryLevel = (level) => {
  const map = {
    10: 100, 9: 80, 8: 65, 7: 55, 6: 45, 5: 35, 4: 25, 3: 15, 2: 5, 1: 0, 0: 0
  };
  return map[level] !== undefined ? map[level] : 0;
};

const findDS4Devices = () => {
  const allDevices = HID.devices();
  return allDevices.filter(d =>
    d.vendorId === VENDOR_ID &&
    PRODUCT_IDS.includes(d.productId) &&
    (d.usagePage === 0x0001 && d.usage === 0x0005 || !d.usagePage)
  );
};

const kickstartExtendedMode = (ctrl) => {
  try {
    ctrl.hid.getFeatureReport(0x05, 41);
  } catch (err) { }
};

const renderDisplay = () => {
  process.stdout.write('\x1Bc');

  console.log(`${COLORS.BOLD}${COLORS.CYAN}╔══════════════════════════════════════════════════════════════════════════════╗`);
  console.log(`║ ${COLORS.RESET}${COLORS.BOLD}                DUALSHOCK 4 BATTERY DASHBOARD (PRO)                      ${COLORS.CYAN}║`);
  console.log(`╚══════════════════════════════════════════════════════════════════════════════╝${COLORS.RESET}`);
  console.log(` Active Controllers: ${COLORS.BOLD}${controllers.size.toString().padEnd(2)}${COLORS.RESET}                                     ${new Date().toLocaleTimeString()} `);
  console.log(`${COLORS.CYAN}╟──────────────────────────────────────────────────────────────────────────────╢${COLORS.RESET}`);

  if (controllers.size === 0) {
    console.log("║                                                                              ║");
    console.log(`║    ${COLORS.YELLOW}Searching for controllers... Please connect via Bluetooth or USB.         ${COLORS.RESET}║`);
    console.log("║                                                                              ║");
  } else {
    controllers.forEach((ctrl) => {
      const percentage = Math.round(ctrl.percentage);
      const color = getBatteryColor(percentage);
      const barCount = Math.round(percentage / 4);
      const bar = `${color}${'█'.repeat(barCount)}${COLORS.RESET}${'░'.repeat(25 - barCount)}`;

      const chargingSymbol = ctrl.isCharging ? `${COLORS.YELLOW}⚡ CHARGING${COLORS.RESET}` : `${color}🔋 BATTERY ${COLORS.RESET}`;
      const statusText = ctrl.updateMethod === "Extended 0x11" ? `${COLORS.GREEN}✅ LIVE HIGH-RES${COLORS.RESET}` : `${COLORS.YELLOW}🕒 CONNECTING...${COLORS.RESET}`;
      const rawText = `${ctrl.rawLevel}/10`;

      console.log(`║  ${COLORS.BOLD}[${ctrl.name.padEnd(25).substring(0, 25)}]${COLORS.RESET}                                     ║`);
      console.log(`║  Level:    [${bar}] ${color}${percentage.toString().padStart(3)}%${COLORS.RESET} (Raw: ${rawText.padStart(4)})           ║`);
      console.log(`║  Status:   ${chargingSymbol.padEnd(21)}  (${statusText.padEnd(25)})        ║`);
      console.log(`${COLORS.CYAN}╟──────────────────────────────────────────────────────────────────────────────╢${COLORS.RESET}`);
    });
  }

  console.log(`║  ${COLORS.BOLD}Scale:${COLORS.RESET} 10 = 100%, 9 = 80%, 8 = 65%, 5 = 35%, 1 = 0%.                    ║`);
  console.log("║  Press Ctrl+C to disconnect and exit.                                        ║");
  console.log(`${COLORS.CYAN}╚══════════════════════════════════════════════════════════════════════════════╝${COLORS.RESET}`);
};

const main = () => {
  setInterval(() => {
    const found = findDS4Devices();

    found.forEach(device => {
      if (!controllers.has(device.path)) {
        try {
          const hid = new HID.HID(device.path);
          const ctrl = {
            hid: hid,
            name: device.product || "DualShock 4",
            path: device.path,
            percentage: 0,
            isCharging: false,
            updateMethod: "Static",
            rawLevel: 0,
            initTime: Date.now()
          };

          hid.on('data', (data) => {
            if (data[0] === 0x11) {
              ctrl.updateMethod = "Extended 0x11";
              const batteryByte = data[32]; // Confirmed index 32
              const level = batteryByte & 0x0F;
              ctrl.isCharging = (batteryByte & 0x10) !== 0;
              ctrl.percentage = mapBatteryLevel(level);
              ctrl.rawLevel = level;
            }
            else if (data[0] === 0x01) {
              const batteryByte = data[30];
              const level = batteryByte & 0x0F;
              ctrl.isCharging = (batteryByte & 0x10) !== 0;
              ctrl.percentage = mapBatteryLevel(level);
              ctrl.rawLevel = level;
            }
          });

          hid.on('error', () => { });
          kickstartExtendedMode(ctrl);
          controllers.set(device.path, ctrl);
        } catch (e) { }
      }
    });

    for (const [path, ctrl] of controllers) {
      if (!found.find(d => d.path === path)) {
        try { ctrl.hid.close(); } catch (e) { }
        controllers.delete(path);
      }
    }
  }, 2000);

  setInterval(renderDisplay, 1000);

  setInterval(() => {
    controllers.forEach(ctrl => {
      if (ctrl.updateMethod !== "Extended 0x11") kickstartExtendedMode(ctrl);
    });
  }, 5000);

  renderDisplay();
};

process.on('SIGINT', () => {
  controllers.forEach(ctrl => ctrl.hid.close());
  process.exit(0);
});

main();
