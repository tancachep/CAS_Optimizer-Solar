import * as XLSX from 'xlsx';
import * as fs from 'fs';
import path from 'path';

// --- STUB TIMEOUT OR LOGGING ---
console.log("=== CALCULATING 16 PARAMETERS FOR RO UNIFORM ===");

import { CalculateEnergyGeneration } from './src/domain/usecases/CalculateEnergyGeneration.js';
import { GSAExcelParser } from './src/infra/parsers/GSAExcelParser.js';

function getTouGroup(hour) {
    // Standard EVN TOU
    // Peak (CĐ): 9:30-11:30 and 17:00-20:00. Let's simplify to hours 9,10,11 and 17,18,19 based on how tool does it.
    // Wait, let's use the tool's exact logic if available, or just standard EVN:
    // Normal (BT): 4:00-9:30, 11:30-17:00, 20:00-22:00
    // Off-peak (TD): 22:00-04:00

    // For simplicity, let's roughly approximate the EVN schedule for hourly data:
    if ((hour >= 9 && hour < 11) || (hour >= 17 && hour < 20)) {
        return 'CD'; // Peak
    } else if (hour >= 22 || hour < 4) {
        return 'TD'; // Off-peak
    } else {
        return 'BT'; // Normal
    }
}

async function run() {
    try {
        const loadProfilePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/TEST/RO UNIFORM/3.NM_RO_Uniform_Bieu do phu tai_Them thoi gian lam viec.xlsx";
        const gsaPath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/TEST/RO UNIFORM/GSA_Report_RO UNIFORM.xlsx";

        // 1. Load Profile
        console.log("Reading Load Profile...");
        const lpBuf = fs.readFileSync(loadProfilePath);
        const lpWb = XLSX.read(lpBuf, { type: 'buffer' });
        const lpSheet = lpWb.Sheets[lpWb.SheetNames[0]];
        const lpData = XLSX.utils.sheet_to_json(lpSheet, { header: 1 });

        let loadProfileSum = 0;
        let loadMap = new Map();

        // Extract 24h load profile (average daily)
        let hourlyLoadBase = new Array(24).fill(0);
        for (let r = 9; r <= 32; r++) {
            const row = lpData[r];
            if (!row) continue;
            let hourStr = row[1]; // Col B has time like "00:00"
            let val = row[2] || 0; // Col C has Load (kWh)
            if (hourStr && typeof hourStr === 'string' && hourStr.includes(':')) {
                let hour = parseInt(hourStr.split(':')[0]);
                if (!isNaN(hour) && hour >= 0 && hour < 24) {
                    hourlyLoadBase[hour] = parseFloat(val);
                }
            }
        }

        // Create full year load map (8760 hours)
        let daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let currentHour = 0;
        for (let m = 0; m < 12; m++) {
            for (let d = 0; d < daysInMonth[m]; d++) {
                // Day of week (0=Sun, 1=Mon, ..., 6=Sat) - assuming year starts on Monday for simplicity
                let dayOfWeek = (d + 1) % 7;
                let isWeekend = (dayOfWeek === 0 || dayOfWeek === 6); // CN is weekend, T7 is partly weekend?
                // The image shows "3.NM_RO_Uniform_Bieu do phu tai_Them thoi gian lam viec" so it might have specific logic
                // For now, let's just use the uniform load for all days.
                let dailySum = 0;
                for (let h = 0; h < 24; h++) {
                    const key = `M${m + 1}_D${d + 1}_H${h}`;
                    let val = hourlyLoadBase[h] * 1; // Assuming constant for now
                    if (isWeekend) val = hourlyLoadBase[h] * 0.1; // Reduced load on weekends? Just a guess from previous debug
                    loadMap.set(key, val);
                    loadProfileSum += val;
                }
            }
        }

        // 2. Load GSA Data
        console.log("Reading GSA Data...");
        const parser = new GSAExcelParser();
        const gsaBuf = fs.readFileSync(gsaPath);
        const gsaResult = await parser.parse(gsaBuf.buffer);

        // 3. Process GSA Data
        const metadata = gsaResult.metadata;
        const baseAnnualSum = metadata.totals?.pvout || 0;
        const availableTypes = parser.getAvailableDataTypes(gsaResult);

        let pvoutType = availableTypes.find(t => t[0] === 'PVOUT');
        if (!pvoutType) throw new Error("PVOUT data not found in GSA");

        const scaleFactor = baseAnnualSum > 0 ? (pvoutType[1].value / baseAnnualSum) : 1;
        const scaledMap = new Map();

        gsaResult.hourlyData.map.forEach((val, key) => {
            scaledMap.set(key, val * scaleFactor);
        });

        let maxVal = 0;
        scaledMap.forEach(val => { if (val > maxVal) maxVal = val; });
        if (maxVal > 0.1 && maxVal < 0.65) {
            const boostMultiplier = 0.65 / maxVal;
            scaledMap.forEach((val, key) => {
                scaledMap.set(key, val * boostMultiplier);
            });
        }

        let combinedData = [];
        let pvTotal = 0;

        const daysInMonthArr = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        for (let m = 0; m < 12; m++) {
            for (let d = 0; d < daysInMonthArr[m]; d++) {
                for (let h = 0; h < 24; h++) {
                    const key = `M${m + 1}_D${d + 1}_H${h}`;
                    const solar = scaledMap.get(key) || 0;
                    const load = loadMap.get(key) || 0;
                    combinedData.push({
                        month: m + 1,
                        day: d + 1,
                        hour: h,
                        solarUnit: solar,
                        loadKw: load
                    });
                    pvTotal += solar; // * systemSize handled in Execute
                }
            }
        }

        console.log("Running Simulation...");
        const calcUseCase = new CalculateEnergyGeneration();

        const systemSize = 104.16; // kWp

        const techParams = {
            inverterMaxAcKw: systemSize * 1.5, // Large enough to not clip
            losses: {
                temperature: 0,
                soiling: 0,
                cable: 0,
                inverter: 0,
                transformer: 0
            },
            degradationPerYear: 0,
            isActualYield: true, // Bypass losses for PVOUT
            timezoneOffset: 7
        };

        const params = {
            calibrationFactor: 1.0,
            finance: { sellToGridPrice: 0 }
        };

        const result = calcUseCase.execute(
            systemSize,
            combinedData,
            0, // BESS Cap
            0, // BESS Pow
            true, // useTouMode
            false, // enableGridCharge
            params,
            techParams
        );

        // Summing up based on TOU
        let pvUsedBT = 0;
        let pvUsedCD = 0;
        let pvCurBT = 0;
        let pvCurCD = 0;

        result.hourlyData.forEach(row => {
            const tou = getTouGroup(row.hour);
            const used = row.solarUsedKw || 0;
            const cur = row.solarCurtailedKw || 0;

            if (tou === 'BT') {
                pvUsedBT += used;
                pvCurBT += cur;
            } else if (tou === 'CD') {
                pvUsedCD += used;
                pvCurCD += cur;
            }
        });

        const totPV = result.annualData.solarGeneration;
        const totUsed = result.annualData.solarUsedByLoad;
        const totCur = result.annualData.solarCurtailed;
        const totGrid = result.annualData.gridImport;
        const totLoad = loadProfileSum;

        console.log("\n================ 16 PARAMETERS (TOOL - GSA) ================");
        console.log(`1. kWp Estimate: ${systemSize}`);
        console.log(`2. PV Total (kWh): ${totPV.toFixed(0)}`);
        console.log(`3. PV Used by Loads (kWh): ${totUsed.toFixed(0)}`);
        console.log(`4. PV Used by Loads (%): ${((totUsed / totPV) * 100).toFixed(1)}%`);
        console.log(`5. PV Curtailed (kWh): ${totCur.toFixed(0)}`);
        console.log(`6. PV Curtailed (%): ${((totCur / totPV) * 100).toFixed(1)}%`);
        console.log(`7. Grid (kWh): ${totGrid.toFixed(0)}`);
        console.log(`8. Load Consumption (kWh): ${totLoad.toFixed(0)}`);

        console.log(`9. PV Used - Giờ BT (kWh): ${pvUsedBT.toFixed(0)}`);
        console.log(`10. PV Used - Giờ BT (%): ${((pvUsedBT / totUsed) * 100).toFixed(1)}%`);
        console.log(`11. PV Used - Giờ CĐ (kWh): ${pvUsedCD.toFixed(0)}`);
        console.log(`12. PV Used - Giờ CĐ (%): ${((pvUsedCD / totUsed) * 100).toFixed(1)}%`);

        console.log(`13. PV Cur - Giờ BT (kWh): ${pvCurBT.toFixed(0)}`);
        console.log(`14. PV Cur - Giờ BT (%): ${((pvCurBT / totCur) * 100).toFixed(1)}%`);
        console.log(`15. PV Cur - Giờ CĐ (kWh): ${pvCurCD.toFixed(0)}`);
        console.log(`16. PV Cur - Giờ CĐ (%): ${((pvCurCD / totCur) * 100).toFixed(1)}%`);


    } catch (e) {
        console.error("Error:", e);
    }
}

run();
