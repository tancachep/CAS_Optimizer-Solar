const XLSX = require('xlsx');
const path = require('path');

const filePath = process.argv[2];
const targetProject = "VUBD - TRAI TOM".toLowerCase();

try {
    const workbook = XLSX.readFile(filePath);

    // Find Overview sheet
    const overviewSheetName = workbook.SheetNames.find(s => s.toLowerCase().includes('overview'));

    if (overviewSheetName) {
        console.log(`\n--- Sheet: ${overviewSheetName} ---`);
        const sheet = workbook.Sheets[overviewSheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Find row with target project
        let projectRowIndex = -1;
        for (let i = 0; i < data.length; i++) {
            const rowStr = data[i].map(c => String(c).toLowerCase()).join(' ');
            if (rowStr.includes(targetProject)) {
                projectRowIndex = i;
                break;
            }
        }

        if (projectRowIndex !== -1) {
            console.log(`Found Project at Row ${projectRowIndex + 1}:`);
            // In ra các thông số xung quanh (header và data)
            // Đa số file tracker của C&I sẽ theo cột

            // In dòng header (giả sử header ở trên cùng, dòng 0 hoặc 1, 2)
            for (let h = 0; h < 3; h++) {
                if (data[h] && data[h].length > 0) {
                    console.log("Header:", data[h].filter(x => x !== null && x !== undefined));
                    break; // In 1 dòng header là đủ
                }
            }

            // In cụ thể dòng dữ liệu của dự án
            console.log("\nData:", data[projectRowIndex]);

            // In theo cặp Key: Value để dễ nhìn
            console.log("\n--- Chi tiết ---");
            const headers = data[0] || data[1] || data[2] || [];
            data[projectRowIndex].forEach((val, idx) => {
                const colName = headers[idx] || `Cột ${idx + 1}`;
                if (val !== undefined && val !== null && val !== '') {
                    console.log(`${colName}: ${val}`);
                }
            });

        } else {
            console.log(`Không tìm thấy dự án nào chứa tên '${targetProject}' trong sheet ${overviewSheetName}.`);
        }

    } else {
        console.log("Không tìm thấy sheet nào tên Overview.");
        console.log("Các sheet có sẵn:", workbook.SheetNames);
    }
} catch (e) {
    console.error("Lỗi đọc file:", e.message);
}
