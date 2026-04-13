const calculateIRR = (cashFlows) => {
    let irr = 0;
    let low = -0.99, high = 10.0;
    for (let k = 0; k < 100; k++) {
        const mid = (low + high) / 2;
        let val = 0;
        for (let i = 0; i < cashFlows.length; i++) {
            val += cashFlows[i] / Math.pow(1 + mid, i);
        }
        if (Math.abs(val) < 0.001) { irr = mid; break; }
        if (val > 0) low = mid; else high = mid;
        irr = mid;
    }
    return irr;
};

// 0% loan example:
const cf0 = [-100, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
console.log("0% loan IRR:", calculateIRR(cf0) * 100, "%");

// 100% loan example (unprofitable test):
const cf100_loss = [0, -9, -9, -9, -9, -9, -9, -9, -9, -9, -9, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
console.log("100% loan loss IRR:", calculateIRR(cf100_loss) * 100, "%");

// 100% loan example (profitable test):
const cf100_profit = [0, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15];
console.log("100% loan profit IRR:", calculateIRR(cf100_profit) * 100, "%");

// 50% loan example:
const cf50 = [-50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10];
console.log("50% loan IRR:", calculateIRR(cf50) * 100, "%");
