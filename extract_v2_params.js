import * as XLSX from 'xlsx';
import * as fs from 'fs';

const EXCEL_V2_PATH = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/SOLAR CALCULATION TOOL_V2.xlsm";
const GSA_PATH = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/TEST/RO UNIFORM/GSA_Report_RO UNIFORM.xlsx";

console.log("=== EXCEL V2 - FULL STRUCTURE ===\n");

try {
    const v2Buf = fs.readFileSync(EXCEL_V2_PATH);
    const v2Wb = XLSX.read(v2Buf, { type: 'buffer' });
    console.log("Sheets:", v2Wb.SheetNames.join(', '));

    // Dump each sheet structure
    v2Wb.SheetNames.forEach(name => {
        if (name.toLowerCase().includes('node_') || name.startsWith('_')) return;
        const sheet = v2Wb.Sheets[name];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        console.log(`\n========== Sheet: "${name}" (${data.length} rows) ==========`);

        // Show first 40 rows with all columns
        for (let i = 0; i < Math.min(data.length, 50); i++) {
            const row = data[i];
            if (row && row.some(c => c !== undefined && c !== null && c !== '')) {
                const cells = row.map((c, idx) => {
                    if (c === undefined || c === null || c === '') return '';
                    return `[${idx}]${c}`;
                }).filter(c => c !== '');
                if (cells.length > 0) {
                    console.log(`  Row ${i}: ${cells.join(' | ')}`);
                }
            }
        }
    });
} catch (e) {
    console.error("V2 Error:", e.message);
}

console.log("\n\n=== GSA MONTHLY AVERAGES ===\n");
try {
    const gsaBuf = fs.readFileSync(GSA_PATH);
    const gsaWb = XLSX.read(gsaBuf, { type: 'buffer' });

    const monthlySheet = gsaWb.Sheets['Monthly_averages'];
    if (monthlySheet) {
        const data = XLSX.utils.sheet_to_json(monthlySheet, { header: 1 });
        console.log("Monthly_averages (all rows):");
        data.forEach((row, i) => {
            if (row && row.some(c => c !== undefined && c !== null)) {
                const cells = row.map((c, idx) => {
                    if (c === undefined || c === null || c === '') return '';
                    return `[${idx}]${c}`;
                }).filter(c => c !== '');
                console.log(`  Row ${i}: ${cells.join(' | ')}`);
            }
        });
    }

    const hourlySheet = gsaWb.Sheets['Hourly_profiles'];
    if (hourlySheet) {
        const data = XLSX.utils.sheet_to_json(hourlySheet, { header: 1 });
        console.log("\nHourly_profiles (first 30 rows):");
        for (let i = 0; i < Math.min(data.length, 30); i++) {
            const row = data[i];
            if (row && row.some(c => c !== undefined && c !== null)) {
                const cells = row.map((c, idx) => {
                    if (c === undefined || c === null || c === '') return '';
                    return `[${idx}]${c}`;
                }).filter(c => c !== '');
                if (cells.length > 0) console.log(`  Row ${i}: ${cells.join(' | ')}`);
            }
        }
    }
} catch (e) {
    console.error("GSA Error:", e.message);
}
