import { execute } from './src/domain/usecases/CalculateFinancials.js';

const customStats = {
    usedPeak: 1000, usedNormal: 2000, usedOffPeak: 500,
    totalExported: 500, totalGridCharge: 0, totalDischarged: 0, totalUsed: 3500
};
const prices = { peak: 3000, normal: 1500, offPeak: 1000, gridInjection: 1200 };
const capex = 100000000;

console.log("=== KIỂM TRA TỶ LỆ VAY ===");
for (const ratio of [0, 50, 100]) {
    const params = {
        years: 20, degradation: 0.5, escalation: 2.0, discountRate: 10.0,
        omPercent: 1.0, loan: { enable: true, ratio, rate: 8.0, term: 10 }
    };
    const res = execute(capex, customStats, prices, params);

    console.log(`\n=> Tỷ lệ vay: ${ratio}%`);
    console.log(`  - Payback (Năm hoàn vốn): ${res.payback}`);
    console.log(`  - IRR       : ${res.irr}%`);
    console.log(`  - ROI       : ${res.roi}%`);
    console.log(`  - NPV       : ${res.npv}`);
    console.log(`  - C.Flow Y1 : ${res.cumulativeData[1].net}`);
}
