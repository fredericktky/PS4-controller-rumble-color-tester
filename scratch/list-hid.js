import HID from 'node-hid';

const devices = HID.devices();
console.log(JSON.stringify(devices, null, 2));
