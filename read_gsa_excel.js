const XLSX = require('xlsx');
const path = require('path');

const filePath = process.argv[2];
try {
    const workbook = XLSX.readFile(filePath);
    console.log("Sheets:", workbook.SheetNames);

    // Read the Map_data sheet (or Map data)
    const mapSheetName = workbook.SheetNames.find(s => s === 'Map_data' || s === 'Map data');
    if (mapSheetName) {
        console.log(`\n--- Sheet: ${mapSheetName} ---`);
        const mapSheet = workbook.Sheets[mapSheetName];
        const data = XLSX.utils.sheet_to_json(mapSheet, { header: 1 });
        data.slice(0, 15).forEach(row => console.log(row));
    }

    // Read the first data sheet
    const dataSheetName = workbook.SheetNames.find(s => s !== 'Map_data' && s !== 'Map data' && s !== 'Metadata');
    if (dataSheetName) {
        console.log(`\n--- Sheet: ${dataSheetName} ---`);
        const dataSheet = workbook.Sheets[dataSheetName];
        const data = XLSX.utils.sheet_to_json(dataSheet, { header: 1 });
        data.slice(0, 50).forEach(row => console.log(JSON.stringify(row)));
    }
} catch (e) {
    console.error("Error reading file:", e);
}
