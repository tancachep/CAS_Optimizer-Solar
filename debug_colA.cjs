const XLSX = require('xlsx');
const filePath = "D:\\TOOL GOOGLE ANTIGRAVITY\\2. Tool Tính toán công suất\\1. Database\\GSA\\37. Bình Định\\GSA_Report_Bình Định_Province.xlsx";
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets['Hourly_profiles'] || workbook.Sheets['Hourly profiles'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

for (let i = 0; i < 200; i++) { // Print first 200 rows Col A
    if (data[i] && data[i][0]) {
        if (typeof data[i][0] === 'string' && data[i][0].length > 4 && !data[i][0].includes(' - ') && !data[i][0].includes('Sum')) {
            console.log(`Row ${i}:`, data[i][0]);
        }
    }
}
