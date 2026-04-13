const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const DB_PATH = "D:\\TOOL GOOGLE ANTIGRAVITY\\2. Tool Tính toán công suất\\1. Database\\GSA";
const MATCH_DIR = "27. Lai Châu";
const provincesFile = path.join(__dirname, 'src', 'data', 'provinces.json');

const dirPath = path.join(DB_PATH, MATCH_DIR);
if (!fs.existsSync(dirPath)) {
    console.error("Lai Chau directory still not found!");
    process.exit(1);
}

const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));
if (files.length === 0) {
    console.error("No Excel file found in Lai Chau directory!");
    process.exit(1);
}

const workbook = xlsx.readFile(path.join(dirPath, files[0]));
let pvout = null;
const mapSheet = workbook.Sheets['Map_data'] || workbook.Sheets['Map data'];
if (mapSheet) {
    const mapData = xlsx.utils.sheet_to_json(mapSheet, { header: 1 });
    for (const row of mapData) {
        if (row && typeof row[0] === 'string' && (row[0].toLowerCase().includes('specific photovoltaic') || row[0].toLowerCase().includes('pvout'))) {
            // Find the first numerical value in the row
            for (let i = 1; i < row.length; i++) {
                let val = row[i];
                if (typeof val === 'string') val = val.replace(',', ''); // e.g., "1,450.5" -> "1450.5"
                const parsed = parseFloat(val);
                if (!isNaN(parsed)) {
                    pvout = parsed;
                    break;
                }
            }
            if (pvout !== null) break;
        }
    }
}
if (!pvout || isNaN(pvout)) pvout = 1000; // ultimate fallback

let monthlyPVOUT = [];
const hourlySheetName = Object.keys(workbook.Sheets).find(s => s.toLowerCase().includes('hourly'));
if (hourlySheetName) {
    const hourlyData = xlsx.utils.sheet_to_json(workbook.Sheets[hourlySheetName], { header: 1 });
    for (let i = 0; i < Math.min(hourlyData.length, 100); i++) {
        const row = hourlyData[i];
        if (!row) continue;
        const rowStr = row.map(c => String(c).toLowerCase().trim());
        const janIdx = rowStr.indexOf('jan') !== -1 ? rowStr.indexOf('jan') : (rowStr.indexOf('january') !== -1 ? rowStr.indexOf('january') : rowStr.indexOf('1'));
        if (janIdx !== -1) {
            for (let m = 0; m < 12; m++) {
                let sumMonth = 0;
                for (let h = 0; h < 24; h++) {
                    let v = hourlyData[i + 1 + h][janIdx + m];
                    if (typeof v === 'string') v = v.replace(',', '.');
                    sumMonth += parseFloat(v) || 0;
                }
                monthlyPVOUT.push(sumMonth);
            }
            break;
        }
    }
}

if (monthlyPVOUT.length < 12) {
    monthlyPVOUT = Array(12).fill(pvout / 12 / 30);
}

const year = 2023;
let totalDistributionSum = 0;
let monthlySumsRaw = [];
for (let m = 0; m < 12; m++) {
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const rawSum = monthlyPVOUT[m] * daysInMonth / 1000;
    monthlySumsRaw.push(rawSum);
    totalDistributionSum += rawSum;
}

let scaledDist = monthlySumsRaw.map(v => Math.round((v / totalDistributionSum) * pvout));
let scaledSum = scaledDist.reduce((a, b) => a + b, 0);
if (scaledSum !== Math.round(pvout)) scaledDist[0] += Math.round(pvout) - scaledSum;

const newProv = {
    id: "lai_chau",
    name: "Lai Châu",
    peakSunHours: parseFloat((pvout / 365).toFixed(2)),
    yield_yearly: Math.round(pvout),
    monthly_distribution: scaledDist
};

const provinces = JSON.parse(fs.readFileSync(provincesFile, 'utf8'));
if (!provinces.find(p => p.id === 'lai_chau')) {
    // Insert after Lao Cai (or just push)
    const laoCaiIdx = provinces.findIndex(p => p.id === 'lao_cai');
    if (laoCaiIdx !== -1) {
        provinces.splice(laoCaiIdx + 1, 0, newProv);
    } else {
        provinces.push(newProv);
    }
    fs.writeFileSync(provincesFile, JSON.stringify(provinces, null, 2));
    console.log(`Added Lai Chau to provinces.json!`);
} else {
    console.log(`Lai Chau already exists in provinces.json!`);
}

// Generate the markdown row so we can manually add it
console.log(`| **NEW** | **Lai Châu** | ${newProv.peakSunHours} | **${newProv.yield_yearly}** |`);
