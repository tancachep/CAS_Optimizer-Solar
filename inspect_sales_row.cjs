const XLSX = require('xlsx');
const path = require('path');

const filePath = process.argv[2];
const targetProject = "VUBD - TRAI TOM".toLowerCase();

try {
    const workbook = XLSX.readFile(filePath);
    const overviewSheetName = workbook.SheetNames.find(s => s.toLowerCase().includes('overview'));

    if (overviewSheetName) {
        const sheet = workbook.Sheets[overviewSheetName];
        // Use a wide range to ensure we capture all columns even if some are empty
        const range = XLSX.utils.decode_range(sheet['!ref']);
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: range, defval: null });

        let projectRowIndex = -1;
        for (let i = 0; i < data.length; i++) {
            const rowStr = data[i].map(c => String(c).toLowerCase()).join(' ');
            if (rowStr.includes(targetProject)) {
                projectRowIndex = i;
                break;
            }
        }

        if (projectRowIndex !== -1) {
            console.log(`\n--- Dữ liệu thô xung quanh dòng ${projectRowIndex + 1} ---`);
            // Print a few rows around the target to understand the structure (merged cells, etc.)
            for (let i = Math.max(0, projectRowIndex - 2); i <= Math.min(data.length - 1, projectRowIndex + 2); i++) {
                console.log(`Row ${i + 1}:`, data[i].slice(0, 30)); // Print up to 30 columns
            }

            console.log("\n--- Chi tiết dòng dự án ---");
            const headers = data[2] || data[1] || data[0] || []; // Guessing header row
            const headerRow2 = data[3] || []; // Sometimes headers take 2 rows

            data[projectRowIndex].forEach((val, idx) => {
                let colName = headers[idx] ? String(headers[idx]).replace(/\r\n/g, ' ') : '';
                if (headerRow2[idx] && String(headerRow2[idx]).trim() !== '') {
                    colName += ' ' + String(headerRow2[idx]).replace(/\r\n/g, ' ');
                }
                if (!colName) colName = `Cột ${idx + 1}`;

                if (val !== null && val !== '') {
                    console.log(`[Col ${idx}] ${colName}: ${val}`);
                }
            });
        } else {
            console.log(`Không tìm thấy dự án nào chứa tên '${targetProject}'.`);
        }
    }
} catch (e) {
    console.error("Lỗi:", e.message);
}
