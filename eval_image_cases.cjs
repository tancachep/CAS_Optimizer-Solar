
const fs = require('fs');

const HCM_SOLAR = JSON.parse(fs.readFileSync('public/data/gsa/tp_ho_chi_minh.json', 'utf8'));
const FLAT_WEIGHTS = [
    0.04094210280615986, 0.04094210280615986, 0.04094210280615986, 0.04094210280615986,
    0.04094210280615986, 0.04094210280615986, 0.04094210280615986, 0.04249417094130527,
    0.04404623907645069, 0.04305323394688434, 0.04206022881731799, 0.04206022881731799,
    0.04206022881731799, 0.04206022881731799, 0.04206022881731799, 0.04305323394688434,
    0.04404623907645069, 0.04404623907645069, 0.04404623907645069, 0.04150116581173892,
    0.03895609254702716, 0.03895609254702716, 0.03895609254702716, 0.03994909767659373
];
const TOTAL_LOAD = 2069141;

function isPeak(date) {
    const d = date.getDay(); const h = date.getHours();
    if (d === 0) return false;
    if (h === 9 || h === 10 || h === 17 || h === 18 || h === 19) return true;
    return false;
}

function calc(kwp) {
    let pvT = 0, pvU = 0, pvC = 0, pvUBT = 0, pvUCD = 0, pvCBT = 0, pvCCD = 0;
    let hIdx = 0;
    const year = 2026;
    const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    // schedule = all_days for literal match with 24/7 shrimp farm
    const baseKwh = TOTAL_LOAD / 365;

    for (let m = 0; m < 12; m++) {
        for (let d = 1; d <= days[m]; d++) {
            const date = new Date(year, m, d);
            for (let h = 0; h < 24; h++) {
                const load = baseKwh * FLAT_WEIGHTS[h];
                const gen = (HCM_SOLAR[hIdx++] || 0) * kwp;
                const used = Math.min(load, gen);
                const cut = Math.max(0, gen - load);

                pvT += gen; pvU += used; pvC += cut;
                if (isPeak(new Date(year, m, d, h))) {
                    pvUCD += used; pvCCD += cut;
                } else {
                    pvUBT += used; pvCBT += cut;
                }
            }
        }
    }
    return { pvT, pvU, pvC, pvUBT, pvUCD, pvCBT, pvCCD };
}

const format = v => Math.round(v).toLocaleString('en-US');

[255.6, 333.8, 406.72].forEach(kwp => {
    const res = calc(kwp);
    console.log(`\n--- ${kwp} kWp (Tool Mới - All Days) ---`);
    console.log(`PV Total: ${format(res.pvT)}`);
    console.log(`PV Used: ${format(res.pvU)} (${(res.pvU / res.pvT * 100).toFixed(1)}%)`);
    console.log(`PV Curt: ${format(res.pvC)} (${(res.pvC / res.pvT * 100).toFixed(1)}%)`);
    console.log(`Used BT: ${format(res.pvUBT)} (${(res.pvUBT / res.pvU * 100).toFixed(1)}%) | Used CD: ${format(res.pvUCD)} (${(res.pvUCD / res.pvU * 100).toFixed(1)}%)`);
    console.log(`Curt BT: ${format(res.pvCBT)} (${(res.pvCBT / res.pvC * 100).toFixed(1)}%) | Curt CD: ${format(res.pvCCD)} (${(res.pvCCD / res.pvC * 100).toFixed(1)}%)`);
});
