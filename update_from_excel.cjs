const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Configuration
const baseDir = 'd:\\TOOL GOOGLE ANTIGRAVITY\\2. Tool Tính toán công suất';
const gsaRoot = path.join(baseDir, '1. Database', 'GSA');
const provincesFile = path.join(baseDir, 'solar-optimizer', 'src', 'data', 'provinces.json');

if (!fs.existsSync(provincesFile)) {
    console.error('File provinces.json not found at:', provincesFile);
    process.exit(1);
}

const provinces = JSON.parse(fs.readFileSync(provincesFile, 'utf8'));

// Normalization function to remove Vietnamese accents
function removeAccents(str) {
    if (!str) return '';
    return str.normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/đ/g, 'd')
              .replace(/Đ/g, 'D')
              .toLowerCase();
}

// Helper to find Excel file in subdirectories
function findExcelFile(provinceId, provinceName) {
    if (!fs.existsSync(gsaRoot)) return null;
    const folders = fs.readdirSync(gsaRoot);
    
    // Normalize targets
    const normId = removeAccents(provinceId.replace(/_/g, ' '));
    const normName = removeAccents(provinceName);
    
    for (const folder of folders) {
        const normFolder = removeAccents(folder);
        // Match if folder contains normalized ID or Name
        if (normFolder.includes(normId) || normFolder.includes(normName) ||
            (provinceId === 'tp_ho_chi_minh' && normFolder.includes('ho chi minh'))) {
            
            const folderPath = path.join(gsaRoot, folder);
            if (fs.lstatSync(folderPath).isDirectory()) {
                const files = fs.readdirSync(folderPath);
                // Find GSA Report excel
                const excelFile = files.find(f => f.endsWith('.xlsx') && f.includes('GSA_Report'));
                if (excelFile) return path.join(folderPath, excelFile);
            }
        }
    }
    return null;
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

console.log('--- Starting Update from GSA Excel Reports (Ultra Robust Mode) ---');

let successCount = 0;
let skipCount = 0;

provinces.forEach(p => {
    // Skip the "viet_nam" placeholder entry if it doesn't have an Excel
    if (p.id === 'viet_nam') {
        skipCount++;
        return;
    }

    const excelPath = findExcelFile(p.id, p.name);
    
    if (excelPath && fs.existsSync(excelPath)) {
        try {
            const workbook = XLSX.readFile(excelPath);
            const targetSheetName = workbook.SheetNames.find(s => s.toLowerCase() === 'monthly_averages');
            const sheet = targetSheetName ? workbook.Sheets[targetSheetName] : null;
            
            if (!sheet) {
                console.warn(`[${p.name}] Sheet 'monthly_averages' not found.`);
                return;
            }

            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            const monthlyDnis = Array(12).fill(0);
            let yearlyDniTotal = 0;
            let foundCount = 0;

            data.forEach(row => {
                if (row && row[0]) {
                    const label = String(row[0]).trim();
                    const monthIdx = months.indexOf(label);
                    if (monthIdx !== -1) {
                        const val = typeof row[1] === 'number' ? row[1] : parseFloat(row[1]);
                        monthlyDnis[monthIdx] = val || 0;
                        foundCount++;
                    } else if (label.toLowerCase() === 'yearly') {
                        const val = typeof row[1] === 'number' ? row[1] : parseFloat(row[1]);
                        yearlyDniTotal = val || 0;
                    }
                }
            });

            if (yearlyDniTotal === 0) {
                yearlyDniTotal = monthlyDnis.reduce((a, b) => a + b, 0);
            }

            if (foundCount === 12 && yearlyDniTotal > 0) {
                const targetAnnualYield = p.yield_yearly;
                p.monthly_distribution = monthlyDnis.map(dni => Math.round((dni * targetAnnualYield) / yearlyDniTotal));
                
                const currentSum = p.monthly_distribution.reduce((a, b) => a + b, 0);
                const diff = targetAnnualYield - currentSum;
                if (diff !== 0) {
                    const maxIdx = p.monthly_distribution.indexOf(Math.max(...p.monthly_distribution));
                    p.monthly_distribution[maxIdx] += diff;
                }

                console.log(`[OK] Updated ${p.name} (DNI: ${yearlyDniTotal.toFixed(1)})`);
                successCount++;
            } else {
                console.error(`[ERR] ${p.name}: Invalid structure. Found ${foundCount} months.`);
            }

        } catch (err) {
            console.error(`[ERR] ${p.name}: ${err.message}`);
        }
    } else {
        console.warn(`[SKIP] ${p.name}: No matching folder or GSA Report found.`);
        skipCount++;
    }
});

// Final Fixes
const vinhPhuc = provinces.find(p => p.id === 'vinh_phuc');
if (vinhPhuc) vinhPhuc.icon = '⛰️';

fs.writeFileSync(provincesFile, JSON.stringify(provinces, null, 2));
console.log(`\n--- Finished! Success: ${successCount}, Skipped: ${skipCount} ---`);
