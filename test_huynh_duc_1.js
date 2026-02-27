const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join('d:', 'TOOL GOOGLE ANTIGRAVITY', '2. Tool Tính toán công suất', 'TEST', 'HUYNH DUC 1', 'HUYNHDUC1 LOAD PROFILE ( 08-2024 TO 09-2025).xlsx');

console.log(`Reading file: ${filePath}`);

try {
    const workbook = xlsx.readFile(filePath);
    console.log('Sheets found:', workbook.SheetNames);

    // Try to find the summary or main data sheet
    const targetSheetNames = ['Summary', 'Data', 'Load Profile', 'Sheet1'];
    let sheetName = targetSheetNames.find(name => workbook.SheetNames.includes(name));

    if (!sheetName) {
        sheetName = workbook.SheetNames[0]; // Fallback to first sheet
    }

    console.log(`Analyzing sheet: ${sheetName}`);
    const sheet = workbook.Sheets[sheetName];

    // Convert sheet to JSON for easier inspection
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // Basic analysis for 16 values
    // We'll print the first 20 rows and looking for arrays of length ~16 or specific markers
    console.log('\n--- Exploring Data Structure ---');
    let dataCount = 0;
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (row && row.length > 0) {
            if (dataCount < 20) {
                console.log(`Row ${i + 1} (${row.length} cols): ${JSON.stringify(row).substring(0, 120)}...`);
            }
            dataCount++;
        }
    }
} catch (error) {
    console.error('Error reading the Excel file:', error.message);
}
