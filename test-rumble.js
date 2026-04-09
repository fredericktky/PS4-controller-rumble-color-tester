import sdl from '@kmamal/sdl';

const main = () => {
  console.log("Starting PS4 Rumble Test...");
  
  // Listen for device events
  sdl.controller.on('deviceAdd', (event) => {
    const { device } = event;
    console.log(`Controller added: ${device.name}`);
    
    try {
      const controller = sdl.controller.openDevice(device);
      console.log(`Opened controller: ${controller.name || 'Unknown'}`);
      console.log(`- hasRumble: ${controller.hasRumble}`);
      
      let target = null;
      if (controller.hasRumble) {
        target = controller;
      } else {
        console.log("Controller API says no Rumble. Trying Joystick API fallback...");
        const joystick = sdl.joystick.openDevice(device);
        console.log(`Opened joystick: ${joystick.name || 'Unknown'}`);
        console.log(`- hasRumble: ${joystick.hasRumble}`);
        if (joystick.hasRumble) {
          target = joystick;
        }
      }

      if (target) {
        console.log("Rumble supported! Starting pulses...");
        
        let pulseCount = 0;
        const interval = setInterval(() => {
          pulseCount++;
          // Alternating between low and high frequency rumble
          if (pulseCount % 2 === 1) {
            console.log("Pulse: Low Frequency (Heavy Motor)");
            target.rumble(1, 0, 500);
          } else {
            console.log("Pulse: High Frequency (Light Motor)");
            target.rumble(0, 1, 500);
          }
          
          if (pulseCount >= 6) {
            clearInterval(interval);
            console.log("Combined Pulse: Both Motors");
            target.rumble(1, 1, 1000);
            
            setTimeout(() => {
              console.log("Test finished. Closing device.");
              target.close();
              process.exit(0);
            }, 1500);
          }
        }, 1000);

      } else {
        console.warn("Neither Controller nor Joystick API reports Rumble support for this PS4 controller.");
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
