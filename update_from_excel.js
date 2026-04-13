const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Configuration
const baseDir = 'd:\\TOOL GOOGLE ANTIGRAVITY\\2. Tool Tính toán công suất';
const gsaRoot = path.join(baseDir, '1. Database', 'GSA');
const provincesFile = path.join(baseDir, 'solar-optimizer', 'src', 'data', 'provinces.json');

const provinces = JSON.parse(fs.readFileSync(provincesFile, 'utf8'));

// Helper to find Excel file in subdirectories
function findExcelFile(provinceId) {
    const provinceNamePart = provinceId.replace(/_/g, ' ');
    const folders = fs.readdirSync(gsaRoot);
    
    // Exact match or contains logic
    for (const folder of folders) {
        if (folder.toLowerCase().includes(provinceNamePart.toLowerCase()) || 
            (provinceId === 'tp_ho_chi_minh' && folder.includes('TP Hồ Chí Minh'))) {
            const folderPath = path.join(gsaRoot, folder);
            if (fs.lstatSync(folderPath).isDirectory()) {
                const files = fs.readdirSync(folderPath);
                const excelFile = files.find(f => f.endsWith('.xlsx') && f.includes('GSA_Report'));
                if (excelFile) return path.join(folderPath, excelFile);
            }
        }
    }
    return null;
}

console.log('--- Starting Update from GSA Excel Reports ---');

provinces.forEach(p => {
    const excelPath = findExcelFile(p.id);
    
    if (excelPath && fs.existsSync(excelPath)) {
        try {
            const workbook = XLSX.readFile(excelPath);
            const sheet = workbook.Sheets['monthly_averages'];
            
            if (!sheet) {
                console.warn(`[${p.name}] Sheet 'monthly_averages' not found.`);
                return;
            }

            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            
            // Expected Structure from screenshot:
            // B2: Yearly DNI Sum
            // B5-B16: Monthly DNI Values (Jan to Dec)
            
            const yearlyDniTotal = data[1] ? data[1][1] : 0; // B2
            const monthlyDnis = [];
            for (let i = 4; i <= 15; i++) { // Rows 5 to 16
                monthlyDnis.push(data[i] ? data[i][1] : 0); // Column B
            }

            if (yearlyDniTotal > 0 && monthlyDnis.length === 12) {
                const targetAnnualYield = p.yield_yearly;
                
                // Formula: Monthly_PVOut = (Monthly_DNI * yield_yearly) / yearlyDniTotal
                p.monthly_distribution = monthlyDnis.map(dni => Math.round((dni * targetAnnualYield) / yearlyDniTotal));
                
                // Adjust rounding difference
                const currentSum = p.monthly_distribution.reduce((a, b) => a + b, 0);
                const diff = targetAnnualYield - currentSum;
                if (diff !== 0) {
                    const maxIdx = p.monthly_distribution.indexOf(Math.max(...p.monthly_distribution));
                    p.monthly_distribution[maxIdx] += diff;
                }

                console.log(`[OK] Updated ${p.name} (Yearly DNI: ${yearlyDniTotal})`);
            } else {
                console.error(`[ERR] ${p.name}: Invalid data structure in Excel.`);
            }

        } catch (err) {
            console.error(`[ERR] ${p.name}: Failed to process Excel. ${err.message}`);
        }
    } else {
        console.warn(`[SKIP] ${p.name}: Excel file not found in Database/GSA`);
    }
});

// Final Fixes
const vinhPhuc = provinces.find(p => p.id === 'vinh_phuc');
if (vinhPhuc) vinhPhuc.icon = '⛰️';

fs.writeFileSync(provincesFile, JSON.stringify(provinces, null, 2));
console.log('\n--- Sync finished successfully! ---');
