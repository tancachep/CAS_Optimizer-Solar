
const fs = require('fs');

const HCM_SOLAR = JSON.parse(fs.readFileSync('public/data/gsa/tp_ho_chi_minh.json', 'utf8'));
const ORIGINAL_WEIGHTS = [
    0.04094210280615986, 0.04094210280615986, 0.04094210280615986, 0.04094210280615986,
    0.04094210280615986, 0.04094210280615986, 0.04094210280615986, 0.04249417094130527,
    0.04404623907645069, 0.04305323394688434, 0.04206022881731799, 0.04206022881731799,
    0.04206022881731799, 0.04206022881731799, 0.04206022881731799, 0.04305323394688434,
    0.04404623907645069, 0.04404623907645069, 0.04404623907645069, 0.04150116581173892,
    0.03895609254702716, 0.03895609254702716, 0.03895609254702716, 0.03994909767659373
];

// Apply same 20% dip as before
let dipWeights = [...ORIGINAL_WEIGHTS];
let reduction = 0;
for (let h = 10; h <= 13; h++) {
    let r = dipWeights[h] * 0.20;
    dipWeights[h] -= r;
    reduction += r;
}
const evH = [18, 19, 20, 21];
evH.forEach(h => { dipWeights[h] += reduction / evH.length; });

const TOTAL_LOAD = 2069141;

function isPeak(date) {
    const d = date.getDay(); const h = date.getHours();
    if (d === 0) return false;
    if (h === 9 || h === 10 || h === 17 || h === 18 || h === 19) return true;
    return false;
}

function getRate(kwp, weights) {
    let pvC = 0, pvT = 0, hIdx = 0;
    const year = 2026;
    const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let wDays = 0;
    for (let m = 0; m < 12; m++) for (let d = 1; d <= days[m]; d++) wDays += (new Date(year, m, d).getDay() === 0 ? 0.3 : 1.0);
    const baseKwh = TOTAL_LOAD / wDays;

    for (let m = 0; m < 12; m++) {
        for (let d = 1; d <= days[m]; d++) {
            const dayLoad = baseKwh * (new Date(year, m, d).getDay() === 0 ? 0.3 : 1.0);
            for (let h = 0; h < 24; h++) {
                const load = dayLoad * weights[h];
                const gen = (HCM_SOLAR[hIdx++] || 0) * kwp;
                pvT += gen; pvC += Math.max(0, gen - load);
            }
        }
    }
    return pvC / pvT;
}

function findKwp(target, weights) {
    let low = 0, high = 1000;
    const adjustedTarget = target === 0 ? 0.0075 : target; // Match tool logic
    for (let i = 0; i < 20; i++) {
        let mid = (low + high) / 2;
        if (getRate(mid, weights) < adjustedTarget) low = mid;
        else high = mid;
    }
    return Math.round(low);
}

const targets = [0, 0.05, 0.10, 0.15, 0.20];
console.log("| Kịch bản | Tool Cũ (Ảnh) | Tool Mới (Sau điều chỉnh) | Sai số |");
console.log("| :--- | :---: | :---: | :---: |");
targets.forEach(t => {
    const oldVal = t === 0 ? 244 : (t === 0.05 ? 317 : (t === 0.10 ? 371 : (t === 0.15 ? 426 : 483)));
    const newVal = findKwp(t, dipWeights);
    console.log(`| Cắt giảm ${t * 100}% | ${oldVal} kWp | ${newVal} kWp | ${(newVal - oldVal)} kWp |`);
});
