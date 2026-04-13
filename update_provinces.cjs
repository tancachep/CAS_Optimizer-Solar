const fs = require('fs');

const markdownTable = `
| STT | Tỉnh/Thành phố | Giờ nắng (h/ngày) | PVOUT (kWh/kWp/năm) |
|:---|:---|---:|---:|
| 1 | **Việt Nam** | 3.8 | 1387 |
| 2 | **Bình Định** | 3.97 | 1449 |
| 3 | **An Giang** | 3.72 | 1356 |
| 4 | **Bắc Ninh** | 2.55 | 930 |
| 5 | **Cà Mau** | 3.53 | 1289 |
| 6 | **Cần Thơ** | 3.5 | 1279 |
| 7 | **Cao Bằng** | 3.04 | 1109 |
| 8 | **Đà Nẵng** | 3.8 | 1386 |
| 9 | **Đắk Lắk** | 3.99 | 1455 |
| 10 | **Điện Biên** | 3.69 | 1346 |
| 11 | **Đồng Nai** | 4.12 | 1505 |
| 12 | **Đồng Tháp** | 3.75 | 1370 |
| 13 | **Gia Lai** | 4.07 | 1485 |
| 14 | **Hà Nội** | 2.62 | 955 |
| 15 | **Hà Tĩnh** | 3.22 | 1176 |
| 16 | **Hải Phòng** | 2.64 | 965 |
| 17 | **Huế** | 3.49 | 1275 |
| 18 | **Hưng Yên** | 2.69 | 981 |
| 19 | **Khánh Hòa** | 4.28 | 1563 |
| 20 | **Lai Châu** | 3.52 | 1285 |
| 21 | **Lâm Đồng** | 4.4 | 1605 |
| 22 | **Lạng Sơn** | 2.8 | 1021 |
| 23 | **Lào Cai** | 3.06 | 1118 |
| 24 | **Nghệ An** | 3.46 | 1263 |
| 25 | **Ninh Bình** | 2.91 | 1063 |
| 26 | **Phú Thọ** | 2.86 | 1045 |
| 27 | **Quảng Ngãi** | 4.1 | 1498 |
| 28 | **Quảng Ninh** | 2.69 | 982 |
| 29 | **Quảng Trị** | 3.36 | 1225 |
| 30 | **Sơn La** | 3.58 | 1308 |
| 31 | **Tây Ninh** | 3.85 | 1407 |
| 32 | **Thái Nguyên** | 2.62 | 955 |
| 33 | **Thanh Hóa** | 3.2 | 1169 |
| 34 | **TP. Hồ Chí Minh** | 4.02 | 1467 |
| 35 | **Tuyên Quang** | 2.88 | 1050 |
| 36 | **Vĩnh Long** | 3.7 | 1349 |
`;

const lines = markdownTable.trim().split('\n');
const updates = {};
for (const line of lines) {
    if (!line.startsWith('|')) continue;
    const parts = line.split('|').map(s => s.trim());
    if (parts.length < 5) continue;
    const stt = parseInt(parts[1]);
    if (isNaN(stt)) continue;
    const nameStr = parts[2].replace(/\*/g, '');
    const psh = parseFloat(parts[3]);
    const pvout = parseInt(parts[4]);
    updates[nameStr] = { psh, pvout };
}

const filePath = 'd:\\TOOL GOOGLE ANTIGRAVITY\\2. Tool Tính toán công suất\\solar-optimizer\\src\\data\\provinces.json';
let provinces = JSON.parse(fs.readFileSync(filePath, 'utf8'));
let updatedCount = 0;

for (let p of provinces) {
    let targetUpdate = updates[p.name];
    if (!targetUpdate && p.name === 'Thừa Thiên Huế' && updates['Huế']) {
        targetUpdate = updates['Huế'];
    }

    if (targetUpdate) {
        if (p.peakSunHours !== targetUpdate.psh || p.yield_yearly !== targetUpdate.pvout) {
            p.peakSunHours = targetUpdate.psh;
            p.yield_yearly = targetUpdate.pvout;

            // Adjust monthly_distribution to scale up/down to match the new yield_yearly
            let oldSum = p.monthly_distribution.reduce((a, b) => a + b, 0);
            if (oldSum > 0) {
                let scale = p.yield_yearly / oldSum;
                p.monthly_distribution = p.monthly_distribution.map(v => Math.round(v * scale));
                // Adjust rounding errors
                let newSum = p.monthly_distribution.reduce((a, b) => a + b, 0);
                if (newSum !== p.yield_yearly) {
                    p.monthly_distribution[0] += (p.yield_yearly - newSum); // Add difference to Jan
                }
            }
            updatedCount++;
        }
        delete updates[p.name];
        if (p.name === 'Thừa Thiên Huế') delete updates['Huế'];
    }
}

fs.writeFileSync(filePath, JSON.stringify(provinces, null, 2));
console.log(`Updated ${updatedCount} existing provinces.`);
console.log('Unmatched items from markdown:', Object.keys(updates));
