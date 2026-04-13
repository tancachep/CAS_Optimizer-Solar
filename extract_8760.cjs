const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const DB_PATH = "D:\\TOOL GOOGLE ANTIGRAVITY\\2. Tool Tính toán công suất\\1. Database\\GSA";
const publicDir = path.join(__dirname, 'public', 'data', 'gsa');
const provincesFile = path.join(__dirname, 'src', 'data', 'provinces.json');

// Ensure output dir exists
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

// Load provinces metadata
const provinces = JSON.parse(fs.readFileSync(provincesFile, 'utf8'));
const gsaDirs = fs.readdirSync(DB_PATH).filter(f => fs.statSync(path.join(DB_PATH, f)).isDirectory());

console.log(`Starting extraction for ${provinces.length} provinces...`);

let successCount = 0;
let failCount = 0;

for (const prov of provinces) {
    if (prov.id === 'vietnam_average') {
        continue;
    }

    const pName = prov.name;

    // Find matching directory
    let matchDir = gsaDirs.find(d => {
        let cleanD = d.toLowerCase().replace(/ \- /g, ' ').replace(/-/g, ' ');
        let cleanP = pName.toLowerCase().replace(/ \- /g, ' ').replace(/-/g, ' ').replace('tp hồ chí minh', 'hồ chí minh');
        return cleanD.includes(cleanP) || cleanP.includes(cleanD.replace(/^\d+\.\s*/, ''));
    });

    // Explicit matching for tricky names
    if (pName === 'TP Hồ Chí Minh') matchDir = gsaDirs.find(d => d.includes('Hồ Chí Minh'));
    if (pName === 'Huế') matchDir = gsaDirs.find(d => d.includes('Thừa Thiên Huế') || d.includes('Huế'));
    if (pName === 'Bà Rịa - Vũng Tàu') matchDir = gsaDirs.find(d => d.includes('Bà Rịa'));
    if (pName === 'Lao Cai') matchDir = gsaDirs.find(d => d.includes('Lào Cai') || d.includes('Lao Cai'));

    if (!matchDir) {
        console.error(`[WARNING] Missing GSA directory for ${pName}`);
        failCount++;
        continue;
    }

    const dirPath = path.join(DB_PATH, matchDir);
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));
    if (files.length === 0) {
        console.error(`[WARNING] No excel file in ${matchDir}`);
        failCount++;
        continue;
    }
    const filePath = path.join(dirPath, files[0]);

    try {
        const workbook = xlsx.readFile(filePath);
        const hourlySheetName = Object.keys(workbook.Sheets).find(s => s.toLowerCase().includes('hourly'));

        if (!hourlySheetName) {
            console.warn(`[WARNING] No "Hourly profiles" sheet in ${prov.name}`);
            failCount++;
            continue;
        }

        const sheet = workbook.Sheets[hourlySheetName];
        const hourlyData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        let janIdx = -1;
        let dataStartRow = -1;

        for (let i = 0; i < Math.min(hourlyData.length, 100); i++) {
            if (!hourlyData[i]) continue;
            const rowStr = hourlyData[i].map(x => String(x).toLowerCase().trim()).join('|');
            janIdx = rowStr.indexOf('jan') !== -1 ? hourlyData[i].findIndex(v => String(v).toLowerCase().includes('jan')) :
                (rowStr.indexOf('|1|') !== -1 ? hourlyData[i].findIndex(v => String(v) === '1') : -1);

            if (janIdx !== -1) {
                // Find where data actually starts
                for (let testRow = i + 1; testRow < i + 5; testRow++) {
                    if (hourlyData[testRow] && !isNaN(parseFloat(hourlyData[testRow][janIdx]))) {
                        dataStartRow = testRow;
                        break;
                    }
                }
                break;
            }
        }

        if (janIdx !== -1 && dataStartRow !== -1) {
            const avgProfiles = Array(12).fill(null).map(() => Array(24).fill(0));

            for (let h = 0; h < 24; h++) {
                let rowData = hourlyData[dataStartRow + h];
                if (!rowData) continue;
                for (let m = 0; m < 12; m++) {
                    let v = rowData[janIdx + m];
                    if (typeof v === 'string') v = String(v).replace(',', '.');
                    avgProfiles[m][h] = parseFloat(v) || 0;
                }
            }

            // Unroll into 8760 and scale to precisely match the target monthly distribution from provinces.json
            const full8760 = [];
            const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

            // Fixed jagged "cloud" multipliers to ensure spikes are visible even in averages
            const cloudProfile = [1, 1, 1, 1, 1, 1, 0.8, 1.2, 0.7, 1.3, 0.9, 1.1, 0.6, 1.4, 0.8, 1.2, 0.9, 1.1, 1, 1, 1, 1, 1, 1];

            // Daily variation factors (31 days) that average to ~1.0
            // This simulates sunny vs cloudy days for realistic curtailment math
            const dailyVariation = [
                1.3, 0.7, 1.2, 0.8, 1.1, 0.9, 1.4, 0.6, 1.2, 0.8,
                1.3, 0.7, 1.1, 0.9, 1.2, 0.8, 1.0, 1.0, 1.3, 0.7,
                1.2, 0.8, 1.1, 0.9, 1.3, 0.7, 1.0, 1.0, 1.2, 0.8, 1.1
            ];

            for (let m = 0; m < 12; m++) {
                const targetMonthSum = prov.monthly_distribution[m];
                const month8760 = [];
                let monthSimulatedSum = 0;

                for (let d = 0; d < daysInMonth[m]; d++) {
                    const dFactor = dailyVariation[d % 31];
                    for (let h = 0; h < 24; h++) {
                        let baseVal = avgProfiles[m][h];
                        // Narrow the window to 7h - 18h (Index 7 to 17)
                        if (h >= 7 && h <= 17) {
                            // Apply the fixed jagged multiplier AND the daily variation factor
                            baseVal = baseVal * (cloudProfile[h] || 1) * dFactor;
                        } else {
                            baseVal = 0;
                        }
                        month8760.push(baseVal);
                        monthSimulatedSum += baseVal;
                    }
                }

                const finalScale = monthSimulatedSum > 0 ? (targetMonthSum / monthSimulatedSum) : 0;
                for (let i = 0; i < month8760.length; i++) {
                    full8760.push(Number((month8760[i] * finalScale).toFixed(4)));
                }
            }

            const outPath = path.join(publicDir, `${prov.id}.json`);
            fs.writeFileSync(outPath, JSON.stringify(full8760));
            successCount++;
        } else {
            console.warn(`[WARNING] Could not parse hourly matrix for ${prov.name}`);
            failCount++;
        }

    } catch (e) {
        console.error(`[ERROR] Processing ${prov.name}: ${e.message}`);
        failCount++;
    }
}

console.log(`\n============================`);
console.log(`Extraction Complete!`);
console.log(`Successfully generated JSON profiles: ${successCount}`);
console.log(`Failed/Missing: ${failCount}`);
console.log(`Files saved to: ${publicDir}`);
