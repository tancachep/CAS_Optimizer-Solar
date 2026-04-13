
const fs = require('fs');
const path = require('path');

const HCM_SOLAR = JSON.parse(fs.readFileSync('public/data/gsa/tp_ho_chi_minh.json', 'utf8'));
const VUBD_WEIGHTS = [
    0.04094210280615986, 0.04094210280615986, 0.04094210280615986, 0.04094210280615986,
    0.04094210280615986, 0.04094210280615986, 0.04094210280615986, 0.04249417094130527,
    0.04404623907645069, 0.04305323394688434, 0.04206022881731799, 0.04206022881731799,
    0.04206022881731799, 0.04206022881731799, 0.04206022881731799, 0.04305323394688434,
    0.04404623907645069, 0.04404623907645069, 0.04404623907645069, 0.04150116581173892,
    0.03895609254702716, 0.03895609254702716, 0.03895609254702716, 0.03994909767659373
];

const TOTAL_LOAD_ANNUAL = 2069141;
const KWP = 406.72;

function isPeakHour(date) {
    const day = date.getDay();
    const hour = date.getHours();
    if (day === 0) return false;
    // 9:30-11:30 and 17:00-20:00
    if (hour === 9) return true; // (Approximated as full hour for 60min steps since the weight is per hour)
    if (hour === 10) return true;
    if (hour === 17 || hour === 18 || hour === 19) return true;
    return false;
}

let pvTotal = 0, pvUsed = 0, pvCurtailed = 0, gridImport = 0, loadTotal = 0;
let pvUsedBT = 0, pvUsedCD = 0, pvCurBT = 0, pvCurCD = 0;

let weightedDaysCount = 0;
const year = 2026;
const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
for (let m = 0; m < 12; m++) {
    for (let d = 1; d <= daysInMonth[m]; d++) {
        const dayOfWeek = new Date(year, m, d).getDay();
        weightedDaysCount += (dayOfWeek === 0 ? 0.3 : 1.0);
    }
}
const baseDailyKwh = TOTAL_LOAD_ANNUAL / weightedDaysCount;

let hIdx = 0;
for (let m = 0; m < 12; m++) {
    for (let d = 1; d <= daysInMonth[m]; d++) {
        const dayOfWeek = new Date(year, m, d).getDay();
        const scale = (dayOfWeek === 0 ? 0.3 : 1.0);
        const dailyKwh = baseDailyKwh * scale;

        for (let h = 0; h < 24; h++) {
            const date = new Date(year, m, d, h, 0, 0);
            const isPeak = isPeakHour(date);
            const loadKw = dailyKwh * VUBD_WEIGHTS[h];
            const solarGen = (HCM_SOLAR[hIdx] || 0) * KWP;

            const used = Math.min(loadKw, solarGen);
            const curtailed = Math.max(0, solarGen - loadKw);
            const imported = Math.max(0, loadKw - solarGen);

            pvTotal += solarGen;
            pvUsed += used;
            pvCurtailed += curtailed;
            gridImport += imported;
            loadTotal += loadKw;

            if (isPeak) {
                pvUsedCD += used;
                pvCurCD += curtailed;
            } else {
                pvUsedBT += used;
                pvCurBT += curtailed;
            }
            hIdx++;
        }
    }
}

const format = (v) => Math.round(v).toLocaleString('vi-VN');
const pct = (a, b) => b === 0 ? "0%" : (a / b * 100).toFixed(2) + "%";

console.log("\n--- CHỈ SỐ SO SÁNH (16 THÔNG SỐ) ---");
console.log(`1. PV Total: ${format(pvTotal)} kWh`);
console.log(`2. PV Used by Loads: ${format(pvUsed)} kWh`);
console.log(`3. PV Used (%): ${pct(pvUsed, pvTotal)}`);
console.log(`4. PV Curtailed: ${format(pvCurtailed)} kWh`);
console.log(`5. PV Curtailed (%): ${pct(pvCurtailed, pvTotal)}`);
console.log(`6. Grid Import: ${format(gridImport)} kWh`);
console.log(`7. Load Consumption: ${format(loadTotal)} kWh`);
console.log(`8. Loss Percent: -0.53% (Excel) vs 0.00% (New Tool Actual Yield)`);
console.log(`9. PV Used - Giờ BT: ${format(pvUsedBT)} kWh`);
console.log(`10. PV Used - Giờ BT (%): ${pct(pvUsedBT, pvUsed)}`);
console.log(`11. PV Used - Giờ CĐ: ${format(pvUsedCD)} kWh`);
console.log(`12. PV Used - Giờ CĐ (%): ${pct(pvUsedCD, pvUsed)}`);
console.log(`13. PV Cur - Giờ BT: ${format(pvCurBT)} kWh`);
console.log(`14. PV Cur - Giờ BT (%): ${pct(pvCurBT, pvCurtailed)}`);
console.log(`15. PV Cur - Giờ CĐ: ${format(pvCurCD)} kWh`);
console.log(`16. PV Cur - Giờ CĐ (%): ${pct(pvCurCD, pvCurtailed)}`);
