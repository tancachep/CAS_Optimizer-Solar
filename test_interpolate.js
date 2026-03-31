import fs from 'fs';

// Mô phỏng lại hàm interpolate30Min của Web
const interpolate30Min = (originalMap) => {
    const newMap = new Map();
    const entries = [];

    originalMap.forEach((val, key) => {
        if (key.endsWith('-0')) {
            const parts = key.split('-'); // M, D, H, 0
            const date = new Date(Date.UTC(2023, parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]), 0));
            entries.push({ time: date.getTime(), val, key });
        }
    });

    if (entries.length === 0) return originalMap;

    entries.sort((a, b) => a.time - b.time);

    entries.forEach((curr, i) => {
        newMap.set(curr.key, curr.val);
        const next = entries[i + 1];
        let val30 = curr.val;
        if (next && (next.time - curr.time) <= 3600000 * 1.5) {
            val30 = (curr.val + next.val) / 2;
        }

        // Đoạn code trên web:
        const parts = curr.key.split('-'); // M-D-H-0
        newMap.set(`${parts[0]}-${parts[1]}-${parts[2]}-30`, val30);
    });

    return newMap;
};

// Test thử 1 profile 3 giờ
const testMap = new Map();
testMap.set('0-1-9-0', 100); // 9:00 -> 100 kW
testMap.set('0-1-10-0', 150); // 10:00 -> 150 kW
testMap.set('0-1-11-0', 80); // 11:00 -> 80 kW

const interpolated = interpolate30Min(testMap);

let originalSum = 0;
testMap.forEach(v => originalSum += v); // 100 + 150 + 80 = 330 (kWh nếu là data giờ)

let newSum = 0;
let newSumEnergy = 0;
interpolated.forEach((v, k) => {
    console.log(`${k} -> ${v} kW`);
    newSum += v;
    newSumEnergy += v * 0.5; // Mỗi slot 30 mins
});

console.log(`Original Energy Sum (1h step): ${originalSum} kWh`);
console.log(`Interpolated Energy Sum (0.5h step): ${newSumEnergy} kWh`);
