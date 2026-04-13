const fs = require('fs');
const XLSX = require('xlsx');

const filePath = "D:\\TOOL GOOGLE ANTIGRAVITY\\2. Tool Tính toán công suất\\1. Database\\GSA\\37. Bình Định\\GSA_Report_Bình Định_Province.xlsx";
const workbook = XLSX.readFile(filePath);

// 1. Get PVOUT from Map_data
const mapSheet = workbook.Sheets['Map_data'] || workbook.Sheets['Map data'];
const mapData = XLSX.utils.sheet_to_json(mapSheet, { header: 1 });
let pvout = 0;
for (const row of mapData) {
    if (row && typeof row[0] === 'string' && row[0].toLowerCase().includes('pvout')) {
        pvout = parseFloat(row[1]);
        break;
    }
}
if (pvout === 0) pvout = 1448.5; // Fallback from our previous session

// 2. Get DNI distribution to shape the synthetic curve
const hourlySheet = workbook.Sheets['Hourly_profiles'] || workbook.Sheets['Hourly profiles'];
const hourlyData = XLSX.utils.sheet_to_json(hourlySheet, { header: 1 });

let monthlyPVOUT = [];
let foundData = false;
for (let i = 0; i < hourlyData.length - 24; i++) {
    const row = hourlyData[i];
    if (!row) continue;

    // Check if row has Jan and Feb (headers)
    const rowStr = row.map(c => String(c).toLowerCase());
    const janIdx = rowStr.indexOf('jan');

    if (janIdx !== -1 && rowStr.indexOf('feb') !== -1) {
        // We found a header row. Let's read the 12 columns below it.
        for (let m = 0; m < 12; m++) {
            let sumMonth = 0;
            for (let h = 0; h < 24; h++) {
                let v = hourlyData[i + 1 + h][janIdx + m];
                if (typeof v === 'string') v = v.replace(',', '.');
                sumMonth += parseFloat(v) || 0;
            }
            monthlyPVOUT.push(sumMonth);
        }
        foundData = true;
        break; // DNI is usually the first table
    }
}

// Normalize the distribution to match pvout exactly
const year = new Date().getFullYear();
let totalDistributionSum = 0;
let monthlySumsRaw = [];

for (let m = 0; m < 12; m++) {
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const rawSum = monthlyPVOUT[m] * daysInMonth;
    monthlySumsRaw.push(rawSum);
    totalDistributionSum += rawSum;
}

const monthlyDistScaled = monthlySumsRaw.map(v => Math.round(v / totalDistributionSum * pvout));


const provinceObj = {
    id: "binh_dinh",
    name: "Bình Định",
    peakSunHours: parseFloat((pvout / 365).toFixed(2)),
    yield_yearly: Math.round(pvout),
    monthly_distribution: monthlyDistScaled
};

console.log(JSON.stringify(provinceObj, null, 2));
