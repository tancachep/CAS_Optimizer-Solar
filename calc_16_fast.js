const fs = require('fs');

// The original JSON data has been parsed and stored in analyze_huynh_duc_result.json
// It contains 17,436 rows of data natively readable.
const filePath = 'd:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/1. Database/7. Nhà máy Huỳnh Đức/analyze_huynh_duc_result.json';

const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Note: analyze_huynh_duc_result.json only has the first 30 rows! 
// Wait, my previous code only saved the first 30 rows. I need to re-read the full Excel file here
// to calculate the sum.

const xlsx = require('d:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/solar-optimizer/node_modules/xlsx');
const excelPath = 'D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/1. Database/7. Nhà máy Huỳnh Đức/1. Load profile/HUYNH DU LOAD PROFILE (09-2024 TO 09-2025).xlsx';
const TOTAL_PV_ANNUAL = 412162;

console.log("Reading...");
const workbook = xlsx.readFile(excelPath);
let sheetName = workbook.SheetNames.find(name => ['Summary', 'Data', 'Load Profile', 'Sheet1'].includes(name)) || workbook.SheetNames[0];
const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

const daily_profile_raw = { "06:00": 0.010, "06:30": 0.020, "07:00": 0.040, "07:30": 0.060, "08:00": 0.080, "08:30": 0.100, "09:00": 0.110, "09:30": 0.120, "10:00": 0.125, "10:30": 0.130, "11:00": 0.130, "11:30": 0.130, "12:00": 0.125, "12:30": 0.120, "13:00": 0.110, "13:30": 0.100, "14:00": 0.080, "14:30": 0.060, "15:00": 0.040, "15:30": 0.020, "16:00": 0.010 };
const sum_prof = Object.values(daily_profile_raw).reduce((a, b) => a + b, 0);
for (let k in daily_profile_raw) daily_profile_raw[k] /= sum_prof;

function get_tariff(dt) {
    if (dt.getDay() === 0) {
        if (dt.getHours() >= 22 || dt.getHours() < 4) return 'TD';
        return 'BT';
    }
    if (dt.getHours() >= 22 || dt.getHours() < 4) return 'TD';
    const time_val = dt.getHours() * 60 + dt.getMinutes();
    if ((9 * 60 + 30 <= time_val && time_val < 11 * 60 + 30) || (17 * 60 <= time_val && time_val < 20 * 60)) return 'CD';
    return 'BT';
}

function excelDateToJSDate(excelDate) {
    return new Date(Math.round((excelDate - 25569) * 86400 * 1000));
}

let total_PV = 0, pv_used = 0, pv_curtailed = 0, grid_import = 0, total_load = 0;
let pv_used_bt = 0, pv_used_cd = 0, pv_curtailed_bt = 0, pv_curtailed_cd = 0;
let dates = new Set();
let rows = [];

for (let i = 4; i < data.length; i++) {
    const row = data[i];
    if (row && row.length > 6 && typeof row[2] === 'number') {
        const dt = excelDateToJSDate(row[2]);
        dates.add(dt.toISOString().substring(0, 10));
        const load_kW = parseFloat(row[6]) || 0;
        rows.push({ dt, load_kW });
    }
}

const total_days = dates.size || 365;
const pv_per_day = TOTAL_PV_ANNUAL / total_days;

for (let r of rows) {
    const dt = r.dt;
    const load_kwh = r.load_kW * 0.5;
    total_load += load_kwh;

    let hm_str = String(dt.getHours()).padStart(2, '0') + ':' + String(dt.getMinutes()).padStart(2, '0');
    let pv_kwh = (daily_profile_raw[hm_str] || 0) * pv_per_day;

    total_PV += pv_kwh;
    const used = Math.min(load_kwh, pv_kwh);
    const curtailed = pv_kwh - used;
    const grid = load_kwh - used;

    pv_used += used; pv_curtailed += curtailed; grid_import += grid;

    const tariff = get_tariff(dt);
    if (tariff === 'BT') { pv_used_bt += used; pv_curtailed_bt += curtailed; }
    else if (tariff === 'CD') { pv_used_cd += used; pv_curtailed_cd += curtailed; }
}

const res = {
    "1. PV Total": total_PV.toFixed(0),
    "2. PV Used": pv_used.toFixed(0),
    "3. % PV Used": (total_PV ? (pv_used / total_PV) * 100 : 0).toFixed(2),
    "4. PV Curtailed": pv_curtailed.toFixed(0),
    "5. % PV Curtailed": (total_PV ? (pv_curtailed / total_PV) * 100 : 0).toFixed(2),
    "6. Grid": grid_import.toFixed(0),
    "7. Load Consumption": total_load.toFixed(0),
    "8. Loss Percent (%)": "0.00",
    "9. PV Used - Giờ BT": pv_used_bt.toFixed(0),
    "10. PV Used - Giờ BT (%)": (total_PV ? (pv_used_bt / total_PV) * 100 : 0).toFixed(2),
    "11. PV Used - Giờ CĐ": pv_used_cd.toFixed(0),
    "12. PV Used - Giờ CĐ (%)": (total_PV ? (pv_used_cd / total_PV) * 100 : 0).toFixed(2),
    "13. PV Cur - Giờ BT": pv_curtailed_bt.toFixed(0),
    "14. PV Cur - Giờ BT (%)": (total_PV ? (pv_curtailed_bt / total_PV) * 100 : 0).toFixed(2),
    "15. PV Cur - Giờ CĐ": pv_curtailed_cd.toFixed(0),
    "16. PV Cur - Giờ CĐ (%)": (total_PV ? (pv_curtailed_cd / total_PV) * 100 : 0).toFixed(2)
};

fs.writeFileSync('D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/1. Database/7. Nhà máy Huỳnh Đức/16_values_out.json', JSON.stringify(res, null, 2));
console.log("DONE");
