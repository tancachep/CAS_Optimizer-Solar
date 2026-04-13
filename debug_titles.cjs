const XLSX = require('xlsx');
const filePath = "D:\\TOOL GOOGLE ANTIGRAVITY\\2. Tool Tính toán công suất\\1. Database\\GSA\\37. Bình Định\\GSA_Report_Bình Định_Province.xlsx";
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets['Hourly_profiles'] || workbook.Sheets['Hourly profiles'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log("--- TẤT CẢ CÁC TITLE TRONG HOURLY PROFILES ---");
for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row && row.length > 0 && typeof row[0] === 'string' && row[0].trim() !== '') {
        // In ra những dòng có vẻ là Text title (chỉ có 1 phần tử hoặc phần tử đầu dài)
        // và không chứa kí tự " - " (như "0 - 1", "1 - 2")
        if (row[0].length > 5 && !row[0].includes(' - ') && row[0] !== 'Sum') {
            console.log(`Dòng ${i}:`, row[0]);
        }
    }
}
