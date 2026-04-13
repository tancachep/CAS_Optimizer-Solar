
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

function getRate(kwp, schedule, dipPercent) {
    let weights = [...ORIGINAL_WEIGHTS];
    if (dipPercent > 0) {
        let red = 0;
        for (let h = 10; h <= 13; h++) {
            let r = weights[h] * dipPercent;
            weights[h] -= r;
            red += r;
        }
        const evH = [18, 19, 20, 21];
        evH.forEach(h => { weights[h] += red / evH.length; });
    }

    let pvC = 0, pvT = 0, hIdx = 0;
    const year = 2026;
    const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    let wDays = 0;
    for (let m = 0; m < 12; m++) {
        for (let d = 1; d <= days[m]; d++) {
            const dayOfWeek = new Date(year, m, d).getDay();
            if (schedule === 'all_days') wDays += 1.0;
            else wDays += (dayOfWeek === 0 ? 0.3 : 1.0);
        }
    }
    const baseKwh = TOTAL_LOAD / wDays;

    for (let m = 0; m < 12; m++) {
        for (let d = 1; d <= days[m]; d++) {
            const dayOfWeek = new Date(year, m, d).getDay();
            const scale = (schedule === 'all_days') ? 1.0 : (dayOfWeek === 0 ? 0.3 : 1.0);
            const dayLoad = baseKwh * scale;
            for (let h = 0; h < 24; h++) {
                const load = dayLoad * weights[h];
                const gen = (HCM_SOLAR[hIdx++] || 0) * kwp;
                pvT += gen; pvC += Math.max(0, gen - load);
            }
        }
    }
    return pvC / pvT;
}

function findKwp(target, schedule, dipPercent) {
    let low = 0, high = 1000;
    const adjustedTarget = target === 0 ? 0.0075 : target;
    for (let i = 0; i < 20; i++) {
        let mid = (low + high) / 2;
        if (getRate(mid, schedule, dipPercent) < adjustedTarget) low = mid;
        else high = mid;
    }
    return Math.round(low);
}

console.log("| Cấu hình | 0% | 5% | 10% | 15% | 20% |");
console.log("| :--- | :---: | :---: | :---: | :---: | :---: |");
console.log(`| Tool Cũ | 244 kWp | 317 kWp | 371 kWp | 426 kWp | 483 kWp |`);

const dip = 0.31;
console.log(`| All-Days, Dip 31% | ${findKwp(0, 'all_days', dip)} kWp | ${findKwp(0.05, 'all_days', dip)} kWp | ${findKwp(0.10, 'all_days', dip)} kWp | ${findKwp(0.15, 'all_days', dip)} kWp | ${findKwp(0.20, 'all_days', dip)} kWp |`);
