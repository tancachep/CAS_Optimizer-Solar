import fs from 'fs';

const PROVINCES = JSON.parse(fs.readFileSync('./src/data/provinces.json', 'utf8'));

// 1. Load Profiles Data
const LOAD_PROFILES = {
    "San Xuat_Plastics (Sakaguchi)": [
        0.040784698040403126, 0.040741879536496266, 0.040699061032589405, 0.04072792333471093,
        0.04075678563683245, 0.04093164003930534, 0.04110649444177824, 0.04073537638487902,
        0.0403642583279798, 0.041137987232194376, 0.04191171613640895, 0.04142982529465854,
        0.04094793445290812, 0.04140447031026317, 0.04186100616761821, 0.041375608008141655,
        0.040890209848665086, 0.041901705667065525, 0.04291320148546596, 0.04303654215883589,
        0.04315988283220582, 0.043882317214675316, 0.04460475159714482, 0.042694724818773955
    ]
};

// 2. Load Profile Generator
const generateSyntheticProfile = (monthlyData, profileType, year = 2024, options = {}) => {
    const results = [];
    const profileEntry = LOAD_PROFILES[profileType] || LOAD_PROFILES[Object.keys(LOAD_PROFILES)[0]] || {};
    const weights = Array.isArray(profileEntry) ? profileEntry : (profileEntry.weights || Array(24).fill(1 / 24));
    const intervalMins = profileEntry.intervalMins || 60;
    const isDualDay = profileEntry.isDualDay || false;

    const safeMonthlyData = Array.isArray(monthlyData) && monthlyData.length === 12
        ? monthlyData.map(v => Number(v) || 0)
        : Array(12).fill(0);

    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const daysInMonth = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    for (let m = 0; m < 12; m++) {
        const totalMonthKwh = safeMonthlyData[m];
        if (totalMonthKwh <= 0) {
            for (let d = 1; d <= daysInMonth[m]; d++) {
                for (let h = 0; h < 24; h++) {
                    const date = new Date(year, m, d, h, 0, 0);
                    results.push({ rawTime: date, loadKw: 0, timeStep: 1 });
                }
            }
            continue;
        }

        let weightedDaysCount = 0;
        const monthByteMap = [];

        for (let d = 1; d <= daysInMonth[m]; d++) {
            const date = new Date(year, m, d, 12, 0, 0);
            const dayOfWeek = date.getDay();
            let scale = 1.0;

            if (options.workSchedule === 'mon_fri') {
                if (dayOfWeek === 0 || dayOfWeek === 6) scale = 0.3;
            } else if (options.workSchedule === 'mon_sat') {
                if (dayOfWeek === 0) scale = 0.3;
            }

            weightedDaysCount += scale;
            monthByteMap.push({ d, scale, dayOfWeek });
        }

        const baseDailyKwh = totalMonthKwh / weightedDaysCount;
        const stepsPerDay = Math.floor(1440 / intervalMins);

        monthByteMap.forEach(({ d, scale, dayOfWeek }) => {
            const dailyKwh = baseDailyKwh * scale;

            for (let step = 0; step < stepsPerDay; step++) {
                const mins = step * intervalMins;
                const hh = Math.floor(mins / 60);
                const mm = Math.floor(mins % 60);
                const pointDate = new Date(year, m, d, hh, mm, 0);

                let weight = 0;
                if (isDualDay) {
                    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
                    const idx = step + (isWeekend && weights.length >= stepsPerDay * 2 ? stepsPerDay : 0);
                    weight = weights[idx] || (1 / stepsPerDay);
                } else {
                    weight = weights[step] || (1 / stepsPerDay);
                }

                const stepEnergyKwh = dailyKwh * weight;
                const stepPowerKw = stepEnergyKwh / (intervalMins / 60);

                results.push({
                    rawTime: pointDate,
                    loadKw: stepPowerKw,
                    weight,
                    timeStep: intervalMins / 60
                });
            }
        });
    }
    return results;
};

// 3. Solar Profile Generator
const generateSolarProfile = (monthlyGhi, metadata, sourceName) => {
    const solarMap = new Map(); const year = 2024;
    for (let m = 0; m < 12; m++) {
        const daysInMonth = new Date(year, m + 1, 0).getDate(); const monthlySum = monthlyGhi[m];
        const avgDailyPsh = monthlySum / daysInMonth;
        let shapeSum = 0;
        for (let h = 0; h < 24; h++) {
            if (h >= 6 && h <= 18) {
                shapeSum += Math.pow(Math.sin((Math.PI * (h - 6)) / 12), 3);
            }
            const hNext = h + 0.5;
            if (hNext >= 6 && hNext <= 18) {
                shapeSum += Math.pow(Math.sin((Math.PI * (hNext - 6)) / 12), 3);
            }
        }

        const peak = avgDailyPsh / (shapeSum * 0.5);

        for (let d = 1; d <= daysInMonth; d++) {
            for (let h = 0; h < 24; h++) {
                let valCurrent = 0;
                let valNext = 0;

                if (h >= 6 && h <= 18) {
                    valCurrent = peak * Math.pow(Math.sin((Math.PI * (h - 6)) / 12), 3);
                }
                const hNext = h + 0.5;
                if (hNext >= 6 && hNext <= 18) {
                    valNext = peak * Math.pow(Math.sin((Math.PI * (hNext - 6)) / 12), 3);
                }

                solarMap.set(`${m}-${d}-${h}-0`, Math.max(0, valCurrent));
                solarMap.set(`${m}-${d}-${h}-30`, Math.max(0, valNext));
            }
        }
    }
    return [{ map: solarMap, source: sourceName }];
};

// 4. Calculate Energy Generation (System Stats)
const executeCalculate = (
    systemSize, data, bessCapacityKwh = 0, bessMaxPowerKw = 0, useTouMode = false, enableGridCharge = false, params = {}, techParams = {}
) => {
    let totalSolarGen = 0;
    let totalCurtailed = 0;
    let totalUsed = 0;
    let totalLoad = 0;
    let totalExported = 0;
    let totalGridCharge = 0;

    let usedPeak = 0; let usedNormal = 0; let usedOffPeak = 0;
    let curtailedPeak = 0; let curtailedNormal = 0; let curtailedOffPeak = 0;

    const calibrationFactor = isNaN(Number(params.calibrationFactor)) ? 100 : Number(params.calibrationFactor);
    const scaling = calibrationFactor / 100.0;
    const inverterMaxAcKw = isNaN(Number(techParams.inverterMaxAcKw)) ? 999999 : Number(techParams.inverterMaxAcKw);

    const safeSystemSize = isNaN(Number(systemSize)) ? 0 : Number(systemSize);

    const getTouType = (date) => {
        if (isNaN(date.getTime())) return 'NORMAL';
        const h = date.getHours();
        const m = date.getMinutes();
        const totalMin = h * 60 + m;
        const d = date.getDay();

        if (totalMin >= 22 * 60 || totalMin < 4 * 60) return 'OFF_PEAK';
        if (d !== 0) {
            if ((totalMin >= 9 * 60 + 30 && totalMin < 11 * 60 + 30) ||
                (totalMin >= 17 * 60 && totalMin < 20 * 60)) {
                return 'PEAK';
            }
        }
        return 'NORMAL';
    };

    for (let i = 0; i < data.length; i++) {
        const point = data[i];
        const timeFactor = point.timeStep || 1;
        const pointDate = point.date;
        const touType = getTouType(pointDate);

        let solarPowerKw = point.solarUnit * safeSystemSize * scaling;
        if (isNaN(solarPowerKw)) solarPowerKw = 0;
        if (solarPowerKw > inverterMaxAcKw) solarPowerKw = inverterMaxAcKw;

        const solarEnergy = solarPowerKw * timeFactor;
        const loadPower = isNaN(Number(point.load)) ? 0 : Number(point.load);
        const loadEnergy = loadPower * timeFactor;

        totalLoad += loadEnergy;
        totalSolarGen += solarEnergy;

        let usedEnergy = Math.min(solarEnergy, loadEnergy);
        let excessSolar = Math.max(0, solarEnergy - loadEnergy);

        let curtailedEnergy = excessSolar;

        totalUsed += usedEnergy;
        totalExported += 0;
        totalCurtailed += curtailedEnergy;

        if (touType === 'OFF_PEAK') {
            usedOffPeak += usedEnergy;
            curtailedOffPeak += curtailedEnergy;
        } else if (touType === 'PEAK') {
            usedPeak += usedEnergy;
            curtailedPeak += curtailedEnergy;
        } else {
            usedNormal += usedEnergy;
            curtailedNormal += curtailedEnergy;
        }
    }

    const gridImport = totalLoad - totalUsed;

    return {
        systemSize,
        totalSolarGen,
        totalCurtailed,
        totalUsed,
        totalExported,
        totalLoad,
        gridImport,
        usedPeak, usedNormal, usedOffPeak,
        curtailedPeak, curtailedNormal, curtailedOffPeak,
    };
};

const monthlyLoad = [249587, 217259, 211503, 160283, 129487, 126608, 142598, 155626, 153557, 176252, 158601, 221315];

// Generate Load Profile
const loadProfile = generateSyntheticProfile(monthlyLoad, "San Xuat_Plastics (Sakaguchi)", 2024, { workSchedule: 'mon_sat' });

// Generate Solar Profile (Ho Chi Minh City)
const province = PROVINCES.find(p => p.id === 'ho_chi_minh');
const solarLayer = generateSolarProfile(province.monthly_distribution || Array(12).fill(province.peakSunHours * 30), null, "HCM Solar")[0];

// Combine Data into hourly points
const combinedData = [];
for (let i = 0; i < loadProfile.length; i++) {
    const lp = loadProfile[i];
    const d = lp.rawTime;
    const m = d.getMonth();
    const day = d.getDate();
    const h = d.getHours();

    // Sum the 0 and 30 slots for instantaneous power equivalent (since we process hour by hour).
    // Or, convert system to process hour by hour with averaged solarUnit.
    // solarMap has values mapped every 30mins
    const s0 = solarLayer.map.get(`${m}-${day}-${h}-0`) || 0;
    const s30 = solarLayer.map.get(`${m}-${day}-${h}-30`) || 0;
    const avgSp = (s0 + s30) / 2; // Average PSH per hour

    combinedData.push({
        timestamp: d.getTime(),
        date: d,
        timeStep: lp.timeStep,
        load: lp.loadKw,
        solarUnit: avgSp
    });
}

const systemSizeKw = 1000;

const stats = executeCalculate(
    systemSizeKw,
    combinedData,
    0, 0, false, false,
    { calibrationFactor: 100 },
    { inverterMaxAcKw: systemSizeKw }
);

const results = {
    pv_total: stats.totalSolarGen,
    pv_used: stats.totalUsed,
    pv_used_pct: stats.totalSolarGen > 0 ? (stats.totalUsed / stats.totalSolarGen) * 100 : 0,
    pv_curtailed: stats.totalCurtailed,
    pv_curtailed_pct: stats.totalSolarGen > 0 ? (stats.totalCurtailed / stats.totalSolarGen) * 100 : 0,
    grid_import: stats.gridImport,
    total_load: stats.totalLoad,
    loss_pct: 0,
    pv_used_normal: stats.usedNormal,
    pv_used_normal_pct: stats.totalUsed > 0 ? (stats.usedNormal / stats.totalUsed) * 100 : 0,
    pv_used_peak: stats.usedPeak,
    pv_used_peak_pct: stats.totalUsed > 0 ? (stats.usedPeak / stats.totalUsed) * 100 : 0,
    curtailed_normal: stats.curtailedNormal,
    curtailed_normal_pct: stats.totalCurtailed > 0 ? (stats.curtailedNormal / stats.totalCurtailed) * 100 : 0,
    curtailed_peak: stats.curtailedPeak,
    curtailed_peak_pct: stats.totalCurtailed > 0 ? (stats.curtailedPeak / stats.totalCurtailed) * 100 : 0
};

console.log("");
for (const [key, value] of Object.entries(results)) {
    console.log(`${key}: ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
}
console.log("");
