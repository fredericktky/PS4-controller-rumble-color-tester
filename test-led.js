import sdl from '@kmamal/sdl';

const main = () => {
  console.log("Starting PS4 LED Test...");
  
  // Listen for device events
  sdl.controller.on('deviceAdd', (event) => {
    const { device } = event;
    console.log(`Controller added: ${device.name}`);
    
    try {
      const controller = sdl.controller.openDevice(device);
      // Debug: print available properties
      console.log(`Opened controller: ${controller.name || 'Unknown'}`);
      console.log(`- hasLed: ${controller.hasLed}`);
      console.log(`- hasRumble: ${controller.hasRumble}`);
      
      let target = null;
      if (controller.hasLed) {
        target = controller;
      } else {
        console.log("Controller API says no LED. Trying Joystick API fallback...");
        const joystick = sdl.joystick.openDevice(device); // Joytick fallback
        console.log(`Opened joystick: ${joystick.name || 'Unknown'}`);
        console.log(`- hasLed: ${joystick.hasLed}`);
        if (joystick.hasLed) {
          target = joystick;
        }
      }

      if (target) {
        console.log("LED supported! Cycling colors...");
        let colorStep = 0;
        const colors = [
          { r: 1, g: 0, b: 0, name: "Red" },
          { r: 0, g: 1, b: 0, name: "Green" },
          { r: 0, g: 0, b: 1, name: "Blue" },
          { r: 1, g: 0, b: 1, name: "Magenta" }
        ];

        const interval = setInterval(() => {
          const color = colors[colorStep % colors.length];
          console.log(`Setting color to: ${color.name} (${color.r}, ${color.g}, ${color.b})`);
          target.setLed(color.r, color.g, color.b);
          colorStep++;
        }, 1000);

        setTimeout(() => {
          clearInterval(interval);
          console.log("Test finished. Closing device.");
          target.close();
          process.exit(0);
        }, 10000);
      } else {
        console.warn("Neither Controller nor Joystick API reports LED support for this PS4 controller.");
        console.warn("Hint: On Windows Bluetooth, you might need to disconnect/reconnect or use USB.");
      }
    } catch (err) {
      console.error(`Failed to open device: ${err.message}`);
      console.error(err.stack);
    }
  });

  // Check for already connected devices
  const devices = sdl.controller.devices;
  console.log(`Found ${devices.length} controller(s) initially.`);
  
  for (const device of devices) {
    sdl.controller.emit('deviceAdd', { device });
  }

  if (devices.length === 0) {
    console.log("No controllers found. Please connect your PS4 controller now...");
  }
};

main();
