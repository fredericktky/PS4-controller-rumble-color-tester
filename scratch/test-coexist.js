import HID from 'node-hid';
import sdl from '@kmamal/sdl';

const VENDOR_ID = 0x054C;
const PRODUCT_IDS = [0x05C4, 0x09CC];

const main = () => {
    const devices = HID.devices().filter(d => 
        d.vendorId === VENDOR_ID && 
        PRODUCT_IDS.includes(d.productId) &&
        (d.usagePage === 0x0001 && d.usage === 0x0005 || !d.usagePage)
    );

    if (devices.length === 0) {
        console.log("No controllers found for test.");
        process.exit(0);
    }

    const path = devices[0].path;
    console.log(`Testing path: ${path}`);

    try {
        console.log("Opening with node-hid...");
        const hid = new HID.HID(path);
        console.log("node-hid success.");

        console.log("Opening with SDL...");
        // This might be tricky because SDL finds devices itself
        const sdlDevices = sdl.controller.devices;
        console.log(`SDL found ${sdlDevices.length} devices.`);
        
        if (sdlDevices.length > 0) {
            try {
                const ctrl = sdl.controller.openDevice(sdlDevices[0]);
                console.log("SDL success.");
                ctrl.close();
            } catch (e) {
                console.log("SDL failed to open device while HID is open:", e.message);
            }
        }

        hid.close();
    } catch (err) {
        console.log("HID failed:", err.message);
    }
};

main();
