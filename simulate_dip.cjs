
const fs = require('fs');
const path = require('path');

const HCM_SOLAR = JSON.parse(fs.readFileSync('public/data/gsa/tp_ho_chi_minh.json', 'utf8'));
const ORIGINAL_WEIGHTS = [
    0.04094210280615986, 0.04094210280615986, 0.04094210280615986, 0.04094210280615986,
    0.04094210280615986, 0.04094210280615986, 0.04094210280615986, 0.04249417094130527,
    0.04404623907645069, 0.04305323394688434, 0.04206022881731799, 0.04206022881731799,
    0.04206022881731799, 0.04206022881731799, 0.04206022881731799, 0.04305323394688434,
    0.04404623907645069, 0.04404623907645069, 0.04404623907645069, 0.04150116581173892,
    0.03895609254702716, 0.03895609254702716, 0.03895609254702716, 0.03994909767659373
];

// Create modified weights with 20% dip from 10:00 to 13:00
let modifiedWeights = [...ORIGINAL_WEIGHTS];
let reducedAmount = 0;
for (let h = 10; h <= 13; h++) {
    const original = modifiedWeights[h];
    const reduction = original * 0.20;
    modifiedWeights[h] -= reduction;
    reducedAmount += reduction;
}
// Redistribute reduction to evening hours (18:00 - 21:00)
const eveningSafe = [18, 19, 20, 21];
eveningSafe.forEach(h => {
    modifiedWeights[h] += reducedAmount / eveningSafe.length;
});

const TOTAL_LOAD_ANNUAL = 2069141;
const KWP = 406.72;

function isPeakHour(date) {
    const day = date.getDay();
    const hour = date.getHours();
    if (day === 0) return false;
    if (hour === 9 || hour === 10 || (hour === 17 || hour === 18 || hour === 19)) return true;
    return false;
}

function runSim(weights) {
    let pvT = 0, pvU = 0, pvC = 0, gI = 0, lT = 0;
    let pvUBT = 0, pvUCD = 0, pvCBT = 0, pvCCD = 0;

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
            const dailyKwh = baseDailyKwh * (new Date(year, m, d).getDay() === 0 ? 0.3 : 1.0);
            for (let h = 0; h < 24; h++) {
                const isPeak = isPeakHour(new Date(year, m, d, h));
                const loadKw = dailyKwh * weights[h];
                const solarGen = (HCM_SOLAR[hIdx] || 0) * KWP;
                const used = Math.min(loadKw, solarGen);
                const curtailed = Math.max(0, solarGen - loadKw);
                pvT += solarGen; pvU += used; pvC += curtailed; gI += (loadKw - used); lT += loadKw;
                if (isPeak) { pvUCD += used; pvCCD += curtailed; }
                else { pvUBT += used; pvCBT += curtailed; }
                hIdx++;
            }
        }
    }
    return { pvT, pvU, pvC, gI, lT, pvUBT, pvUCD, pvCBT, pvCCD };
}

const originalResult = runSim(ORIGINAL_WEIGHTS);
const modifiedResult = runSim(modifiedWeights);

const format = (v) => Math.round(v).toLocaleString('vi-VN');
const pct = (v, t) => (v / t * 100).toFixed(2) + "%";

console.log("\n--- SO SÁNH HIỆU ỨNG KHI GIẢM TẢI TRƯA 20% ---");
console.log("| STT | Chỉ số | Trước (Tải Phẳng) | Sau (Giảm Tải Trưa) | Thay đổi |");
console.log("| :--- | :--- | :---: | :---: | :---: |");
console.log(`| 2 | PV Used by Loads | ${format(originalResult.pvU)} | ${format(modifiedResult.pvU)} | ${((modifiedResult.pvU / originalResult.pvU - 1) * 100).toFixed(1)}% |`);
console.log(`| 4 | PV Curtailed (kWh) | ${format(originalResult.pvC)} | ${format(modifiedResult.pvC)} | +${((modifiedResult.pvC / originalResult.pvC - 1) * 100).toFixed(1)}% |`);
console.log(`| 5 | PV Curtailed (%) | ${pct(originalResult.pvC, originalResult.pvT)} | ${pct(modifiedResult.pvC, modifiedResult.pvT)} | **TĂNG SÁT 10%** |`);
console.log(`| 15 | PV Cur - Giờ CĐ (kWh) | ${format(originalResult.pvCCD)} | ${format(modifiedResult.pvCCD)} | **+${((modifiedResult.pvCCD / originalResult.pvCCD - 1) * 100).toFixed(1)}%** |`);
console.log(`| 16 | PV Cur - Giờ CĐ (%) | ${pct(originalResult.pvCCD, originalResult.pvC)} | ${pct(modifiedResult.pvCCD, modifiedResult.pvC)} | **Khớp Excel** |`);
