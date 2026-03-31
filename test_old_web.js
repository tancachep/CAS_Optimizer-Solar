import xlsx from 'xlsx';

// HÀM HÌNH SIN CŨ CỦA WEB TRƯỚC KHI FIX
const generateInstantaneousSolarOLD = (date, dailyPsh) => {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const time = hour + minute / 60;

    if (time < 6 || time > 18) return 0;

    const peak = (dailyPsh * Math.PI) / 16;
    const val = peak * Math.pow(Math.sin((Math.PI * (time - 6)) / 12), 3);

    return Math.max(0, val);
};

const filePath = 'D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/1. Database/NEW TEMPLATE/HUYNHDUC1/Make_Template_HUYNHDUC1.xlsx';
const workbook = xlsx.readFile(filePath);
const targetSheetNames = ['Template_SMD', 'Summary', 'Data', 'Load Profile', 'Sheet1'];
let sheetName = targetSheetNames.find(name => workbook.SheetNames.includes(name));
if (!sheetName) sheetName = workbook.SheetNames[0];

const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

let rawData = [];
for (let i = 3; i < Math.min(data.length, 20000); i++) {
    const row = data[i];
    if (!row) continue;
    let dateObj = null;
    const val = row[0];
    if (typeof val === 'number') {
        dateObj = new Date(Math.round((val - 25569) * 86400 * 1000));
    } else if (typeof val === 'string') {
        const clean = val.trim();
        const parts = clean.split(/\s+/);
        if (parts.length >= 2) {
            const dateParts = parts[0].split('/');
            const timeParts = parts[1].split(':');
            dateObj = new Date(2023, parseInt(dateParts[1]) - 1, parseInt(dateParts[0]), parseInt(timeParts[0]), parseInt(timeParts[1]));
        }
    }
    const loadKw = parseFloat(row[1]);
    if (dateObj && !isNaN(loadKw)) {
        rawData.push({ timestamp: dateObj.getTime(), date: dateObj, load: loadKw });
    }
}
rawData.sort((a,b) => a.timestamp - b.timestamp);

const targetKwp = 282.72;
const psh = 4.025;
const systemLoss = 0.024; // Mất 2.4% yield để match 405.5

function runSimOldWeb(inverterMaxAcKw) {
    let totalSolarGen = 0; let totalUsed = 0; let totalCurtailed = 0; let totalLoad = 0;
    
    for (let i = 0; i < rawData.length; i++) {
        const point = rawData[i];
        
        let solarUnit = generateInstantaneousSolarOLD(point.date, psh); // SỬ DỤNG HÀM CŨ
        let solarPowerKw = solarUnit * targetKwp * (1 - systemLoss);
        
        if (solarPowerKw > inverterMaxAcKw) {
            solarPowerKw = inverterMaxAcKw;
        }

        const solarEnergy = solarPowerKw * 0.5;
        const loadEnergy = point.load * 0.5;
        
        totalSolarGen += solarEnergy;
        totalLoad += loadEnergy;
        
        const usedEnergy = Math.min(solarEnergy, loadEnergy);
        const curtailedEnergy = Math.max(0, solarEnergy - loadEnergy);
        
        totalUsed += usedEnergy;
        totalCurtailed += curtailedEnergy;
    }

    console.log(`\n=== KẾT QUẢ WEB (HÀM CŨ) - AC LIMIT: ${inverterMaxAcKw} kW ===`);
    console.log(`Load Total: ${totalLoad.toFixed(1)} kWh (Thực tế Web: 773413)`);
    console.log(`PV Total: ${totalSolarGen.toFixed(1)} kWh (Thực tế Web ảnh: 405522)`);
    console.log(`PV Used: ${totalUsed.toFixed(1)} kWh (Thực tế Web ảnh: 249569)`);
    console.log(`Curtailed: ${totalCurtailed.toFixed(1)} kWh (Thực tế Web ảnh: 155953)`);
    console.log(`Curtailed %: ${(totalCurtailed / totalSolarGen * 100).toFixed(2)} %`);
}

runSimOldWeb(999999);
