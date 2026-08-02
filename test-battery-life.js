// Set critical SDL environment variables before any library initialization
process.env.SDL_JOYSTICK_HIDAPI = "1";
process.env.SDL_JOYSTICK_HIDAPI_PS4 = "1";
process.env.SDL_JOYSTICK_HIDAPI_PS4_RUMBLE = "1";
process.env.SDL_JOYSTICK_RAWINPUT = "0";

import HID from 'node-hid';
import sdl from '@kmamal/sdl';
import fs from 'fs';

/**
 * PS4 Battery Longevity Stress Tester (Premium Edition)
 * - Pulse rumble every 10s
 * - Accurate high-res battery logging
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
  BOLD: "\x1b[1m",
  MAGENTA: "\x1b[35m"
};

const LOG_FILE = 'battery_longevity_log.csv';
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, 'Timestamp,Controller,Battery_Percentage,Status,Raw_Value\n');
}

const session = {
  controllers: new Map(),
  startTime: Date.now(),
  isPulsing: false
};

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

const logData = (ctrl) => {
  const { name, percentage, isCharging, rawLevel: raw } = ctrl;

  // Only log if battery changed OR 5 minutes have passed
  const shouldLog = !ctrl.lastLogTime ||
    ctrl.rawLevel !== ctrl.lastLoggedLevel ||
    (Date.now() - ctrl.lastLogTime > 300000);

  if (shouldLog) {
    const timestamp = new Date().toISOString();
    const status = isCharging ? 'Charging' : 'Discharging';
    fs.appendFileSync(LOG_FILE, `${timestamp},"${name}",${percentage},${status},${raw}\n`);
    ctrl.lastLogTime = Date.now();
    ctrl.lastLoggedLevel = raw;
  }
};

const pairWithSDL = (ctrl) => {
  if (ctrl.sdl) return;

  const tryMatch = (devices, opener, type) => {
    for (const device of devices) {
      const stableId = (device.id !== undefined) ? device.id : device.guid;
      const isTaken = Array.from(session.controllers.values()).some(c => c.sdlId === stableId);

      if (!isTaken) {
        try {
          const handle = opener(device);
          ctrl.sdl = handle;
          ctrl.sdlId = stableId;
          ctrl.sdlType = type;
          return true;
        } catch (e) { }
      }
    }
    return false;
  };

  if (tryMatch(sdl.controller.devices, (d) => sdl.controller.openDevice(d), "Controller")) return;
  if (tryMatch(sdl.joystick.devices, (d) => sdl.joystick.openDevice(d), "Joystick")) return;
};

const renderDisplay = () => {
  process.stdout.write('\x1Bc');
  const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);

  console.log(`${COLORS.BOLD}${COLORS.MAGENTA}╔══════════════════════════════════════════════════════════════════════════════╗`);
  console.log(`║ ${COLORS.RESET}${COLORS.BOLD}                PS4 BATTERY LONGEVITY STRESS TESTER (PRO)                ${COLORS.MAGENTA}║`);
  console.log(`╚══════════════════════════════════════════════════════════════════════════════╝${COLORS.RESET}`);
  console.log(` Test Duration: ${COLORS.BOLD}${minutes}m${COLORS.RESET}                                            ${new Date().toLocaleTimeString()} `);
  console.log(`${COLORS.MAGENTA}╟──────────────────────────────────────────────────────────────────────────────╢${COLORS.RESET}`);

  if (session.controllers.size === 0) {
    console.log(`║  Searching for controllers...                                                ║`);
  } else {
    session.controllers.forEach((ctrl) => {
      const percentage = Math.round(ctrl.percentage);
      const color = getBatteryColor(percentage);
      const barCount = Math.round(percentage / 4);
      const bar = `${color}${'█'.repeat(barCount)}${COLORS.RESET}${'░'.repeat(25 - barCount)}`;
      const rawText = `${ctrl.rawLevel}/10`;
      const accuracyText = ctrl.updateMethod === "Extended 0x11" ? `${COLORS.GREEN}✅ LIVE HIGH-RES${COLORS.RESET}` : `${COLORS.YELLOW}⚠️ CONNECTING...${COLORS.RESET}`;

      console.log(`║  ${COLORS.BOLD}[${ctrl.name.padEnd(25).substring(0, 25)}]${COLORS.RESET}                                     ║`);
      console.log(`║  Battery:   [${bar}] ${color}${percentage.toString().padStart(3)}%${COLORS.RESET} (Raw: ${rawText.padStart(4)})           ║`);
      console.log(`║  Accuracy:  ${accuracyText.padEnd(30)}             Status: ${session.isPulsing ? COLORS.RED + 'VIBRATING' : COLORS.GREEN + 'IDLE     '}${COLORS.RESET} ║`);
      console.log(`${COLORS.MAGENTA}╟──────────────────────────────────────────────────────────────────────────────╢${COLORS.RESET}`);
    });
  }

  console.log(`║  ${COLORS.BOLD}Logging to:${COLORS.RESET} ${LOG_FILE.padEnd(63)} ║`);
  console.log("║  Pattern: 1s Rumble every 10s. Press Ctrl+C to stop.                         ║");
  console.log(`${COLORS.MAGENTA}╚══════════════════════════════════════════════════════════════════════════════╝${COLORS.RESET}`);
};

const main = () => {
  setInterval(() => {
    const hidDevices = HID.devices().filter(d =>
      d.vendorId === VENDOR_ID && PRODUCT_IDS.includes(d.productId) &&
      (d.usagePage === 0x0001 && d.usage === 0x0005 || !d.usagePage)
    );

    hidDevices.forEach((device) => {
      if (!session.controllers.has(device.path)) {
        try {
          const hid = new HID.HID(device.path);
          const ctrl = {
            hid: hid,
            sdl: null,
            sdlId: null,
            name: device.product || `PS4 Controller`,
            path: device.path,
            percentage: 0,
            rawLevel: 0,
            isCharging: false,
            updateMethod: "Searching...",
            initTime: Date.now()
          };

          hid.on('data', (data) => {
            if (data[0] === 0x11) {
              ctrl.updateMethod = "Extended 0x11";
              const level = data[32] & 0x0F;
              ctrl.rawLevel = level;
              ctrl.isCharging = (data[32] & 0x10) !== 0;
              ctrl.percentage = mapBatteryLevel(level);
            }
          });

          hid.on('error', () => { });
          try { hid.getFeatureReport(0x05, 41); } catch (e) { }
          session.controllers.set(device.path, ctrl);
        } catch (e) { }
      }
    });

    session.controllers.forEach(ctrl => {
      if (!ctrl.sdl && (Date.now() - ctrl.initTime > 1000)) pairWithSDL(ctrl);
    });

    for (const [path, ctrl] of session.controllers) {
      if (!hidDevices.find(d => d.path === path)) {
        if (ctrl.sdl) try { ctrl.sdl.close(); } catch (e) { }
        try { ctrl.hid.close(); } catch (e) { }
        session.controllers.delete(path);
      }
    }
  }, 2000);

  setInterval(() => {
    const second = Math.floor(Date.now() / 1000) % 10;
    if (second === 0) {
      session.isPulsing = true;
      session.controllers.forEach(ctrl => {
        if (ctrl.sdl && ctrl.sdl.hasRumble) {
          try { ctrl.sdl.rumble(0.75, 0.75, 1200); } catch (e) { ctrl.sdl = null; }
        }
        logData(ctrl);
      });
    } else {
      session.isPulsing = false;
    }
    renderDisplay();
  }, 1000);
};

process.on('SIGINT', () => {
  session.controllers.forEach(ctrl => {
    if (ctrl.sdl) try { ctrl.sdl.rumble(0, 0, 0); ctrl.sdl.close(); } catch (e) { }
    ctrl.hid.close();
  });
  console.log(`\n${COLORS.GREEN}Test data saved to ${LOG_FILE}.${COLORS.RESET}`);
  process.exit(0);
});

main();
