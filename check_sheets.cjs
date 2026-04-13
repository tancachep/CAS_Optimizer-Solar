const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const gsaRoot = 'd:\\TOOL GOOGLE ANTIGRAVITY\\2. Tool Tính toán công suất\\1. Database\\GSA';

const provincesToCheck = [
    { id: 'an_giang', name: 'An Giang' },
    { id: 'gia_lai', name: 'Gia Lai' },
    { id: 'kon_tum', name: 'Kon Tum' },
    { id: 'lao_cai', name: 'Lao Cai' },
    { id: 'long_an', name: 'Long An' },
    { id: 'tp_ho_chi_minh', name: 'TP Hồ Chí Minh' }
];

function findExcelFile(provinceId) {
    if (!fs.existsSync(gsaRoot)) return null;
    const folders = fs.readdirSync(gsaRoot);
    const provinceNamePart = provinceId.replace(/_/g, ' ').toLowerCase();
    for (const folder of folders) {
        if (folder.toLowerCase().includes(provinceNamePart) || 
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

provincesToCheck.forEach(p => {
    const excelPath = findExcelFile(p.id);
    if (excelPath) {
        const workbook = XLSX.readFile(excelPath);
        console.log(`[${p.name}] Sheet names: ${workbook.SheetNames.join(', ')}`);
    } else {
        console.log(`[${p.name}] Excel file not found.`);
    }
});
