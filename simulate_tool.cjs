const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// 1. Data từ User
const capacities = [235.6, 327.36, 406.72];
const monthlyBill = [249600, 217300, 211500, 160300, 129500, 126600, 142600, 155600, 153600, 176300, 158600, 221300];
const totalLoad = monthlyBill.reduce((a, b) => a + b, 0);

// Giả định năm không nhuận (365 ngày)
const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// 2. Chức năng xác định TOU (Giờ Bình Thường, Giờ Cao Điểm, Giờ Thấp Điểm)
// Giả định ngày 1/1 là Thứ 2 (hoặc một mốc cố định) để map với Chủ Nhật. 
// Trong thực tế, chuẩn năng lượng thường giả định năm có phân bố đều, nhưng ta dùng 1/1/2024 (Thứ 2) làm gốc cho 365 ngày.
function getTouPeriod(dayOfYear, hour) {
    const isSunday = (dayOfYear % 7) === 6; // Nếu 1/1 (day 0) là Monday -> day 6 là Sunday.

    if (isSunday) {
        if (hour >= 4 && hour < 22) return 'BT';
        return 'TD';
    } else {
        if ((hour >= 9 && hour < 11) && (hour === 9 ? 30 : 0) >= 0) {
            // Giản lược: 9:30 - 11:30. Tính theo giờ trọn: 
            // Giờ 9 (9h-10h): 9:00-9:30 BT, 9:30-10:00 CD -> Ta tính xấp xỉ tỉ lệ hoặc chia chính xác nếu cần.
            // Để dễ, giả sử trong Tool hourly_profile, 9 là 9h-10h. 
        }
        // Để khớp với Tool hiện tại, Tool thường gán:
        // CĐ: 9-11 (tính 2 giờ: 9, 10) và 17-20 (tính 3 giờ: 17, 18, 19). => Total 5 giờ. 
        // Thực tế EVN là 9:30-11:30. Lệch nửa giờ. 
        // Hãy code chính xác theo múi giờ: CĐ = [9, 10, 17, 18, 19]
        if (hour === 9 || hour === 10 || hour === 17 || hour === 18 || hour === 19) return 'CD';
        if (hour >= 4 && hour < 22) return 'BT';
        return 'TD';
    }
}

// 3. Đọc dữ liệu GSA Bình Định (File Province để lấy ma trận giờ)
function getGsaHourlyProfile() {
    const filePath = "D:\\TOOL GOOGLE ANTIGRAVITY\\2. Tool Tính toán công suất\\1. Database\\GSA\\37. Bình Định\\GSA_Report_Bình Định_Province.xlsx";
    const workbook = XLSX.readFile(filePath);
    const hourlySheetMatch = workbook.SheetNames.find(s => s === 'Hourly_profiles' || s === 'Hourly profiles');

    let pvoutHourly = new Array(8760).fill(0);

    if (hourlySheetMatch) {
        const sheet = workbook.Sheets[hourlySheetMatch];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        let startRow = -1;
        // Quét từng khối dữ liệu trong sheet Hourly
        for (let i = 0; i < data.length; i++) {
            if (!data[i] || !Array.isArray(data[i])) continue;
            let rowStr = data[i].join(' ').toLowerCase(); // Dùng khoảng trắng join để không bị dính chữ

            // Tìm tiêu đề bảng có chữ PVOUT hoặc Specific...
            if (rowStr.includes('pvout') || rowStr.includes('specific photovoltaic')) {
                // Di chuyển xuống dưới vài dòng để tìm header Jan, Feb...
                for (let j = i + 1; j < data.length; j++) {
                    if (!data[j]) continue;
                    let hStr = data[j].join(' ').toLowerCase();
                    if (hStr.includes('jan') && hStr.includes('feb')) {
                        startRow = j;
                        break;
                    }
                }
                break;
            }
        }

        if (startRow !== -1) {
            let matrixStart = startRow + 1; // Nhảy qua dòng Jan, Feb để vào số liệu (0 - 1)
            let hourIndex = 0;
            for (let month = 0; month < 12; month++) {
                for (let day = 0; day < daysInMonth[month]; day++) {
                    for (let h = 0; h < 24; h++) {
                        let rowData = data[matrixStart + h];
                        let val = 0;
                        if (rowData && rowData[1 + month] !== undefined) {
                            val = parseFloat(rowData[1 + month]);
                        }
                        if (isNaN(val)) val = 0;

                        // Đơn vị trong bảng GSA là Wh/kWp, chia 1000 chuyển thành kWh/kWp
                        pvoutHourly[hourIndex++] = val / 1000;
                    }
                }
            }
        } else {
            console.log("CẢNH BÁO: Không tìm thấy khối 'Specific photovoltaic' trong sheet Hourly_profiles!");
        }
    }
    return pvoutHourly;
}

const pvoutProfile1kWp = getGsaHourlyProfile();

// 4. Tạo Load Profile (24/24)
let loadProfile8760 = new Array(8760).fill(0);
let idx = 0;
for (let m = 0; m < 12; m++) {
    const days = daysInMonth[m];
    // Tải trọng đều đặn 24/24 mỗi giờ trong tháng:
    const hourlyLoad = monthlyBill[m] / (days * 24);
    for (let d = 0; d < days; d++) {
        for (let h = 0; h < 24; h++) {
            loadProfile8760[idx++] = hourlyLoad;
        }
    }
}

// 5. Mô phỏng 3 kịch bản
const results = [];

capacities.forEach(cap => {
    let pvTotal = 0;
    let pvUsed = 0;
    let grid = 0;
    let pvCurtailed = 0;

    let pvUsedBT = 0;
    let pvUsedCD = 0;
    let pvCurBT = 0;
    let pvCurCD = 0;

    for (let i = 0; i < 8760; i++) {
        let pvE = pvoutProfile1kWp[i] * cap;
        let loadE = loadProfile8760[i];

        pvTotal += pvE;

        let used = Math.min(pvE, loadE);
        let cur = pvE - used;
        let bought = loadE - used;

        pvUsed += used;
        pvCurtailed += cur;
        grid += bought;

        // Split by TOU
        let dayOfYear = Math.floor(i / 24);
        let hour = i % 24;
        let tou = getTouPeriod(dayOfYear, hour);

        if (tou === 'BT') {
            pvUsedBT += used;
            pvCurBT += cur;
        } else if (tou === 'CD') {
            pvUsedCD += used;
            pvCurCD += cur;
        }
        // Giờ thấp điểm (TD) ban đêm ko có nắng nên bỏ qua
    }

    results.push({
        Case: `VUBD - ${cap}kWp`,
        kWp: cap,
        "PV Total (kWh)": pvTotal,
        "PV Used by Loads (kWh)": pvUsed,
        "PV Used by Loads (%)": (pvUsed / pvTotal) * 100,
        "PV Curtailed (kWh)": pvCurtailed,
        "PV Curtailed (%)": (pvCurtailed / pvTotal) * 100,
        "Grid (kWh)": grid,
        "Load Consumption (kWh)": totalLoad,
        "PV Used - Giờ BT (kWh)": pvUsedBT,
        "PV Used - Giờ BT (%)": (pvUsedBT / pvUsed) * 100,
        "PV Used - Giờ CĐ (kWh)": pvUsedCD,
        "PV Used - Giờ CĐ (%)": (pvUsedCD / pvUsed) * 100,
        "PV Cur - Giờ BT (kWh)": pvCurBT,
        "PV Cur - Giờ BT (%)": pvCurtailed > 0 ? (pvCurBT / pvCurtailed) * 100 : 0,
        "PV Cur - Giờ CĐ (kWh)": pvCurCD,
        "PV Cur - Giờ CĐ (%)": pvCurtailed > 0 ? (pvCurCD / pvCurtailed) * 100 : 0,
    });
});

// Chuyển kết quả ra Markdown Table
console.log("| Thông số | Kịch Bản 1 (Tool) | Kịch Bản 2 (Tool) | Kịch Bản 3 (Tool) |");
console.log("|---|---|---|---|");

const keys = Object.keys(results[0]);
keys.forEach(key => {
    let r1 = results[0][key];
    let r2 = results[1][key];
    let r3 = results[2][key];

    let f1 = typeof r1 === 'number' ? (key.includes('%') ? r1.toFixed(1) + '%' : r1.toLocaleString('en-US', { maximumFractionDigits: 0 })) : r1;
    let f2 = typeof r2 === 'number' ? (key.includes('%') ? r2.toFixed(1) + '%' : r2.toLocaleString('en-US', { maximumFractionDigits: 0 })) : r2;
    let f3 = typeof r3 === 'number' ? (key.includes('%') ? r3.toFixed(1) + '%' : r3.toLocaleString('en-US', { maximumFractionDigits: 0 })) : r3;

    console.log(`| **${key}** | ${f1} | ${f2} | ${f3} |`);
});
