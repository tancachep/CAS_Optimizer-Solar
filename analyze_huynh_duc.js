import * as xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';

// Force hardcoded path to evade resolution errors
const filePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/1. Database/7. Nhà máy Huỳnh Đức/1. Load profile/HUYNH DU LOAD PROFILE (09-2024 TO 09-2025).xlsx";

const report = {};
report.readingFile = filePath;

try {
    const workbook = xlsx.readFile(filePath);
    report.sheetsFound = workbook.SheetNames;

    const targetSheetNames = ['Summary', 'Data', 'Load Profile', 'Sheet1'];
    let sheetName = targetSheetNames.find(name => workbook.SheetNames.includes(name));

    if (!sheetName) sheetName = workbook.SheetNames[0];

    report.analyzingSheet = sheetName;
    const sheet = workbook.Sheets[sheetName];

    // Convert into array
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    report.dataRows = [];
    report.potentialProfileValues = [];

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (row && row.length > 0) {
            if (i < 30) {
                report.dataRows.push({
                    rowIndex: i + 1,
                    colCount: row.length,
                    rowContent: row.slice(0, 20) // Limit to 20 columns
                });
            }

            // Look for rows with approximately 16 values (e.g. 16 hours, or some 16-element data structure)
            // Usually Load Profile has 24 hours, but let's check for any 16-ish length rows that are numbers
            const numberCount = row.filter(cell => typeof cell === 'number').length;
            if (numberCount >= 10 && numberCount <= 20) {
                report.potentialProfileValues.push({
                    rowIndex: i + 1,
                    valueCount: numberCount,
                    values: row
                });
            }
        }
    }

    // Output to JSON in the same directory as the script
    fs.writeFileSync('analyze_huynh_duc_result.json', JSON.stringify(report, null, 2), 'utf-8');
    console.log("Analysis saved successfully to analyze_huynh_duc_result.json");

} catch (error) {
    report.error = error.message;
    fs.writeFileSync('analyze_huynh_duc_result.json', JSON.stringify(report, null, 2), 'utf-8');
    console.error("Error stored to analyze_huynh_duc_result.json");
}
