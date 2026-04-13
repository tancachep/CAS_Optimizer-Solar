const fs = require('fs');
const filePath = 'D:\\TOOL GOOGLE ANTIGRAVITY\\2. Tool Tính toán công suất\\solar-optimizer\\src\\data\\provinces.json';

let provinces = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Check if dak_nong is already there
if (!provinces.find(p => p.id === 'dak_nong')) {
    // Dak Nong is adjacent to Dak Lak, we use similar solar profiles
    // Dak Lak has: peakSunHours: 3.99, yield_yearly: 1455
    const dakLak = provinces.find(p => p.id === 'dak_lak') || {
        "id": "dak_lak",
        "name": "Đắk Lắk",
        "peakSunHours": 3.99,
        "yield_yearly": 1455,
        "monthly_distribution": [120, 102, 137, 155, 146, 129, 128, 129, 118, 107, 94, 90]
    };

    // Create Dak Nong
    const dakNong = {
        "id": "dak_nong",
        "name": "Đắk Nông",
        "peakSunHours": dakLak.peakSunHours,
        "yield_yearly": dakLak.yield_yearly,
        "monthly_distribution": [...dakLak.monthly_distribution]
    };

    provinces.push(dakNong);

    // Sort array: Keep "vietnam_average" first, then sort alphabetically by name
    const sortedProvinces = provinces.sort((a, b) => {
        if (a.id === 'vietnam_average') return -1;
        if (b.id === 'vietnam_average') return 1;
        return a.name.localeCompare(b.name, 'vi');
    });

    fs.writeFileSync(filePath, JSON.stringify(sortedProvinces, null, 2));
    console.log(`Successfully added Đắk Nông. Total provinces: ${sortedProvinces.length} (including average)`);
} else {
    console.log("Dak Nong already exists.");
}
