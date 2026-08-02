// Set critical SDL environment variables before any library initialization
process.env.SDL_JOYSTICK_HIDAPI = "1";
process.env.SDL_JOYSTICK_HIDAPI_PS4 = "1";
process.env.SDL_JOYSTICK_HIDAPI_PS4_RUMBLE = "1";
process.env.SDL_JOYSTICK_RAWINPUT = "0";

import HID from 'node-hid';
import sdl from '@kmamal/sdl';

/**
 * PS4 Battery Turbo Stress Test (Premium Edition)
 * - Continuous moderate rumble (50% power)
 * - Staggered loop logic for 4+ controllers
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
  YELLOW_BG: "\x1b[43m\x1b[30m"
};

const session = {
  controllers: new Map(),
  startTime: Date.now()
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

          // Start the private staggered rumble loop
          const staggerOffset = (session.controllers.size % 4) * 500;
          setTimeout(() => {
            if (ctrl.rumbleLoop) clearInterval(ctrl.rumbleLoop);
            ctrl.rumbleLoop = setInterval(() => {
              if (ctrl.sdl && ctrl.sdl.hasRumble) {
                try {
                  ctrl.sdl.rumble(0.5, 0.5, 5000);
                } catch (e) {
                  ctrl.sdl = null;
                  clearInterval(ctrl.rumbleLoop);
                }
              } else {
                clearInterval(ctrl.rumbleLoop);
              }
            }, 4000);
          }, staggerOffset);

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
  const seconds = elapsed % 60;

  console.log(`${COLORS.BOLD}${COLORS.YELLOW}╔══════════════════════════════════════════════════════════════════════════════╗`);
  console.log(`║ ${COLORS.RESET}${COLORS.BOLD}                PS4 BATTERY TURBO STRESS TESTER (PRO)                ${COLORS.YELLOW}║`);
  console.log(`╚══════════════════════════════════════════════════════════════════════════════╝${COLORS.RESET}`);
  console.log(` Running Time: ${COLORS.BOLD}${minutes}m ${seconds}s${COLORS.RESET}                                            ${new Date().toLocaleTimeString()} `);
  console.log(`${COLORS.YELLOW}╟──────────────────────────────────────────────────────────────────────────────╢${COLORS.RESET}`);

  if (session.controllers.size === 0) {
    console.log("║  Searching for controllers...                                                ║");
  } else {
    session.controllers.forEach((ctrl) => {
      const percentage = Math.round(ctrl.percentage);
      const color = getBatteryColor(percentage);
      const barCount = Math.round(percentage / 4);
      const bar = `${color}${'█'.repeat(barCount)}${COLORS.RESET}${'░'.repeat(25 - barCount)}`;

      const delta = (ctrl.startRaw !== null && ctrl.rawLevel !== null) ? (ctrl.rawLevel - ctrl.startRaw) : 0;
      const rawText = `${ctrl.rawLevel}/10`;

      console.log(`║  ${COLORS.BOLD}[${ctrl.name.padEnd(25).substring(0, 25)}]${COLORS.RESET}                                     ║`);
      console.log(`║  Level:    [${bar}] ${color}${percentage.toString().padStart(3)}%${COLORS.RESET} (Raw: ${rawText.padStart(4)})           ║`);
      console.log(`║  Drain:    ${(delta === 0 ? COLORS.GREEN + "STABLE" : COLORS.RED + `DROPPED ${Math.abs(delta)} LEVELS`).padEnd(30)}${COLORS.RESET}  Intensity: 50% ║`);
      console.log(`║  Status:   🔄 ${COLORS.YELLOW}STAGGERED CONTINUOUS${COLORS.RESET}   (${ctrl.sdl ? COLORS.GREEN + 'RUNNING' : COLORS.RED + 'WAITING'}${COLORS.RESET})          ║`);
      console.log(`${COLORS.YELLOW}╟──────────────────────────────────────────────────────────────────────────────╢${COLORS.RESET}`);
    });
  }
  console.log("║  GOAL: Use this for fast verification. Motors are currenty at safe 50%.      ║");
  console.log("║  Press Ctrl+C to stop and save the motors.                                  ║");
  console.log(`${COLORS.YELLOW}╚══════════════════════════════════════════════════════════════════════════════╝${COLORS.RESET}`);
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
            rawLevel: null,
            startRaw: null,
            updateMethod: "Searching...",
            initTime: Date.now(),
            rumbleLoop: null
          };

          hid.on('data', (data) => {
            if (data[0] === 0x11) {
              ctrl.updateMethod = "Extended 0x11";
              const level = data[32] & 0x0F;
              ctrl.rawLevel = level;
              ctrl.percentage = mapBatteryLevel(level);
              if (ctrl.startRaw === null) ctrl.startRaw = level;
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
        if (ctrl.rumbleLoop) clearInterval(ctrl.rumbleLoop);
        if (ctrl.sdl) try { ctrl.sdl.close(); } catch (e) { }
        try { ctrl.hid.close(); } catch (e) { }
        session.controllers.delete(path);
      }
    }
  }, 2000);

  setInterval(renderDisplay, 1000);
};

process.on('SIGINT', () => {
  session.controllers.forEach(ctrl => {
    if (ctrl.rumbleLoop) clearInterval(ctrl.rumbleLoop);
    if (ctrl.sdl) try { ctrl.sdl.rumble(0, 0, 0); ctrl.sdl.close(); } catch (e) { }
    ctrl.hid.close();
  });
  process.exit(0);
});

main();
