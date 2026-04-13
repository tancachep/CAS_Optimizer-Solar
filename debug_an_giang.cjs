const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const gsaRoot = 'd:\\TOOL GOOGLE ANTIGRAVITY\\2. Tool Tính toán công suất\\1. Database\\GSA';

function findExcelFile(provinceId) {
    if (!fs.existsSync(gsaRoot)) return null;
    const folders = fs.readdirSync(gsaRoot);
    const provinceNamePart = provinceId.replace(/_/g, ' ').toLowerCase();
    for (const folder of folders) {
        if (folder.toLowerCase().includes(provinceNamePart)) {
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

const provinceId = 'an_giang';
const excelPath = findExcelFile(provinceId);

if (excelPath) {
    const workbook = XLSX.readFile(excelPath);
    const targetSheetName = workbook.SheetNames.find(s => s.toLowerCase() === 'monthly_averages');
    const sheet = workbook.Sheets[targetSheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    console.log(`--- Data for ${provinceId} ---`);
    data.slice(0, 20).forEach((row, idx) => {
        console.log(`Row ${idx + 1}:`, row);
    });
} else {
    console.log('File not found for An Giang');
}
