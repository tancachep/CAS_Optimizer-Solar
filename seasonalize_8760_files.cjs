const fs = require('fs');
const path = require('path');

/**
 * Script to synchronize 8760-hour GSA JSON files with the seasonal distribution in provinces.json.
 * This ensures that the high-precision detailed reports reflect the newly updated seasonal variations.
 */

const PROVINCES_FILE = path.join(__dirname, 'src', 'data', 'provinces.json');
const GSA_DIR = path.join(__dirname, 'public', 'data', 'gsa');
const YEAR = 2023; // Reference year (non-leap, 365 days = 8760 hours)

function run() {
    console.log('--- STARTING 8760 SEASONALIZATION ---');

    if (!fs.existsSync(PROVINCES_FILE)) {
        console.error('Provinces file not found:', PROVINCES_FILE);
        return;
    }

    const provinces = JSON.parse(fs.readFileSync(PROVINCES_FILE, 'utf8'));
    let updatedCount = 0;
    let skippedCount = 0;

    provinces.forEach(province => {
        const filePath = path.join(GSA_DIR, `${province.id}.json`);
        
        if (!fs.existsSync(filePath)) {
            console.warn(`[SKIP] File not found for: ${province.name} (${province.id}.json)`);
            skippedCount++;
            return;
        }

        if (!province.monthly_distribution || province.monthly_distribution.length !== 12) {
            console.warn(`[SKIP] Missing or invalid monthly_distribution for: ${province.name}`);
            skippedCount++;
            return;
        }

        try {
            const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            if (!Array.isArray(rawData) || rawData.length !== 8760) {
                console.warn(`[SKIP] Invalid 8760 data format for: ${province.name} (length: ${rawData?.length})`);
                skippedCount++;
                return;
            }

            const updatedData = [...rawData];
            let hourOfYear = 0;

            console.log(`[PROCESS] ${province.name}...`);

            for (let month = 0; month < 12; month++) {
                const daysInMonth = new Date(YEAR, month + 1, 0).getDate();
                const totalHoursInMonth = daysInMonth * 24;
                
                const targetMonthlyTotal = province.monthly_distribution[month];
                
                // Calculate current monthly total in the file
                let currentMonthlyTotal = 0;
                for (let i = 0; i < totalHoursInMonth; i++) {
                    currentMonthlyTotal += rawData[hourOfYear + i] || 0;
                }

                // If current total is 0, we can't scale (avoid NaN)
                if (currentMonthlyTotal > 1) {
                    const scaleFactor = targetMonthlyTotal / currentMonthlyTotal;
                    
                    // Apply scale factor to each hour in the month
                    for (let i = 0; i < totalHoursInMonth; i++) {
                        updatedData[hourOfYear + i] = parseFloat((rawData[hourOfYear + i] * scaleFactor).toFixed(6));
                    }
                } else if (targetMonthlyTotal > 0) {
                    console.warn(`  - [WARN] Month ${month + 1} has near-zero baseline data. Cannot accurately scale.`);
                }

                hourOfYear += totalHoursInMonth;
            }

            // Save back
            fs.writeFileSync(filePath, JSON.stringify(updatedData));
            updatedCount++;
            console.log(`  - [SUCCESS] Synchronized ${province.name}.`);

        } catch (err) {
            console.error(`  - [ERROR] Failed to process ${province.name}:`, err.message);
        }
    });

    console.log('\n--- SEASONALIZATION COMPLETE ---');
    console.log(`Updated: ${updatedCount} provinces`);
    console.log(`Skipped: ${skippedCount} provinces`);
}

run();
