
import * as fs from 'fs';
import * as XLSX from 'xlsx';
import { execute as calculateSystemStats } from './src/domain/usecases/CalculateEnergyGeneration.js';

// --- CONFIGURATION ---
const SYSTEM_SIZE_KWP = 238.24;
const INVERTER_AC_KW = 200; // 2x100kW assumed
const TARGET_YIELD_KWH_PER_KWP = 1321; // kWh/kWp/year (PVSyst Benchmark)
// PVSyst produced 314.8 MWh from 238.24 kWp -> 1321 kWh/kWp
const TARGET_EXPORT_PCT = 22.6; // %
const LOAD_FILE_PATH = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/Summary_Load Profile.xlsx";

// --- UTILS ---

// Generate Synthetic Solar Data (Cosine Curve) to match Target Yield
function generateSolarData(days = 365) {
    const data = [];
    const pointsPerDay = 24;

    // Create base daily profile
    const dailyProfile = [];
    let dailySum = 0;
    for (let h = 0; h < 24; h++) {
        let val = 0;
        // Solar window approx 6am to 6pm
        if (h >= 6 && h <= 17) {
            // Peak at 11.5 (noon)
            const hourOffset = h - 6;
            // Simple sine wave
            val = Math.sin((hourOffset / 11) * Math.PI);
            if (val < 0) val = 0;
        }
        dailyProfile.push(val);
        dailySum += val;
    }

    // Target Total Generation = SystemSize * TARGET_YIELD
    // Our 'solarUnit' is kWh/kWp per hour.
    // Sum(solarUnit) over year should approximate TARGET_YIELD.

    // Current Annual Sum (if we just repeated dailyProfile) = dailySum * 365
    // Scaling Factor = TARGET_YIELD / (dailySum * 365)

    const scalingFactor = TARGET_YIELD_KWH_PER_KWP / (dailySum * 365);

    console.log(`[Solar] Generated Daily Sum (raw): ${dailySum.toFixed(2)}. Annual Target: ${TARGET_YIELD_KWH_PER_KWP}. Scaling: ${scalingFactor.toFixed(4)}`);

    for (let d = 0; d < days; d++) {
        const dateBase = new Date(2023, 0, 1 + d, 0, 0, 0);
        for (let h = 0; h < 24; h++) {
            const solarUnit = dailyProfile[h] * scalingFactor;

            // Create data point
            const pointDate = new Date(dateBase);
            pointDate.setHours(h);

            data.push({
                date: pointDate,
                solarUnit: solarUnit,
                timeStep: 1
            });
        }
    }
    return data;
}

// Read Load Profiles from Excel
function getLoadProfiles() {
    try {
        if (!fs.existsSync(LOAD_FILE_PATH)) {
            console.error(`[Load] File not found: ${LOAD_FILE_PATH}`);
            // Return dummy profile if file missing
            return {
                "Dummy_Commercial": Array(8760).fill(0).map((_, i) => {
                    const h = i % 24;
                    // 100kW load during day (8-17), 10kW night
                    return (h >= 8 && h <= 17) ? 100 : 10;
                })
            };
        }
        const buf = fs.readFileSync(LOAD_FILE_PATH);
        const workbook = XLSX.read(buf, { type: 'buffer' });
        const sheet = workbook.Sheets['Load Profile'];
        if (!sheet) return null;

        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const headers = jsonData[1]; // Row index 1 (0-based)
        const rows = jsonData.slice(2);

        const profiles = {};

        // Iterate columns
        if (!headers) return null;

        headers.forEach((h, colIdx) => {
            if (!h || colIdx === 0) return; // Skip empty or first Col (Date/Time)

            // Extract column data
            const loadValues = rows.map(r => {
                const val = Number(r[colIdx]);
                return isNaN(val) ? 0 : val;
            });

            // Handle data length
            let hourlyLoad = [];
            if (loadValues.length >= 8760) {
                // Take first 8760
                hourlyLoad = loadValues.slice(0, 8760);
            } else if (loadValues.length >= 24) {
                // Repeat 24h profile for 365 days
                // Start Jan 1 2023 is Sunday.
                // Simple repeat:
                const dayProfile = loadValues.slice(0, 24);
                for (let d = 0; d < 365; d++) {
                    hourlyLoad.push(...dayProfile);
                }
            } else {
                return; // Skip invalid
            }
            profiles[h] = hourlyLoad;
        });

        return profiles;

    } catch (e) {
        console.error("[Load] Error reading Excel:", e);
        return null;
    }
}

async function run() {
    console.log("=== COMPARING PVSYST VALIDATION (Simulated) ===");
    console.log(`System Size: ${SYSTEM_SIZE_KWP} kWp`);
    console.log(`Inverter AC: ${INVERTER_AC_KW} kW`);
    console.log(`Target Yield: ${TARGET_YIELD_KWH_PER_KWP} kWh/kWp/year`);

    // 1. Solar Data
    const solarData = generateSolarData();
    // Verify Solar Total
    const totalSolarUnit = solarData.reduce((acc, p) => acc + p.solarUnit, 0);
    console.log(`Total Solar Unit Sum: ${totalSolarUnit.toFixed(2)} kWh/kWp`);

    // 2. Load Data
    const profiles = getLoadProfiles();
    if (!profiles) {
        console.log("No profiles loaded.");
        return;
    }
    const profileNames = Object.keys(profiles);
    console.log(`Loaded ${profileNames.length} profiles.`);

    console.log("\n--- Simulation Results ---");
    console.log("Profile Name".padEnd(30) + " | Yield(MWh) | Self-Cons% | Export % | Inverter Clipping?");
    console.log("-".repeat(80));

    profileNames.forEach(name => {
        const loadProfile = profiles[name];

        // Merge
        const simData = solarData.map((s, i) => ({
            ...s,
            load: loadProfile[i] || 0
        }));

        // Run Logic
        const stats = calculateSystemStats(
            SYSTEM_SIZE_KWP,
            simData,
            0, 0, false, false, // Standard, no BESS
            { calibrationFactor: 100 },
            {
                inverterMaxAcKw: INVERTER_AC_KW,
                gridInjectionPrice: 1, // Allow export to calculate it
                weatherDerate: 1.0,
                losses: { temp: 0, soiling: 0, cable: 0, inverter: 0 } // Solar Unit includes losses in our synthetic gen? 
                // Actually CalculateEnergyGeneration applies losses.
                // Our synthetic generator set 'solarUnit' to match FINAL yield.
                // But calculateSystemStats applies `systemDerate`.
                // If we want `solarPowerKw` to match our synthetic unit, we should set losses to 0 OR adjust synthetic unit up.
                // Let's set losses to 0 for this test since we force-matched Yield.
            }
        );

        const yieldMWh = (stats.totalSolarGen / 1000).toFixed(2);
        const scPct = (stats.selfConsumptionRate * 100).toFixed(1);
        const exPct = ((stats.totalExported / stats.totalSolarGen) * 100).toFixed(1);
        const clipping = stats.totalSolarGen < (totalSolarUnit * SYSTEM_SIZE_KWP * 0.99) ? "YES" : "NO";

        // Highlight close match to PVSyst (22.6% Export)
        let mark = "";
        if (Math.abs(Number(exPct) - 22.6) < 5) mark = " <--- PVSYST RANGE";

        console.log(`${name.substring(0, 28).padEnd(30)} | ${yieldMWh}     | ${scPct}%      | ${exPct}%     | ${clipping} ${mark}`);
    });
}

run();
