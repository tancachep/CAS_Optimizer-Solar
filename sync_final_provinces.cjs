const fs = require('fs');

const path = require('path');
const mdData = fs.readFileSync(path.join(__dirname, 'province_table.md'), 'utf-8');

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

const lines = mdData.trim().split('\n');
const updates = {};
for (const line of lines) {
    if (!line.startsWith('|')) continue;

    // Remove all markdown formatting characters like ** and spaces
    const cleanLine = line.replace(/\*/g, '');
    const parts = cleanLine.split('|').map(s => s.trim());
    if (parts.length < 5) continue;

    const stt = parseInt(parts[1]);
    if (isNaN(stt)) continue;

    const nameStr = parts[2];
    const psh = parseFloat(parts[3]);
    const pvout = parseInt(parts[4]);
    updates[toId(nameStr)] = { name: nameStr, psh, pvout };
}

const filePath = 'd:\\TOOL GOOGLE ANTIGRAVITY\\2. Tool Tính toán công suất\\solar-optimizer\\src\\data\\provinces.json';
let provinces = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Go through updates and create/update provinces
const finalProvinces = [];

for (const key of Object.keys(updates)) {
    const data = updates[key];

    // Find matching province or create it
    let p = provinces.find(prov => prov.id === key);

    // Some manual matching
    if (!p && key === 'ho_chi_minh') p = provinces.find(prov => prov.id === 'tp_ho_chi_minh');
    if (!p && key === 'tp_ho_chi_minh') p = provinces.find(prov => prov.id === 'ho_chi_minh');
    if (!p && key === 'thua_thien_hue') p = provinces.find(prov => prov.id === 'hue');
    if (!p && key === 'hue') p = provinces.find(prov => prov.id === 'thua_thien_hue');

    if (p) {
        // Update it
        p.name = data.name;
        p.peakSunHours = data.psh;
        p.yield_yearly = data.pvout;

        // Scale distribution
        if (p.monthly_distribution && p.monthly_distribution.length === 12 && p.monthly_distribution.every(x => x !== null)) {
            let oldSum = p.monthly_distribution.reduce((a, b) => a + b, 0);
            if (oldSum > 0) {
                let scale = p.yield_yearly / oldSum;
                p.monthly_distribution = p.monthly_distribution.map(v => Math.round(v * scale));
                let newSum = p.monthly_distribution.reduce((a, b) => a + b, 0);
                if (newSum !== p.yield_yearly) {
                    p.monthly_distribution[0] += (p.yield_yearly - newSum);
                }
            } else {
                p.monthly_distribution = Array(12).fill(Math.round(p.yield_yearly / 12));
                let newSum = p.monthly_distribution.reduce((a, b) => a + b, 0);
                if (newSum !== p.yield_yearly) {
                    p.monthly_distribution[0] += (p.yield_yearly - newSum);
                }
            }
        } else {
            // Default distribution if it was null
            p.monthly_distribution = Array(12).fill(Math.round(p.yield_yearly / 12));
            let newSum = p.monthly_distribution.reduce((a, b) => a + b, 0);
            if (newSum !== p.yield_yearly) {
                p.monthly_distribution[0] += (p.yield_yearly - newSum);
            }
        }
        finalProvinces.push(p);
    } else {
        // Create new
        const newProv = {
            id: key,
            name: data.name,
            peakSunHours: data.psh,
            yield_yearly: data.pvout,
            monthly_distribution: Array(12).fill(Math.round(data.pvout / 12))
        };
        let newSum = newProv.monthly_distribution.reduce((a, b) => a + b, 0);
        if (newSum !== newProv.yield_yearly) {
            newProv.monthly_distribution[0] += (newProv.yield_yearly - newSum);
        }
        finalProvinces.push(newProv);
    }
}

// Ensure Vietnam Average is first
const vnAvgIndex = finalProvinces.findIndex(p => p.id === 'vietnam_average');
if (vnAvgIndex > 0) {
    const vnAvg = finalProvinces.splice(vnAvgIndex, 1)[0];
    finalProvinces.unshift(vnAvg);
}

fs.writeFileSync(filePath, JSON.stringify(finalProvinces, null, 2));

let mdOut = '| STT | Tỉnh/Thành phố | Giờ nắng (h/ngày) | PVOUT (kWh/kWp/năm) | Phân bổ |\n';
mdOut += '|:---|:---|---:|---:|:---|\n';
finalProvinces.forEach((p, i) => {
    mdOut += `| ${i + 1} | **${p.name}** | ${p.peakSunHours} | ${p.yield_yearly} | ${p.monthly_distribution.slice(0, 3).join(',')}... |\n`;
});
console.log(mdOut);
