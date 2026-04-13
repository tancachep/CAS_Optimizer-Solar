const fs = require('fs');
const XLSX = require('xlsx');

// 1. Data từ User
const capacities = [235.6, 327.36, 406.72];
const monthlyBill = [249600, 217300, 211500, 160300, 129500, 126600, 142600, 155600, 153600, 176300, 158600, 221300];
const totalLoad = monthlyBill.reduce((a, b) => a + b, 0);
const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function getTouPeriod(dayOfYear, hour) {
    const isSunday = (dayOfYear % 7) === 6;
    if (isSunday) {
        if (hour >= 4 && hour < 22) return 'BT';
        return 'TD';
    } else {
        if (hour === 9 || hour === 10 || hour === 17 || hour === 18 || hour === 19) return 'CD';
        if (hour >= 4 && hour < 22) return 'BT';
        return 'TD';
    }
}

// Lấy PVOUT năm từ Map_data
function getAnnualPvout() {
    const filePath = "D:\\TOOL GOOGLE ANTIGRAVITY\\2. Tool Tính toán công suất\\1. Database\\GSA\\37. Bình Định\\GSA_Report_Bình Định_Province.xlsx";
    const workbook = XLSX.readFile(filePath);
    const mapSheet = workbook.Sheets['Map_data'] || workbook.Sheets['Map data'];
    const data = XLSX.utils.sheet_to_json(mapSheet, { header: 1 });
    const pvoutRow = data.find(r => r[1] === 'PVOUT_specific' || (typeof r[0] === 'string' && r[0].toLowerCase().includes('specific photovoltaic')));
    return pvoutRow ? parseFloat(pvoutRow[2]) : 1448.5;
}

// Lấy ma trận giờ (DNI hoặc GHI) và Normalize
function getNormalizedProfile() {
    const filePath = "D:\\TOOL GOOGLE ANTIGRAVITY\\2. Tool Tính toán công suất\\1. Database\\GSA\\37. Bình Định\\GSA_Report_Bình Định_Province.xlsx";
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets['Hourly_profiles'] || workbook.Sheets['Hourly profiles'];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    let rawHourly = new Array(8760).fill(0);
    let startRow = -1;

    for (let i = 0; i < data.length; i++) {
        if (!data[i] || !Array.isArray(data[i])) continue;
        let rowStr = data[i].join(' ').toLowerCase();
        if (rowStr.includes('jan') && rowStr.includes('feb')) {
            startRow = i;
            break;
        }
    }

    let sum = 0;
    if (startRow !== -1) {
        let hourIndex = 0;
        for (let month = 0; month < 12; month++) {
            for (let day = 0; day < daysInMonth[month]; day++) {
                for (let h = 0; h < 24; h++) {
                    let val = parseFloat(data[startRow + 1 + h][1 + month]) || 0;
                    rawHourly[hourIndex++] = val;
                    sum += val;
                }
            }
        }
    }

    // Normalize
    const normalized = new Array(8760).fill(0);
    if (sum > 0) {
        for (let i = 0; i < 8760; i++) {
            normalized[i] = rawHourly[i] / sum;
        }
    }
    return normalized;
}

const annualPvout = getAnnualPvout();
const normalizedProfile = getNormalizedProfile();

// Chuyển thành profile cho 1 kWp dựa trên Annual PVOUT
const pvoutProfile1kWp = normalizedProfile.map(val => val * annualPvout);

// Tạo Load Profile (24/24)
let loadProfile8760 = new Array(8760).fill(0);
let idx = 0;
for (let m = 0; m < 12; m++) {
    const hourlyLoad = monthlyBill[m] / (daysInMonth[m] * 24);
    for (let d = 0; d < daysInMonth[m]; d++) {
        for (let h = 0; h < 24; h++) {
            loadProfile8760[idx++] = hourlyLoad;
        }
    }
}

// 5. Mô phỏng 3 kịch bản
const results = [];

capacities.forEach(cap => {
    let pvTotal = 0;
    let pvUsed = 0;
    let grid = 0;
    let pvCurtailed = 0;
    let pvUsedBT = 0, pvUsedCD = 0, pvCurBT = 0, pvCurCD = 0;

    for (let i = 0; i < 8760; i++) {
        let pvE = pvoutProfile1kWp[i] * cap;
        let loadE = loadProfile8760[i];

        pvTotal += pvE;
        let used = Math.min(pvE, loadE);
        let cur = pvE - used;
        let bought = loadE - used;

        pvUsed += used;
        pvCurtailed += cur;
        grid += bought;

        let dayOfYear = Math.floor(i / 24);
        let hour = i % 24;
        let tou = getTouPeriod(dayOfYear, hour);

        if (tou === 'BT') {
            pvUsedBT += used; pvCurBT += cur;
        } else if (tou === 'CD') {
            pvUsedCD += used; pvCurCD += cur;
        }
    }

    results.push({
        Case: `VUBD - ${cap}kWp`,
        kWp: cap,
        "PV Total (kWh)": pvTotal,
        "PV Used by Loads (kWh)": pvUsed,
        "PV Used by Loads (%)": (pvUsed / pvTotal) * 100,
        "PV Curtailed (kWh)": pvCurtailed,
        "PV Curtailed (%)": (pvCurtailed / pvTotal) * 100,
        "Grid (kWh)": grid,
        "Load Consumption (kWh)": totalLoad,
        "PV Used - Giờ BT (kWh)": pvUsedBT,
        "PV Used - Giờ BT (%)": (pvUsedBT / pvUsed) * 100,
        "PV Used - Giờ CĐ (kWh)": pvUsedCD,
        "PV Used - Giờ CĐ (%)": (pvUsedCD / pvUsed) * 100,
        "PV Cur - Giờ BT (kWh)": pvCurBT,
        "PV Cur - Giờ BT (%)": pvCurtailed > 0 ? (pvCurBT / pvCurtailed) * 100 : 0,
        "PV Cur - Giờ CĐ (kWh)": pvCurCD,
        "PV Cur - Giờ CĐ (%)": pvCurtailed > 0 ? (pvCurCD / pvCurtailed) * 100 : 0,
    });
});

console.log("| Thông số | Kịch Bản 1 (Tool) | Kịch Bản 2 (Tool) | Kịch Bản 3 (Tool) |");
console.log("|---|---|---|---|");

const keys = Object.keys(results[0]);
keys.forEach(key => {
    let r1 = results[0][key];
    let r2 = results[1][key];
    let r3 = results[2][key];

    let f1 = typeof r1 === 'number' ? (key.includes('%') ? r1.toFixed(1) + '%' : r1.toLocaleString('en-US', { maximumFractionDigits: 0 })) : r1;
    let f2 = typeof r2 === 'number' ? (key.includes('%') ? r2.toFixed(1) + '%' : r2.toLocaleString('en-US', { maximumFractionDigits: 0 })) : r2;
    let f3 = typeof r3 === 'number' ? (key.includes('%') ? r3.toFixed(1) + '%' : r3.toLocaleString('en-US', { maximumFractionDigits: 0 })) : r3;

    console.log(`| **${key}** | ${f1} | ${f2} | ${f3} |`);
});
