import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';

const filePath = 'D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/1. Database/NEW TEMPLATE/HUYNHDUC1/Make_Template_HUYNHDUC1.xlsx';
const TOTAL_PV_ANNUAL = 416451; // HUYNHDUC1 (282.72 kWp) - P75 (?)

// Generic Solar Profile (normalized to sum = 1.0)
const dailyProfile = {
    360: 0.010, // 06:00
    390: 0.020, // 06:30
    420: 0.040, // 07:00
    450: 0.060, // 07:30
    480: 0.080, // 08:00
    510: 0.095, // 08:30 (giảm nhẹ từ 0.100)
    540: 0.105, // 09:00 (BT)
    570: 0.118, // 09:30 (CĐ - phẳng hơn, tăng từ 0.115)
    600: 0.117, // 10:00 (CĐ - phẳng hơn, giảm từ 0.120)
    630: 0.117, // 10:30 (CĐ - phẳng hơn, giảm từ 0.120)
    660: 0.118, // 11:00 (CĐ - phẳng hơn, tăng từ 0.115)
    690: 0.135, // 11:30 (BT - tăng từ 0.130, tăng curtail BT)
    720: 0.155, // 12:00 (BT)
    750: 0.145, // 12:30 (BT)
    780: 0.135, // 13:00 (BT)
    810: 0.125, // 13:30 (BT)
    840: 0.090, // 14:00
    870: 0.060, // 14:30
    900: 0.030, // 15:00
    930: 0.015, // 15:30
    960: 0.005, // 16:00
};

// Normalize so sum is exactly 1.0
let sumProfile = Object.values(dailyProfile).reduce((a, b) => a + b, 0);
for (let key in dailyProfile) {
    dailyProfile[key] = dailyProfile[key] / sumProfile;
}

// EVN Time of Use (TOU) Checking
function getTariffType(dateObj, hour, minute) {
    const isSunday = dateObj.getDay() === 0;
    const timeStr = hour * 60 + minute; // total minutes

    // Thấp điểm (Off-peak)
    if (timeStr >= 22 * 60 || timeStr < 4 * 60) return 'TD';

    // Cao điểm (Peak) - Only Monday to Saturday
    if (!isSunday) {
        if ((timeStr >= 9 * 60 + 30 && timeStr < 11 * 60 + 30) ||
            (timeStr >= 17 * 60 && timeStr < 20 * 60)) {
            return 'CD';
        }
    }

    // Bình thường (Normal)
    return 'BT';
}

// Convert Excel Serial Date or String to JS Date
function parseDateTime(val) {
    if (typeof val === 'number') {
        return new Date(Math.round((val - 25569) * 86400 * 1000));
    }
    if (typeof val === 'string') {
        const clean = val.trim();
        // Split on any whitespace (handles double spaces, tabs, etc.)
        const parts = clean.split(/\s+/);
        if (parts.length >= 2) {
            const dateParts = parts[0].split('/');
            const timeParts = parts[1].split(':');
            if (dateParts.length >= 2 && timeParts.length >= 2) {
                const year = dateParts.length >= 3 ? parseInt(dateParts[2]) : new Date().getFullYear();
                const month = parseInt(dateParts[0]) - 1;
                const day = parseInt(dateParts[1]);
                const hour = parseInt(timeParts[0]);
                const min = parseInt(timeParts[1]);
                if (!isNaN(month) && !isNaN(day) && !isNaN(hour) && !isNaN(min)) {
                    return new Date(year, month, day, hour, min);
                }
            }
        }
    }
    return null;
}

try {
    console.log("Reading Excel file...");
    const workbook = xlsx.readFile(filePath);

    const targetSheetNames = ['Template_SMD', 'Summary', 'Data', 'Load Profile', 'Sheet1', 'ThongSoVanHanh_KhachHang'];
    let sheetName = targetSheetNames.find(name => workbook.SheetNames.includes(name));
    if (!sheetName) sheetName = workbook.SheetNames[0];

    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // AUTO-DETECT: Find header row, load column, and time column
    let headerRowIdx = -1;
    let loadColIdx = -1;
    let timeColIdx = -1;
    let startDataRow = 4; // default

    for (let i = 0; i < Math.min(data.length, 20); i++) {
        const row = data[i];
        if (!Array.isArray(row)) continue;
        const rowStr = row.map(c => String(c || '').toLowerCase());

        // Find load column: Σ P (kW), Data, Load...
        let pIdx = rowStr.findIndex(c => c.length < 100 && (
            c.includes('σ p') || c.includes('sum p') || c.includes('total p') ||
            c === 'data' || c === 'load (kw)' || c === 'load'
        ));

        if (pIdx !== -1) {
            headerRowIdx = i;
            loadColIdx = pIdx;
            startDataRow = i + 1;

            // Find time column
            timeColIdx = rowStr.findIndex((c, idx) => idx !== loadColIdx && c.length < 100 && (
                c.includes('meter time') || c.includes('month/day') ||
                c.includes('time') || c.includes('date')
            ));

            // Fallback: if no time column found, check for M/D H:m format string columns in data rows
            if (timeColIdx === -1) {
                // Scan data row to find a column with M/D H:m format
                const sampleRow = data[i + 1];
                if (sampleRow) {
                    for (let c = 0; c < sampleRow.length; c++) {
                        if (c === loadColIdx) continue;
                        const val = String(sampleRow[c] || '');
                        if (/^\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{2}/.test(val)) {
                            timeColIdx = c;
                            break;
                        }
                    }
                }
            }

            // Final fallback: if file has column 0 as time (NEW TEMPLATE simple format)
            if (timeColIdx === -1 && loadColIdx !== 0) timeColIdx = 0;

            console.log(`Auto-detected: Header row ${i}, Load col ${loadColIdx} ("${row[loadColIdx]}"), Time col ${timeColIdx} ("${row[timeColIdx]}")`);
            break;
        }
    }

    if (headerRowIdx === -1 || loadColIdx === -1) {
        throw new Error('Cannot find load column header in file!');
    }

    let validDays = new Set();

    // First pass to find total days
    for (let i = startDataRow; i < data.length; i++) {
        const row = data[i];
        if (row && row.length > loadColIdx) {
            const timeVal = timeColIdx >= 0 ? row[timeColIdx] : row[0];
            const d = parseDateTime(timeVal);
            if (d && !isNaN(d.getTime())) {
                validDays.add(d.toISOString().substring(0, 10));
            }
        }
    }

    const totalDays = validDays.size || 365;
    const pvPerDay = TOTAL_PV_ANNUAL / totalDays;
    console.log(`Found ${totalDays} days of data. PV per day: ${pvPerDay.toFixed(2)} kWh`);

    let total_PV = 0;
    let pv_used = 0;
    let pv_curtailed = 0;
    let grid_import = 0;
    let total_load = 0;

    // TOU counters
    let pv_used_bt = 0;
    let pv_used_cd = 0;
    let pv_curtailed_bt = 0;
    let pv_curtailed_cd = 0;

    console.log("Calculating values...");

    for (let i = startDataRow; i < data.length; i++) {
        const row = data[i];

        if (row && row.length > loadColIdx) {
            const timeVal = timeColIdx >= 0 ? row[timeColIdx] : row[0];
            const d = parseDateTime(timeVal);
            if (!d || isNaN(d.getTime())) continue;

            const mnt = d.getHours() * 60 + d.getMinutes();
            const load_kW = parseFloat(row[loadColIdx]) || 0;
            const load_kWh = load_kW * 0.5;

            total_load += load_kWh;

            // PV generation
            let pv_kWh = 0;
            if (dailyProfile[mnt]) {
                // dailyProfile gives ratio of the day's PV
                pv_kWh = dailyProfile[mnt] * pvPerDay;
            }

            total_PV += pv_kWh;

            const used = Math.min(load_kWh, pv_kWh);
            const curtailed = pv_kWh - used;
            const grid = load_kWh - used;

            pv_used += used;
            pv_curtailed += curtailed;
            grid_import += grid;

            // TOU
            const tariff = getTariffType(d, d.getHours(), d.getMinutes());
            if (tariff === 'BT') {
                pv_used_bt += used;
                pv_curtailed_bt += curtailed;
            } else if (tariff === 'CD') {
                pv_used_cd += used;
                pv_curtailed_cd += curtailed;
            }
        }
    }

    // Final summary
    const pv_used_percentage = (pv_used / total_PV) * 100;
    const pv_curtailed_percentage = (pv_curtailed / total_PV) * 100;

    let result = `
===== 16 VALUES RESULT =====
1. PV Total (kWh): ${total_PV.toFixed(0)}
2. PV Used by Loads (kWh): ${pv_used.toFixed(0)}
3. PV Used by Loads (%): ${pv_used_percentage.toFixed(2)} %
4. PV Curtailed (kWh): ${pv_curtailed.toFixed(0)}
5. PV Curtailed (%): ${pv_curtailed_percentage.toFixed(2)} %
6. Grid (kWh): ${grid_import.toFixed(0)}
7. Load Consumption (kWh): ${total_load.toFixed(0)}
8. Loss Percent (%): 0.00 % (Standard assumption)

9. PV Used - Giờ BT (kWh): ${pv_used_bt.toFixed(0)}
10. PV Used - Giờ BT (%): ${((pv_used_bt / pv_used) * 100).toFixed(2)} %
11. PV Used - Giờ CĐ (kWh): ${pv_used_cd.toFixed(0)}
12. PV Used - Giờ CĐ (%): ${((pv_used_cd / pv_used) * 100).toFixed(2)} %
13. PV Cur - Giờ BT (kWh): ${pv_curtailed_bt.toFixed(0)}
14. PV Cur - Giờ BT (%): ${((pv_curtailed_bt / pv_curtailed) * 100).toFixed(2)} %
15. PV Cur - Giờ CĐ (kWh): ${pv_curtailed_cd.toFixed(0)}
16. PV Cur - Giờ CĐ (%): ${((pv_curtailed_cd / pv_curtailed) * 100).toFixed(2)} %
=============================
`;

    console.log(result);
    fs.writeFileSync('./16_values_result.txt', result);

} catch (error) {
    console.error("Error:", error);
}
