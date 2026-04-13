const XLSX = require('xlsx');
const filePath = "D:\\TOOL GOOGLE ANTIGRAVITY\\2. Tool Tính toán công suất\\1. Database\\GSA\\37. Bình Định\\GSA_Report_Bình Định_Province.xlsx";
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets['Hourly_profiles'] || workbook.Sheets['Hourly profiles'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

for (let i = 0; i < data.length; i++) {
    if (!data[i] || !Array.isArray(data[i])) continue;
    let rowStr = data[i].join(' ').toLowerCase();

    // In ra tất cả các dòng có chữ 'specific' hoặc 'pvout' hoặc 'jan'
    if (rowStr.includes('specific') || rowStr.includes('pvout')) {
        console.log(`Row ${i} (TITLE MATCH):`, data[i]);
    }
    if (rowStr.includes('jan') && rowStr.includes('feb')) {
        console.log(`Row ${i} (HEADER MATCH):`, data[i]);
    }
}
