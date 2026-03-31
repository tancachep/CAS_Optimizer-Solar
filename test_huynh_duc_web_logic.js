// Mô phỏng lại chính xác logic tính toán của ứng dụng Web cho Huỳnh Đức 1
const fs = require('fs');

// Mẫu Solar Profile dùng cho Web (lấy từ utils.js -> generateInstantaneousSolar)
const generateInstantaneousSolar = (date, dailyPsh) => {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const time = hour + minute / 60;

    if (time < 6 || time > 18) return 0;

    const peak = (dailyPsh * Math.PI) / 16;
    const val = peak * Math.pow(Math.sin((Math.PI * (time - 6)) / 12), 3);

    return Math.max(0, val);
};

// Đọc dữ liệu Load Profile đã extract (17520 dòng của Huỳnh Đức 1)
const loadDataRaw = fs.readFileSync('./hd_output.txt', 'utf8');
const lines = loadDataRaw.trim().split('\n');

const rawData = [];
// Skip header "Date,Time,Load_kW"
for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length === 3) {
        // Date format: DD/MM/YYYY, Time: H:mm
        const dateParts = parts[0].split('/');
        const timeParts = parts[1].split(':');

        // Use 2023 for standard year (like Web tool)
        const dateObj = new Date(2023, parseInt(dateParts[1]) - 1, parseInt(dateParts[0]), parseInt(timeParts[0]), parseInt(timeParts[1]));

        rawData.push({
            timestamp: dateObj.getTime(),
            date: dateObj,
            load: parseFloat(parts[2]) || 0
        });
    }
}

console.log(`Loaded ${rawData.length} data points.`);

// --- THÔNG SỐ HUỲNH ĐỨC 1 TRÊN WEB ---
// PV Total (Từ ảnh Web): 416,451 kWh
// Ở Web, PV = generateInstantaneousSolar * systemSize * 1.0 (loss=0)
// Tổng giờ nắng (PSH) trung bình = 4.0 (ví dụ)
// kWp = 282.72
// Tính ngược psh = 416451 / 282.72 / 365 = 4.035
const targetKwp = 282.72;
const psh = 4.0357;

const cleanData = rawData.map(d => {
    const solarUnit = generateInstantaneousSolar(d.date, psh);
    return {
        ...d,
        solarUnit,
        timeStep: 0.5 // 30 phút
    };
});

let totalSolarGen = 0;
let totalLoad = 0;
let totalUsed = 0;
let totalCurtailed = 0;

let usedBT = 0, usedCD = 0;
let curBT = 0, curCD = 0;

const getTouType = (date) => {
    const h = date.getHours();
    const m = date.getMinutes();
    const totalMin = h * 60 + m;
    const d = date.getDay();

    if (totalMin >= 22 * 60 || totalMin < 4 * 60) return 'OFF_PEAK';
    if (d !== 0) {
        if ((totalMin >= 9 * 60 + 30 && totalMin < 11 * 60 + 30) ||
            (totalMin >= 17 * 60 && totalMin < 20 * 60)) {
            return 'PEAK';
        }
    }
    return 'NORMAL';
};

// Chạy vòng lặp tính toán y hệt CalculateEnergyGeneration.js
for (let i = 0; i < cleanData.length; i++) {
    const point = cleanData[i];

    // Solar kW (thêm hệ số loss)
    // Tại Web ảnh: loss = 0.00%
    let solarPowerKw = point.solarUnit * targetKwp;
    const solarEnergy = solarPowerKw * point.timeStep;

    const loadEnergy = point.load * point.timeStep;

    totalSolarGen += solarEnergy;
    totalLoad += loadEnergy;

    const usedEnergy = Math.min(solarEnergy, loadEnergy);
    const excessSolar = Math.max(0, solarEnergy - loadEnergy);
    const curtailedEnergy = excessSolar; // Không có export

    totalUsed += usedEnergy;
    totalCurtailed += curtailedEnergy;

    const touType = getTouType(point.date);
    if (touType === 'PEAK') {
        usedCD += usedEnergy;
        curCD += curtailedEnergy;
    } else if (touType === 'NORMAL') {
        usedBT += usedEnergy;
        curBT += curtailedEnergy;
    }
}

console.log(`\n=== KẾT QUẢ MÔ PHỎNG WEB ===`);
console.log(`1. PV Total: ${totalSolarGen.toFixed(1)} kWh`);
console.log(`2. PV Used: ${totalUsed.toFixed(1)} kWh`);
console.log(`3. PV Used %: ${(totalUsed / totalSolarGen * 100).toFixed(2)} %`);
console.log(`4. Curtailed: ${totalCurtailed.toFixed(1)} kWh`);
console.log(`5. Curtailed %: ${(totalCurtailed / totalSolarGen * 100).toFixed(2)} %`);
console.log(`7. Load Total: ${totalLoad.toFixed(1)} kWh`);
console.log(`---`);
console.log(`9. Used BT (kWh): ${usedBT.toFixed(1)}`);
console.log(`10. Used BT %: ${(usedBT / totalUsed * 100).toFixed(2)}%`);
console.log(`11. Used CD (kWh): ${usedCD.toFixed(1)}`);
console.log(`12. Used CD %: ${(usedCD / totalUsed * 100).toFixed(2)}%`);
console.log(`---`);
console.log(`13. Curtailed BT (kWh): ${curBT.toFixed(1)}`);
console.log(`14. Curtailed BT %: ${(curBT / totalCurtailed * 100).toFixed(2)}%`);
console.log(`15. Curtailed CD (kWh): ${curCD.toFixed(1)}`);
console.log(`16. Curtailed CD %: ${(curCD / totalCurtailed * 100).toFixed(2)}%`);
