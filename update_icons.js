const fs = require('fs');

const provinceIcons = {
    "An Giang": "🌳🛶",
    "Bà Rịa - Vũng Tàu": "🗼🌊",
    "Bạc Liêu": "🌬️🎸",
    "Bắc Giang": "🌳🥭",
    "Bắc Kạn": "🛶🏞️",
    "Bắc Ninh": "🎤🎶",
    "Bến Tre": "🥥🌴",
    "Bình Dương": "🏺🏭",
    "Bình Định": "🥋🌊",
    "Bình Phước": "🥜🌳",
    "Bình Thuận": "🏜️🚙",
    "Cà Mau": "🦀🚤",
    "Cao Bằng": "🌊🏞️",
    "Cần Thơ": "🛶🍉",
    "Đà Nẵng": "🐉🌉",
    "Đắk Lắk": "🐘☕",
    "Đắk Nông": "🌊🌲",
    "Điện Biên": "🎖️⛰️",
    "Đồng Nai": "🏞️🏭",
    "Đồng Tháp": "🪷🐦",
    "Gia Lai": "🏞️☕",
    "Hà Giang": "🚩⛰️",
    "Hà Nam": "🛕⛰️",
    "Hà Nội": "🐢🍜",
    "Hà Tĩnh": "⛰️🌊",
    "Hải Dương": "🍒🌳",
    "Hải Phòng": "🌺⚓",
    "Hậu Giang": "🌾🍍",
    "Hòa Bình": "⚡🏞️",
    "Hưng Yên": "🍈🌳",
    "Khánh Hòa": "🏖️🦞",
    "Kiên Giang": "🏝️🦪",
    "Kon Tum": "🛖⛰️",
    "Lai Châu": "🛣️⛰️",
    "Lâm Đồng": "🌲🍓",
    "Lạng Sơn": "🍑🏔️",
    "Lào Cai": "❄️🚠",
    "Long An": "🍉🛣️",
    "Nam Định": "⛪🍲",
    "Nghệ An": "🪷🏠",
    "Ninh Bình": "🛶⛰️",
    "Ninh Thuận": "🍇☀️",
    "Phú Thọ": "🛕🥁",
    "Phú Yên": "🪨🌊",
    "Quảng Bình": "🕳️🦇",
    "Quảng Nam": "🏮🏘️",
    "Quảng Ngãi": "🧄🏝️",
    "Quảng Ninh": "⛵⛰️",
    "Quảng Trị": "🏰🕊️",
    "Sóc Trăng": "🦇🛕",
    "Sơn La": "🐄🥛",
    "Tây Ninh": "⛰️🛕",
    "Thái Bình": "🌾🍚",
    "Thái Nguyên": "🍵🍃",
    "Thanh Hóa": "🌉🥓",
    "Thừa Thiên Huế": "🏯👘",
    "Tiền Giang": "🍜🛥️",
    "TP. Hồ Chí Minh": "🏙️🛵",
    "Trà Vinh": "🌳🛕",
    "Tuyên Quang": "🏮🏞️",
    "Vĩnh Long": "🍊🛶",
    "Vĩnh Phúc": "🌫️🏔️",
    "Yên Bái": "🌾🌄"
};

// Aliases for some provinces that might have slightly different names in the JSON (e.g. Huế vs Thừa Thiên Huế, Lao Cai vs Lào Cai)
const aliases = {
    "Huế": "Thừa Thiên Huế",
    "Lao Cai": "Lào Cai"
};

try {
    const dataPath = 'd:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/solar-optimizer/src/data/provinces.json';
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const provinces = JSON.parse(rawData);

    let updatedCount = 0;

    // Some Vietnamese chars might be slightly different.
    const normalize = (str) => {
        return str.normalize('NFC').replace(/ /g, '').toLowerCase();
    };

    const iconMapNormalized = {};
    for (const [name, icon] of Object.entries(provinceIcons)) {
        iconMapNormalized[normalize(name)] = icon;
    }

    const updatedProvinces = provinces.map(p => {
        let nameToMatch = p.name;
        if (aliases[nameToMatch]) {
            nameToMatch = aliases[nameToMatch];
        } else if (nameToMatch === 'Việt Nam') {
            return { ...p, icon: "🇻🇳" }; // Add an icon for the whole country as well
        }

        const icon = provinceIcons[nameToMatch] || iconMapNormalized[normalize(nameToMatch)];

        if (icon) {
            updatedCount++;
            return {
                ...p,
                icon
            };
        } else {
            console.log("Could not find icon for:", p.name);
            return p;
        }
    });

    fs.writeFileSync(dataPath, JSON.stringify(updatedProvinces, null, 2), 'utf8');
    console.log(`Updated ${updatedCount} provinces correctly.`);

} catch (e) {
    console.error(e);
}
