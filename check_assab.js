import xlsx from 'xlsx';

const filePath = 'd:\\TOOL GOOGLE ANTIGRAVITY\\2. Tool Tính toán công suất\\1. Database\\Make_Template_ASSAB.xlsx';

try {
    console.log(`Reading file: ${filePath}`);
    const workbook = xlsx.readFile(filePath);

    console.log('Sheet Names:');
    workbook.SheetNames.forEach(sheetName => {
        console.log(`- ${sheetName}`);

        // Read the first few rows of each sheet to understand its structure
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet, { header: 1, range: 0 }); // Read top rows

        // Print first 10 rows to get a good idea of headers
        const numRows = Math.min(10, data.length);
        if (numRows > 0) {
            console.log(`  Preview (first ${numRows} rows):`);
            for (let i = 0; i < numRows; i++) {
                console.log(`    Row ${i}: ${JSON.stringify(data[i])}`);
            }
        } else {
            console.log('  (Empty sheet)');
        }
        console.log('');
    });
} catch (error) {
    console.error('Error reading the Excel file:', error.message);
}
