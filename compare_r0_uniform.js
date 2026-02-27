import * as XLSX from 'xlsx';
import * as fs from 'fs';

// ============================================
// R0 UNIFORM: So sánh dữ liệu GSA vs Excel V2
// ============================================

const GSA_PATH = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/TEST/RO UNIFORM/GSA_Report_RO UNIFORM.xlsx";
const EXCEL_V2_PATH = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/SOLAR CALCULATION TOOL_V2.xlsm";
const LOAD_PATH = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/TEST/RO UNIFORM/3.NM_RO_Uniform_Bieu do phu tai_Them thoi gian lam viec.xlsx";

console.log("=== R0 UNIFORM COMPARISON ===\n");

// --- 1. PARSE GSA FILE ---
console.log("--- 1. GSA DATA ---");
try {
    const gsaBuf = fs.readFileSync(GSA_PATH);
    const gsaWb = XLSX.read(gsaBuf, { type: 'buffer' });
    console.log("  Sheets:", gsaWb.SheetNames.join(', '));

    // Parse Map_data sheet for metadata
    const mapSheet = gsaWb.Sheets['Map_data'] || gsaWb.Sheets['Map data'];
    if (mapSheet) {
        const mapData = XLSX.utils.sheet_to_json(mapSheet, { header: 1 });
        console.log("\n  Map Data (Key Metrics):");
        mapData.forEach(row => {
            if (row.length >= 3) {
                const key = String(row[1] || row[0]).trim();
                const val = row[2];
                const unit = row[3] || '';
                if (key && val !== undefined && val !== '') {
                    console.log(`    ${key}: ${val} ${unit}`);
                }
            }
        });
    }

    // Parse all sheets for hourly data
    gsaWb.SheetNames.forEach(sheetName => {
        const sheet = gsaWb.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Look for PVOUT, GHI, GTI headers
        console.log(`\n  Sheet: "${sheetName}" (${data.length} rows)`);

        // Find month header row
        for (let i = 0; i < Math.min(data.length, 50); i++) {
            const row = data[i];
            if (!Array.isArray(row)) continue;
            const rowStr = row.map(c => String(c || '').toLowerCase().trim());

            // Check for label rows
            if (rowStr.some(s => s.includes('pvout') || s.includes('ghi') || s.includes('gti') || s.includes('irradiation') || s.includes('photovoltaic'))) {
                console.log(`    Row ${i}: ${row.filter(c => c).join(' | ')}`);
            }

            // Check for month headers
            const janIdx = rowStr.findIndex(c => c === 'jan' || c === 'january');
            if (janIdx !== -1) {
                console.log(`    MONTH HEADER at Row ${i}: ${row.slice(0, Math.min(row.length, 15)).join(' | ')}`);

                // Extract 24 hours of data
                const hourlyData = {};
                for (let h = 0; h < 24; h++) {
                    const dRow = data[i + 1 + h];
                    if (!dRow) break;
                    const vals = [];
                    for (let m = 0; m < 12; m++) {
                        vals.push(parseFloat(dRow[janIdx + m]) || 0);
                    }
                    hourlyData[h] = vals;
                }

                // Calculate Monthly Totals
                const monthlyTotals = [];
                for (let m = 0; m < 12; m++) {
                    let total = 0;
                    for (let h = 0; h < 24; h++) {
                        if (hourlyData[h]) total += hourlyData[h][m];
                    }
                    monthlyTotals.push(total);
                }
                console.log(`    Monthly Totals: ${monthlyTotals.map(v => v.toFixed(2)).join(', ')}`);
                console.log(`    Annual Total: ${monthlyTotals.reduce((a, b) => a + b, 0).toFixed(2)}`);
            }
        }
    });
} catch (e) {
    console.error("GSA Error:", e.message);
}

// --- 2. PARSE EXCEL V2 for R0 Uniform project ---
console.log("\n\n--- 2. EXCEL V2 (SOLAR CALCULATION TOOL_V2) ---");
try {
    const v2Buf = fs.readFileSync(EXCEL_V2_PATH);
    const v2Wb = XLSX.read(v2Buf, { type: 'buffer' });
    console.log("  Sheets:", v2Wb.SheetNames.join(', '));

    // Check Project sheet for RO Uniform
    const projectSheet = v2Wb.Sheets['Project'];
    if (projectSheet) {
        const projectData = XLSX.utils.sheet_to_json(projectSheet, { header: 1 });
        console.log("\n  Projects:");
        for (let i = 0; i < Math.min(projectData.length, 30); i++) {
            const row = projectData[i];
            if (row) {
                const rowStr = row.join(' ').toLowerCase();
                if (rowStr.includes('ro') || rowStr.includes('uniform') || rowStr.includes('r0') || i < 5) {
                    console.log(`    Row ${i}: ${row.filter(c => c !== undefined && c !== null).join(' | ')}`);
                }
            }
        }
    }

    // Check Summary sheet
    const summarySheet = v2Wb.Sheets['Summary'] || v2Wb.Sheets['summary'];
    if (summarySheet) {
        const summaryData = XLSX.utils.sheet_to_json(summarySheet, { header: 1 });
        console.log("\n  Summary Sheet (first 20 rows):");
        for (let i = 0; i < Math.min(summaryData.length, 20); i++) {
            const row = summaryData[i];
            if (row && row.some(c => c !== undefined && c !== null)) {
                console.log(`    Row ${i}: ${row.filter(c => c !== undefined && c !== null).join(' | ')}`);
            }
        }
    }

    // Check for specific calculation sheets
    v2Wb.SheetNames.forEach(name => {
        if (name.toLowerCase().includes('calc') || name.toLowerCase().includes('energy') || name.toLowerCase().includes('result')) {
            const sheet = v2Wb.Sheets[name];
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            console.log(`\n  Sheet "${name}" (first 15 rows):`);
            for (let i = 0; i < Math.min(data.length, 15); i++) {
                const row = data[i];
                if (row && row.some(c => c)) console.log(`    Row ${i}: ${row.filter(c => c !== undefined && c !== null).join(' | ')}`);
            }
        }
    });
} catch (e) {
    console.error("V2 Error:", e.message);
}

// --- 3. CHECK LOAD PROFILE ---
console.log("\n\n--- 3. LOAD PROFILE DATA ---");
try {
    const loadBuf = fs.readFileSync(LOAD_PATH);
    const loadWb = XLSX.read(loadBuf, { type: 'buffer' });
    console.log("  Sheets:", loadWb.SheetNames.join(', '));

    loadWb.SheetNames.forEach(name => {
        const sheet = loadWb.Sheets[name];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        console.log(`\n  Sheet "${name}" (${data.length} rows):`);
        for (let i = 0; i < Math.min(data.length, 10); i++) {
            const row = data[i];
            if (row && row.some(c => c)) {
                const display = row.slice(0, 15).map(c => c !== undefined && c !== null ? c : '').join(' | ');
                console.log(`    Row ${i}: ${display}`);
            }
        }
    });
} catch (e) {
    console.error("Load Error:", e.message);
}

console.log("\n\n=== DONE ===");
