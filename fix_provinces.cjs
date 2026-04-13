const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const provinceList = `1. Hà Nội
10. Hải Dương
11. Hưng Yên
12. Thái Bình
13. Hà Nam
14. Nam Định
15. Ninh Bình
16. Hà Giang
17. Cao Bằng
18. Bắc Kạn
19. Tuyên Quang
2. TP Hồ Chí Minh
20. Lao Cai
21. Yên Bái
22. Thái Nguyên
23. Lạng Sơn
24. Bắc Giang
25. Phú Thọ
26. Điện Biên
28. Sơn La
29. Hòa Bình
3. Hải Phòng
30. Thanh Hóa
31. Nghệ An
32. Hà Tĩnh
33. Quảng Bình
34. Quảng Trị
35. Quảng Nam
36. Quảng Ngãi
37. Bình Định
38. Phú Yên
39. Khánh Hòa
4. Đà Nẵng
40. Ninh Thuận
41. Bình Thuận
42. Kon Tum
43. Gia Lai
44. Đắk Lắk
45. Đắk Nông
46. Lâm Đồng
47. Bình Phước
48. Tây Ninh
49. Bình Dương
5. Cần Thơ
50. Đồng Nai
51. Bà Rịa - Vũng Tàu
52. Long An
53. Tiền Giang
54. Bến Tre
55. Trà Vinh
56. Vĩnh Long
57. Đồng Tháp
58. An Giang
59. Kiên Giang
6. Huế
60. Hậu Giang
61. Sóc Trăng
62. Bạc Liêu
63. Cà Mau
7. Vĩnh Phúc
8. Bắc Ninh
9. Quảng Ninh`;

const DB_PATH = "D:\\TOOL GOOGLE ANTIGRAVITY\\2. Tool Tính toán công suất\\1. Database\\GSA";

function toId(str) {
    return str.toLowerCase()
        .replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a")
        .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e")
        .replace(/ì|í|ị|ỉ|ĩ/g, "i")
        .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o")
        .replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u")
        .replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y")
        .replace(/đ/g, "d")
        .replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, "")
        .replace(/\u02C6|\u0306|\u031B/g, "")
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
}

const lines = provinceList.trim().split('\n');
const provinceNames = lines.map(line => line.split('. ')[1].trim()).sort((a, b) => a.localeCompare(b, 'vi'));

const gsaDirs = fs.readdirSync(DB_PATH).filter(f => fs.statSync(path.join(DB_PATH, f)).isDirectory());
let result = [];

result.push({
    "id": "vietnam_average",
    "name": "Việt Nam",
    "peakSunHours": 3.8,
    "yield_yearly": 1387,
    "monthly_distribution": [
        107, 79, 109, 119, 122, 111, 116, 112, 102, 100, 91, 87
    ]
});

for (const pName of provinceNames) {
    let matchDir = gsaDirs.find(d => {
        let cleanD = d.toLowerCase().replace(/ \- /g, ' ').replace(/-/g, ' ');
        let cleanP = pName.toLowerCase().replace(/ \- /g, ' ').replace(/-/g, ' ').replace('tp hồ chí minh', 'hồ chí minh');
        return cleanD.includes(cleanP) || cleanP.includes(cleanD.replace(/^\d+\.\s*/, ''));
    });

    if (pName === 'TP Hồ Chí Minh') matchDir = gsaDirs.find(d => d.includes('Hồ Chí Minh'));
    if (pName === 'Huế') matchDir = gsaDirs.find(d => d.includes('Thừa Thiên Huế') || d.includes('Huế'));
    if (pName === 'Bà Rịa - Vũng Tàu') matchDir = gsaDirs.find(d => d.includes('Bà Rịa'));
    if (pName === 'Lao Cai') matchDir = gsaDirs.find(d => d.includes('Lào Cai') || d.includes('Lao Cai'));

    let pvout = null;
    let monthlyPVOUT = [];

    if (matchDir) {
        const dirPath = path.join(DB_PATH, matchDir);
        const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.xlsx'));
        if (files.length > 0) {
            const filePath = path.join(dirPath, files[0]);
            try {
                const workbook = XLSX.readFile(filePath);
                const mapSheet = workbook.Sheets['Map_data'] || workbook.Sheets['Map data'];
                if (mapSheet) {
                    const mapData = XLSX.utils.sheet_to_json(mapSheet, { header: 1 });
                    for (const row of mapData) {
                        if (!row) continue;
                        let rowStr = row.map(String).join(' ').toLowerCase();
                        if (rowStr.includes('specific photovoltaic') || rowStr.includes('pvout')) {
                            // find first number after column 0
                            for (let i = 1; i < row.length; i++) {
                                if (row[i] !== undefined && row[i] !== null && row[i] !== '') {
                                    let v = String(row[i]).replace(',', '.');
                                    let n = parseFloat(v);
                                    if (!isNaN(n)) {
                                        pvout = n;
                                        break;
                                    }
                                }
                            }
                            if (pvout !== null) break;
                        }
                    }
                }

                const hourlySheet = workbook.Sheets['Hourly_profiles'] || workbook.Sheets['Hourly profiles'];
                if (hourlySheet) {
                    const hourlyData = XLSX.utils.sheet_to_json(hourlySheet, { header: 1 });
                    for (let i = 0; i < Math.min(hourlyData.length, 100); i++) {
                        const row = hourlyData[i];
                        if (!row) continue;
                        const rowStr = row.map(c => String(c).toLowerCase().trim());
                        const janIdx = rowStr.indexOf('jan') !== -1 ? rowStr.indexOf('jan') : (rowStr.indexOf('january') !== -1 ? rowStr.indexOf('january') : rowStr.indexOf('1'));
                        const febIdx = rowStr.indexOf('feb') !== -1 ? rowStr.indexOf('feb') : (rowStr.indexOf('february') !== -1 ? rowStr.indexOf('february') : rowStr.indexOf('2'));

                        if (janIdx !== -1 && febIdx !== -1 && febIdx > janIdx) {
                            let dataStartRow = i + 1;
                            // Find where the actual data numbers start
                            for (let testRow = i + 1; testRow < i + 5; testRow++) {
                                if (hourlyData[testRow] && !isNaN(parseFloat(hourlyData[testRow][janIdx]))) {
                                    dataStartRow = testRow;
                                    break;
                                }
                            }

                            for (let m = 0; m < 12; m++) {
                                let sumMonth = 0;
                                for (let h = 0; h < 24; h++) {
                                    let rowData = hourlyData[dataStartRow + h];
                                    let v = rowData ? rowData[janIdx + m] : 0;
                                    if (typeof v === 'string') v = String(v).replace(',', '.');
                                    sumMonth += parseFloat(v) || 0;
                                }
                                monthlyPVOUT.push(sumMonth);
                            }
                            break;
                        }
                    }
                }
            } catch (e) { }
        }
    }

    if (pvout === null) pvout = 1400; // safe fallback
    if (monthlyPVOUT.length < 12) {
        monthlyPVOUT = Array(12).fill(pvout / 12 / 30);
    }

    const year = 2023;
    let totalDistributionSum = 0;
    let monthlySumsRaw = [];
    for (let m = 0; m < 12; m++) {
        const daysInMonth = new Date(year, m + 1, 0).getDate();
        const rawSum = monthlyPVOUT[m] * daysInMonth / 1000;
        monthlySumsRaw.push(rawSum);
        totalDistributionSum += rawSum;
    }

    let scaledDist = monthlySumsRaw.map(v => Math.round((v / totalDistributionSum) * pvout));
    let scaledSum = scaledDist.reduce((a, b) => a + b, 0);
    if (scaledSum !== Math.round(pvout)) {
        scaledDist[0] += Math.round(pvout) - scaledSum;
    }

    result.push({
        id: toId(pName),
        name: pName,
        peakSunHours: parseFloat((pvout / 365).toFixed(2)),
        yield_yearly: Math.round(pvout),
        monthly_distribution: scaledDist
    });
}

// Write to JSON
fs.writeFileSync('D:\\TOOL GOOGLE ANTIGRAVITY\\2. Tool Tính toán công suất\\solar-optimizer\\src\\data\\provinces.json', JSON.stringify(result, null, 2));

// Generate Markdown Table
let md = '| STT | Tỉnh/Thành phố | Giờ nắng (h/ngày) | PVOUT (kWh/kWp/năm) |\n';
md += '|:---|:---|---:|---:|\n';
result.forEach((p, i) => {
    md += `| ${i + 1} | **${p.name}** | ${p.peakSunHours} | ${p.yield_yearly} |\n`;
});
console.log(md);
