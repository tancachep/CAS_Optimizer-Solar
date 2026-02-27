import * as XLSX_Module from 'xlsx';
import fs from 'fs';

const XLSX = XLSX_Module.default || XLSX_Module;

const FILE_PATH = 'd:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/TEST/HUYNH DUC 1/HUYNHDUC1 LOAD PROFILE ( 08-2024 TO 09-2025).xlsx';

try {
    if (typeof XLSX.readFile !== 'function') {
        throw new Error(`XLSX.readFile is not a function. Keys: ${Object.keys(XLSX).join(', ')}`);
    }
    const workbook = XLSX.readFile(FILE_PATH);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    console.log(`Sheet: ${sheetName}`);
    console.log(`Total Rows: ${data.length}`);
    console.log("--- VERSION 4: WORKING HOURS TEST ---");

    // Print first 20 rows to see headers
    console.log("--- FIRST 20 ROWS ---");
    data.slice(0, 20).forEach((row, i) => {
        console.log(`Row ${i}:`, JSON.stringify(row));
    });

    // Try to find "Summer" or "Total"
    let loadColIdx = -1;
    let timeColIdx = -1;
    let headerRow = -1;

    // Simulate Parser Logic
    for (let i = 0; i < 20; i++) {
        const row = data[i];
        if (!row) continue;
        const rowStr = row.map(c => String(c).toLowerCase());

        // Find Load (Exact match logic from LoadDataParser)
        // c.includes('σ p') || c.includes('sum p') || c.includes('total p') || c.includes('Σ p')
        // Note: 'Σ'.toLowerCase() might be 'σ' or 'ς' or 'Σ' depending on locale/engine.
        // Let's print what we see.

        let pIdx = rowStr.findIndex(c => c && (
            c.includes('load') || c.includes('p_tong') || c.includes('total') ||
            c.includes('σ p') || c.includes('sum p') || c.includes('Σ p'.toLowerCase()) ||
            c.includes('sigma')
        ));

        if (pIdx !== -1) {
            console.log(`Potential Header Found at Row ${i}, Col ${pIdx}: ${row[pIdx]}`);
            headerRow = i;
            loadColIdx = pIdx;

            // Time Column Detection (Exact match logic)
            const potentialTimeIndices = rowStr.map((c, idx) => (c.includes('time') || c.includes('date') || c.includes('bắt đầu') || c.includes('kết thúc') || c.includes('vlookup')) ? idx : -1).filter(idx => idx !== -1);

            console.log("Potential Time Indices:", potentialTimeIndices);

            if (potentialTimeIndices.length > 0) {
                for (let tCandidate of potentialTimeIndices) {
                    let hasData = false;
                    // Check first 5 data rows
                    for (let j = 1; j <= 5; j++) {
                        if (i + j < data.length) {
                            const val = data[i + j][tCandidate];
                            if (val !== undefined && val !== null && String(val).trim() !== '') { hasData = true; break; }
                        }
                    }
                    if (hasData) { timeColIdx = tCandidate; break; }
                }
            }
            break;
        }
    }

    if (headerRow !== -1 && loadColIdx !== -1) {
        console.log(`Selected Time Col: ${timeColIdx} (${data[headerRow][timeColIdx]})`);

        let sum = 0;
        let count = 0;
        let parsedRows = [];
        let maxLoad = -1;
        let maxLoadRow = -1;
        let minLoad = 99999999;
        let outlierCount = 0;
        let outlierThreshold = 500; // kW
        let lastTime = null;
        let sumTimeStep = 0;
        let gapCount = 0;

        for (let i = headerRow + 1; i < data.length; i++) {
            const rawLoad = data[i][loadColIdx];
            const rawTime = data[i][timeColIdx];

            if (rawTime === undefined || rawLoad === undefined) continue;

            const val = parseFloat(rawLoad);
            if (!isNaN(val)) {
                sum += val;
                count++;

                if (val > maxLoad) { maxLoad = val; maxLoadRow = i; }
                if (val < minLoad) minLoad = val;
                if (val > outlierThreshold) outlierCount++;

                if (lastTime !== null) {
                    const diff = (rawTime - lastTime) * 24; // Hours
                    if (diff > 0.6) gapCount++; // > 36 mins
                    sumTimeStep += diff;
                }
                lastTime = rawTime;

                if (parsedRows.length < 5) {
                    parsedRows.push({ row: i, time: rawTime, load: val });
                }
            }
        }
        console.log(`--- CALCULATION ---`);
        console.log(`Count: ${count}`);
        console.log(`Sum (Raw Power Sum): ${sum.toFixed(2)}`);
        console.log(`Ave Load: ${(sum / count).toFixed(2)}`);
        console.log(`Max Load: ${maxLoad} (Row ${maxLoadRow})`);
        console.log(`Min Load: ${minLoad}`);
        console.log(`Outliers (>500kW): ${outlierCount}`);
        console.log(`Time Gaps (>0.6h): ${gapCount}`);
        console.log(`Total Duration (Sum Time Steps): ${sumTimeStep.toFixed(2)} hours`);

        let sumMonFri = 0;
        let sumMonSat = 0;
        let sumUnique = 0;

        // New Hypotheses
        let sumMonFri_8_17 = 0; // 8AM - 5PM
        let sumMonFri_7_17 = 0; // 7AM - 5PM
        let sumMonSat_8_17 = 0;
        let sumAll_8_17 = 0;

        const meterSet = new Set();
        const timestampMap = new Map(); // Time -> Count
        let duplicateCount = 0;
        let duplicateExamples = [];

        // Reset parsedRows for new logic
        parsedRows = [];

        for (let i = headerRow + 1; i < data.length; i++) {
            const rawLoad = data[i][loadColIdx];
            const rawTime = data[i][timeColIdx];
            const rawMeter = data[i][1];

            if (rawTime === undefined || rawLoad === undefined) continue;

            const val = parseFloat(rawLoad);
            if (!isNaN(val)) {

                if (rawMeter) meterSet.add(rawMeter);

                // Date Parsing
                let jsDate;
                if (typeof rawTime === 'number') {
                    jsDate = new Date(Math.round((rawTime - 25569) * 86400 * 1000));
                } else if (typeof rawTime === 'string') {
                    const [dPart, tPart] = rawTime.trim().split(/\s+/);
                    if (dPart && tPart) {
                        const [day, month, year] = dPart.split('/').map(Number);
                        const [hr, min] = tPart.split(':').map(Number);
                        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                            jsDate = new Date(year, month - 1, day, hr || 0, min || 0);
                        } else { jsDate = new Date(rawTime); }
                    } else { jsDate = new Date(rawTime); }
                } else { jsDate = new Date(NaN); }

                let day = -1;
                let timeKey = NaN;
                let hours = -1;

                if (!isNaN(jsDate.getTime())) {
                    day = jsDate.getDay();
                    timeKey = jsDate.getTime();
                    hours = jsDate.getHours();

                    if (day >= 1 && day <= 5) {
                        sumMonFri += val;
                        if (hours >= 8 && hours < 17) sumMonFri_8_17 += val;
                        if (hours >= 7 && hours < 17) sumMonFri_7_17 += val;
                    }
                    if (day >= 1 && day <= 6) {
                        sumMonSat += val;
                        if (hours >= 8 && hours < 17) sumMonSat_8_17 += val;
                    }

                    if (hours >= 8 && hours < 17) sumAll_8_17 += val;

                    if (timestampMap.has(timeKey)) {
                        duplicateCount++;
                        timestampMap.set(timeKey, timestampMap.get(timeKey) + 1);
                    } else {
                        timestampMap.set(timeKey, 1);
                        sumUnique += val;
                    }
                }
            }
        }

        console.log(`--- HYPOTHESIS TEST v4 ---`);
        console.log(`Total Raw Sum:          ${(sum * 0.5).toLocaleString()} kWh`);
        console.log(`Unique Sum:             ${(sumUnique * 0.5).toLocaleString()} kWh`);
        console.log(`Mon-Fri (Whole Day):    ${(sumMonFri * 0.5).toLocaleString()} kWh`);
        console.log(`Target (User Manual):   539,071 kWh`);
        console.log(`--- WORKING HOURS TEST ---`);
        console.log(`Mon-Fri (8h-17h):       ${(sumMonFri_8_17 * 0.5).toLocaleString()} kWh`);
        console.log(`Mon-Fri (7h-17h):       ${(sumMonFri_7_17 * 0.5).toLocaleString()} kWh`);
        console.log(`Mon-Sat (8h-17h):       ${(sumMonSat_8_17 * 0.5).toLocaleString()} kWh`);
        console.log(`All Days (8h-17h):      ${(sumAll_8_17 * 0.5).toLocaleString()} kWh`);

        console.log(`--- DATA QUALITY ---`);
        console.log(`Duplicate Timestamps: ${duplicateCount}`);

        console.log(`Estimated Energy (Sum * 0.5): ${(sum * 0.5).toFixed(2)}`);

        console.log(`--- DATE RANGE ---`);
        const uniqueDates = new Set(parsedRows.map(r => new Date((r.time - 25569) * 86400 * 1000).toDateString()));
        // Note: parsedRows is truncated to 5. We need to iterate again or collect all dates.

        let minTime = 99999999;
        let maxTime = -1;
        const allDates = new Set();

        for (let i = headerRow + 1; i < data.length; i++) {
            const rawTime = data[i][timeColIdx];
            if (rawTime) {
                if (rawTime < minTime) minTime = rawTime;
                if (rawTime > maxTime) maxTime = rawTime;
                // Excel Date conversion
                const d = new Date(Math.round((rawTime - 25569) * 86400 * 1000));
                allDates.add(d.toDateString());
            }
        }

        const startDate = new Date(Math.round((minTime - 25569) * 86400 * 1000));
        const endDate = new Date(Math.round((maxTime - 25569) * 86400 * 1000));

        console.log(`Start Date: ${startDate.toLocaleDateString()}`);
        console.log(`End Date: ${endDate.toLocaleDateString()}`);
        console.log(`Total Unique Days: ${allDates.size}`);
        console.log(`Expected Days (365/366): ${Math.round((maxTime - minTime))}`);

        console.log("First 5 Parsed Rows:", JSON.stringify(parsedRows, null, 2));

    } else {
        console.log("Could not auto-detect header like the parser.");
    }

} catch (err) {
    console.error("Error:", err);
}
