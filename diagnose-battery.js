import HID from 'node-hid';

/**
 * PS4 Battery Diagnostic Tool
 * This script dumps various feature reports to help find the correct battery offset.
 */

const VENDOR_ID = 0x054C;
const PRODUCT_IDS = [0x05C4, 0x09CC, 0x0BA0];

const devices = HID.devices().filter(d => 
  d.vendorId === VENDOR_ID && 
  PRODUCT_IDS.includes(d.productId) &&
  (d.usagePage === 0x0001 && d.usage === 0x0005 || !d.usagePage)
);

if (devices.length === 0) {
  console.log("No controllers found.");
  process.exit(0);
}

console.log(`Found ${devices.length} controller(s). Running diagnostics...\n`);

devices.forEach((device, index) => {
  console.log(`--- Controller ${index + 1} [${device.product}] ---`);
  console.log(`Path: ${device.path}`);
  
  try {
    const hid = new HID.HID(device.path);
    
    // Try to read Feature Reports that might contain battery usage
    const reportIds = [0x02, 0x05, 0x12, 0x11];
    
    reportIds.forEach(id => {
      try {
        const report = hid.getFeatureReport(id, 64);
        console.log(`Feature Report 0x${id.toString(16).padStart(2, '0')} (${report.length} bytes):`);
        console.log(report.toString('hex').match(/.{1,2}/g).join(' '));
        
        // Find non-zero candidates between byte 5 and 64
        const candidates = [];
        for (let i = 2; i < report.length; i++) {
            if (report[i] > 0 && report[i] <= 11) {
                candidates.push(`idx ${i}: 0x${report[i].toString(16)} (${report[i]})`);
            }
        }
        if (candidates.length > 0) {
            console.log(`  Potential battery bytes (value 1-11): ${candidates.join(', ')}`);
        }

      } catch (e) {
        console.log(`Feature Report 0x${id.toString(16).padStart(2, '0')}: Failed to read (${e.message})`);
      }
    });
    
    hid.close();
  } catch (err) {
    console.log(`Failed to open: ${err.message}`);
  }
  console.log("\n");
});
