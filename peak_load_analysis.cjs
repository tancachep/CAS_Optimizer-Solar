const XLSX = require('xlsx');
const path = require('path');

const filePath = path.resolve(__dirname, '../TEST/HUYNH DUC 1/HUYNHDUC1 LOAD PROFILE ( 08-2024 TO 09-2025).xlsx');
const wb = XLSX.readFile(filePath);
const ws = wb.Sheets['Template_SMD'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

// Parse data starting from row 5 (index 4): "Month/Day Hour:Minute" | Value
const dailyPeak = {};
const dailyTotal = {};

for (let i = 4; i < data.length; i++) {
    const timeStr = String(data[i][0]).trim();
    const value = Number(data[i][1]);
    if (!timeStr || isNaN(value)) continue;

    // Extract date part "M/D" from "M/D H:mm"
    const dateMatch = timeStr.match(/^(\d+\/\d+)/);
    if (!dateMatch) continue;
    const dateKey = dateMatch[1];

    if (!dailyPeak[dateKey] || value > dailyPeak[dateKey].value) {
        dailyPeak[dateKey] = { value, time: timeStr };
    }
    if (!dailyTotal[dateKey]) dailyTotal[dateKey] = { sum: 0, count: 0 };
    dailyTotal[dateKey].sum += value;
    dailyTotal[dateKey].count++;
}

// Sort by peak value descending
const sorted = Object.entries(dailyPeak)
    .sort((a, b) => b[1].value - a[1].value);

console.log('=== PHU TAI DINH THEO NGAY (TOP 20) ===\n');
console.log('Hang | Ngay       | Gio dinh       | P dinh (kW) | P TB ngay (kW)');
console.log('-----|------------|----------------|-------------|---------------');
sorted.slice(0, 20).forEach(([date, info], i) => {
    const avg = (dailyTotal[date].sum / dailyTotal[date].count).toFixed(2);
    console.log(
        `${String(i + 1).padStart(4)} | ${date.padEnd(10)} | ${info.time.padEnd(14)} | ${info.value.toFixed(2).padStart(11)} | ${avg.padStart(13)}`
    );
});

console.log('\n=== TONG KET ===');
console.log(`Tong so ngay: ${Object.keys(dailyPeak).length}`);
console.log(`Ngay phu tai cao nhat: ${sorted[0][0]} luc ${sorted[0][1].time} => ${sorted[0][1].value.toFixed(2)} kW`);
console.log(`Ngay phu tai thap nhat: ${sorted[sorted.length - 1][0]} luc ${sorted[sorted.length - 1][1].time} => ${sorted[sorted.length - 1][1].value.toFixed(2)} kW`);

// Peak by month
const monthlyPeak = {};
sorted.forEach(([date, info]) => {
    const month = date.split('/')[0];
    if (!monthlyPeak[month] || info.value > monthlyPeak[month].value) {
        monthlyPeak[month] = { value: info.value, date, time: info.time };
    }
});

console.log('\n=== PHU TAI DINH THEO THANG ===');
console.log('Thang | Ngay dinh  | Gio          | P dinh (kW)');
console.log('------|------------|--------------|------------');
Object.entries(monthlyPeak)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .forEach(([month, info]) => {
        console.log(`  ${month.padStart(3)}  | ${info.date.padEnd(10)} | ${info.time.padEnd(12)} | ${info.value.toFixed(2).padStart(10)}`);
    });
