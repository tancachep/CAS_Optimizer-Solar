const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const provincesJsonPath = path.join(__dirname, 'src', 'data', 'provinces.json');
const gsaDirPath = 'D:\\TOOL GOOGLE ANTIGRAVITY\\2. Tool Tính toán công suất\\1. Database\\GSA';

const provincesData = JSON.parse(fs.readFileSync(provincesJsonPath, 'utf8'));

// Create a map for easy lookup by normalized name
function normalizeName(name) {
    return name.toLowerCase().replace(/[\s\-]/g, '').replace(/đ/g, 'd')
        .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
        .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
        .replace(/[ìíịỉĩ]/g, 'i')
        .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
        .replace(/[ùúụủũưừứựửữ]/g, 'u')
        .replace(/[ỳýỵỷỹ]/g, 'y')
        .replace('tp.', 'tp');
}

const toolDataMap = {};
provincesData.forEach(p => {
    toolDataMap[normalizeName(p.name)] = p;
});
// Special aliases
toolDataMap[normalizeName('TP Hồ Chí Minh')] = toolDataMap[normalizeName('TP. Hồ Chí Minh')];
toolDataMap[normalizeName('Bà Rịa - Vũng Tàu')] = toolDataMap[normalizeName('Bà Rịa Vũng Tàu')] || toolDataMap[normalizeName('Ba Ria Vung Tau')];

const folders = fs.readdirSync(gsaDirPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

const results = [];

folders.forEach(folder => {
    const folderPath = path.join(gsaDirPath, folder);
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));
    if (files.length === 0) return;

    // Extract province name from folder (e.g., "1. Hà Nội" -> "Hà Nội")
    const match = folder.match(/^\d+\.\s*(.+)$/);
    const provName = match ? match[1] : folder;

    const filePath = path.join(folderPath, files[0]);
    try {
        const workbook = XLSX.readFile(filePath);
        const mapSheetName = workbook.SheetNames.find(s => s === 'Map_data' || s === 'Map data');

        // NEW METRIC: PVOUT instead of GHI
        let gsaPvoutYear = 0;
        let pshEquivalentGSA = 0;

        if (mapSheetName) {
            const mapSheet = workbook.Sheets[mapSheetName];
            const data = XLSX.utils.sheet_to_json(mapSheet, { header: 1 });

            // Tìm dòng PVOUT_specific
            const pvoutRow = data.find(r => r[1] === 'PVOUT_specific' || (typeof r[0] === 'string' && r[0].toLowerCase().includes('specific photovoltaic')));

            if (pvoutRow) {
                gsaPvoutYear = parseFloat(pvoutRow[2]);
                // Giờ nắng tương đương = Sản lượng thực / 365 ngày
                pshEquivalentGSA = gsaPvoutYear / 365;
            }
        }

        const normName = normalizeName(provName);
        const toolProv = toolDataMap[normName];

        // PSH hiện tại của Tool (Được tính ngược từ yield_yearly của Tool)
        // Chú ý: Tool có peakSunHours ở Provinces.json, nhưng yield là một con số riêng.
        // Để công bằng, ta lấy Yield_yearly của Tool chi 365 để so sánh apple to apple.
        let pshToolEquivalent = null;
        if (toolProv) {
            pshToolEquivalent = toolProv.yield_yearly / 365;
        }

        results.push({
            name: provName,
            gsaPvout: gsaPvoutYear ? gsaPvoutYear.toFixed(1) : 'N/A',
            gsaPsh: pshEquivalentGSA ? pshEquivalentGSA.toFixed(2) : 'N/A',
            toolPvout: toolProv ? toolProv.yield_yearly : 'N/A',
            toolPsh: pshToolEquivalent ? pshToolEquivalent.toFixed(2) : 'N/A',
            diffPvout: (gsaPvoutYear && toolProv) ? (gsaPvoutYear - toolProv.yield_yearly).toFixed(1) : 'N/A',
            diffPct: (gsaPvoutYear && toolProv) ? (((gsaPvoutYear - toolProv.yield_yearly) / toolProv.yield_yearly) * 100).toFixed(1) + '%' : 'N/A'
        });
    } catch (e) {
        console.error("Error reading", filePath, e.message);
    }
});

// Sort alphabetically
results.sort((a, b) => a.name.localeCompare(b.name, 'vi'));

// Print markdown table format
console.log("| Tỉnh/Thành phố | GSA PVOUT<br/>(kWh/kWp/năm) | GSA PSH<br/>(h/ngày) | Tool PVOUT<br/>(kWh/kWp/năm) | Tool PSH<br/>(h/ngày) | Chênh lệch (%) |");
console.log("|---|---|---|---|---|---|");
results.forEach(r => {
    let diffStr = r.diffPvout > 0 ? `+${r.diffPct}` : r.diffPct;
    console.log(`| ${r.name} | **${r.gsaPvout}** | *${r.gsaPsh}* | ${r.toolPvout} | ${r.toolPsh} | ${diffStr} |`);
});
