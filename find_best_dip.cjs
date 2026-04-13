
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
const TOTAL_LOAD = 2069141;

function getRate(kwp, dipPercent) {
    let weights = [...ORIGINAL_WEIGHTS];
    let red = 0;
    for (let h = 10; h <= 13; h++) {
        let r = weights[h] * dipPercent;
        weights[h] -= r;
        red += r;
    }
    const evH = [18, 19, 20, 21];
    evH.forEach(h => { weights[h] += red / evH.length; });

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

console.log("| Tỷ lệ giảm trưa | Cắt giảm tại 244 kWp |");
console.log("| :--- | :---: |");
for (let dip = 0; dip <= 0.20; dip += 0.02) {
    const rate = getRate(244, dip);
    console.log(`| ${(dip * 100).toFixed(0)}% | ${(rate * 100).toFixed(2)}% |`);
}
