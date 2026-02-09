# 📊 Solar Optimizer - Calculation Methodology

## Comprehensive Technical Documentation

This document describes all calculation methods, formulas, and algorithms used in the Solar Optimizer Tool.

---

## 📑 Table of Contents

1. [Solar Irradiance & Energy Generation](#1-solar-irradiance--energy-generation)
2. [Load Profile Generation](#2-load-profile-generation)
3. [Battery Energy Storage System (BESS)](#3-battery-energy-storage-system-bess)
4. [Time-of-Use (TOU) Pricing](#4-time-of-use-tou-pricing)
5. [Inverter Selection](#5-inverter-selection)
6. [System Losses & Derate Factors](#6-system-losses--derate-factors)
7. [Financial Calculations](#7-financial-calculations)
8. [System Optimization](#8-system-optimization)

---

## 1. Solar Irradiance & Energy Generation

### 1.1 Peak Sun Hours (PSH) by Province

Each province in Vietnam has specific solar irradiance data based on historical measurements:

| Province | PSH (hours/day) | Annual Yield (kWh/kWp) |
|----------|-----------------|------------------------|
| Lâm Đồng | 4.40 | 1,605 |
| Khánh Hòa | 4.28 | 1,563 |
| Đồng Nai | 4.12 | 1,505 |
| Quảng Ngãi | 4.10 | 1,498 |
| Gia Lai | 4.07 | 1,485 |
| TP. HCM | 4.02 | 1,467 |
| Đắk Lắk | 3.99 | 1,455 |
| Tây Ninh | 3.85 | 1,407 |
| Đà Nẵng | 3.80 | 1,386 |
| **VN Average** | **3.80** | **1,387** |
| Hà Nội | 2.62 | 955 |

### 1.2 Solar Energy Generation Formula

```
Solar Power (kW) = Solar Unit × System Size (kWp) × Calibration Factor × System Derate
```

Where:
- **Solar Unit**: Hourly irradiance per kWp (from province data)
- **System Size**: Installed DC capacity in kWp
- **Calibration Factor**: User adjustment (default = 100%)
- **System Derate**: Total system efficiency after losses

### 1.3 Monthly Distribution

Each province has a 12-month distribution factor for seasonal variation. Example for TP. HCM:

```
Jan: 135, Feb: 120, Mar: 149, Apr: 147, May: 136, Jun: 113
Jul: 116, Aug: 119, Sep: 105, Oct: 111, Nov: 110, Dec: 106
```

---

## 2. Load Profile Generation

### 2.1 Available Load Profiles

The tool includes **20+ pre-defined load profiles** based on real C&I customer data:

| Profile Type | Description | Peak Hours |
|-------------|-------------|------------|
| **Kinh doanh - Đỉnh ban ngày** | Commercial - Day Peak | 9:00-17:00 |
| **Kinh doanh - Đỉnh ban đêm** | Commercial - Night Peak | 17:00-22:00 |
| **Kinh doanh - 2 Đỉnh** | Commercial - Double Peak | 9:00-12:00 & 17:00-20:00 |
| **Sản xuất - Phụ tải đều** | Manufacturing - Flat Load | 24/7 constant |
| **Sản xuất - 2 Đỉnh** | Manufacturing - Double Shift | 8:00-17:00 & 13:00-18:00 |
| **Sản xuất - 3 Đỉnh** | Manufacturing - Triple Shift | 3 × 8-hour shifts |
| **Sinh hoạt - Phụ tải ngày** | Residential - Day Load | 8:00-18:00 |
| **Sinh hoạt - Phụ tải chiều tối** | Residential - Evening Load | 17:00-21:00 |

### 2.2 Synthetic Profile Generation Algorithm

```javascript
// Step 1: Normalize hourly weights (sum = 1)
normalizedWeight[hour] = baseProfile[hour] / sum(baseProfile)

// Step 2: Calculate working vs off days
offDayRatio = baseLoadPct / 100  // Default: 15%
avgDailyWork = monthlyKWh / (workingDays + offDays × offDayRatio)

// Step 3: Apply daily consumption
dailyTotal = isWorkDay ? avgDailyWork : (avgDailyWork × offDayRatio)

// Step 4: Apply hourly distribution
hourlyLoad = dailyTotal × normalizedWeight[hour] × randomFactor(±10%)

// Step 5: Apply seasonal cooling boost (May-July)
if (hasCooling && month ∈ [4,5,6] && hour ∈ [12,16]) {
    hourlyLoad × 1.20  // +20% cooling load
}
```

### 2.3 Special Load Modifiers

| Modifier | Effect |
|----------|--------|
| **EV Charging** | +15% load during 18:00-22:00 |
| **Heat Pump** | +5% constant 24/7 load |
| **Machinery** | +15% during 8:00-17:00 |
| **Weekend Schedule** | Configurable per day (Mon-Sun) |

---

## 3. Battery Energy Storage System (BESS)

### 3.1 BESS Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Charge Efficiency** | 95% | Round-trip charging loss |
| **Discharge Efficiency** | 95% | Round-trip discharging loss |
| **Depth of Discharge (DoD)** | 90% | Maximum usable capacity |
| **Minimum SoC** | Capacity × (1 - DoD) | Reserved capacity |

### 3.2 Charging Logic

```javascript
// From Solar Excess
roomInBattery = bessCapacity - currentSoC
maxInput = min(excessSolar, maxTransferEnergy)
realChargeInput = min(maxInput, roomInBattery / CHARGE_EFF)
actualStored = realChargeInput × 0.95  // 95% efficiency
```

### 3.3 Grid Charging (Off-Peak Only)

```javascript
// Only during Off-Peak hours (22:00-04:00)
if (enableGridCharge && touType === 'OFF_PEAK') {
    roomInBattery = bessCapacity - currentSoC
    actualStored = min(roomInBattery, maxInput × CHARGE_EFF)
    totalGridCharge += actualStored / 0.95
}
```

### 3.4 Discharging Logic

```javascript
// TOU Mode: Only discharge during Peak hours
// Standard: Discharge whenever there's a deficit

if (shouldDischarge && currentSoC > minSoC) {
    availableEnergy = (currentSoC - minSoC) × DISCHARGE_EFF
    outputToLoad = min(deficitEnergy, availableEnergy, maxTransferEnergy)
    deductedFromBattery = outputToLoad / 0.95
}
```

---

## 4. Time-of-Use (TOU) Pricing

### 4.1 Vietnam EVN TOU Schedule

| Period | Hours (Mon-Sat) | Hours (Sunday) |
|--------|-----------------|----------------|
| **Peak** | 09:00-11:00, 17:00-20:00 | None |
| **Normal** | 04:00-09:00, 11:00-17:00, 20:00-22:00 | 04:00-22:00 |
| **Off-Peak** | 22:00-04:00 | 22:00-04:00 |

### 4.2 EVN Tariffs (VNĐ/kWh)

#### Manufacturing (Sản xuất)

| Voltage Level | Normal | Peak | Off-Peak |
|--------------|--------|------|----------|
| 110kV+ | 1,811 | 3,266 | 1,146 |
| 22kV-110kV | 1,833 | 3,398 | 1,190 |
| 6kV-22kV | 1,899 | 3,508 | 1,234 |
| < 6kV (LV) | 1,987 | 3,640 | 1,300 |

#### Business (Kinh doanh)

| Voltage Level | Normal | Peak | Off-Peak |
|--------------|--------|------|----------|
| 22kV+ | 2,887 | 5,025 | 1,609 |
| 6kV-22kV | 3,108 | 5,202 | 1,829 |
| < 6kV (LV) | 3,152 | 5,422 | 1,918 |

### 4.3 Blended Price Calculation

```javascript
// Default consumption ratios
ratios = { normal: 60%, peak: 25%, offPeak: 15% }

blendedPrice = (normal × 0.60) + (peak × 0.25) + (offPeak × 0.15)
```

---

## 5. Inverter Selection

### 5.1 DC/AC Ratio

```javascript
targetAC = targetDC / dcAcRatio  // Default ratio: 1.25

// Example:
// 100 kWp DC → 80 kW AC capacity required
```

### 5.2 Selection Algorithm

```javascript
// Step 1: Filter valid inverters (sorted by AC power, descending)
validInverters = inverterDB
    .filter(i => i.acPower > 0 && i.maxPv > 0)
    .sort((a, b) => b.acPower - a.acPower)

// Step 2: Fill minimum AC capacity using greedy approach
while (remainingAC > 0) {
    bestFit = findOptimalInverter(remainingAC, validInverters)
    selection[bestFit.id]++
    remainingAC -= bestFit.acPower
}

// Step 3: Verify DC input limit (Max PV)
while (totalMaxPv < targetDC) {
    addLargestInverter()  // Ensure DC capacity matches
}
```

### 5.3 Inverter Clipping

```javascript
// If solar output exceeds inverter AC capacity
if (solarPowerKw > inverterMaxAcKw) {
    solarPowerKw = inverterMaxAcKw  // Clip to AC limit
}
```

---

## 6. System Losses & Derate Factors

### 6.1 Loss Components

| Loss Type | Typical Value | Description |
|-----------|---------------|-------------|
| **Temperature Loss** | 5-10% | Panel efficiency drop at high temps |
| **Soiling Loss** | 2-5% | Dust and dirt accumulation |
| **Cable Loss** | 1-3% | DC and AC wiring losses |
| **Inverter Loss** | 2-4% | Conversion efficiency |

### 6.2 System Derate Calculation

```javascript
totalLossPct = tempLoss + soilingLoss + cableLoss + inverterLoss
systemDerate = 1 - (totalLossPct / 100)

// Example:
// Losses = 5% + 3% + 2% + 3% = 13%
// Derate = 1 - 0.13 = 0.87 (87% effective)
```

---

## 7. Financial Calculations

### 7.1 Revenue/Savings Calculation

```javascript
// Year 1 Operating Income
revenueSavings = (usedPeak × pricePeak) 
               + (usedNormal × priceNormal) 
               + (usedOffPeak × priceOffPeak)

revenueExport = totalExported × gridInjectionPrice
costGridCharge = totalGridCharge × priceOffPeak

firstYearIncome = revenueSavings + revenueExport - costGridCharge
```

### 7.2 Degradation & Escalation

```javascript
// Annual adjustments
degradationFactor = (1 - degradation / 100) ^ (year - 1)  // Default: 0.55%/year
escalationFactor = (1 + escalation / 100) ^ (year - 1)    // Default: 2.0%/year

annualRevenue = firstYearIncome × degradationFactor × escalationFactor
```

### 7.3 Operating Expenses

| Expense | Default Rate | Formula |
|---------|-------------|---------|
| **O&M Cost** | 1.0% of CAPEX | `capex × omPercent × escalationFactor` |
| **Insurance** | 0.5% of CAPEX | `capex × insuranceRate` |

### 7.4 Replacement Costs

| Component | Default Life | Replacement Cost |
|-----------|-------------|------------------|
| **Battery** | 10 years | 60% of initial battery CAPEX |
| **Inverter** | 10 years | 10% of system CAPEX (excl. battery) |

### 7.5 Loan Calculation (PMT Formula)

```javascript
// Monthly payment calculation
if (rate === 0) {
    PMT = principal / nPeriods
} else {
    r = annualRate / 100 / 12
    PMT = (principal × r × (1+r)^n) / ((1+r)^n - 1)
}

// Amortization schedule (annual)
for each month:
    interest = loanBalance × monthlyRate
    principal = PMT - interest
    loanBalance -= principal
```

### 7.6 Tax & Depreciation

```javascript
// Straight-line depreciation
annualDepreciation = CAPEX / depreciationPeriod  // Default: 20 years

// Taxable income
taxableIncome = annualRevenue - omCost - insurance - depreciation - interest
if (taxableIncome < 0) taxableIncome = 0

// Corporate Income Tax (CIT)
taxPaid = taxableIncome × (taxRate / 100)  // Default: 20%
```

### 7.7 Net Present Value (NPV)

```javascript
NPV = -equity
for (year = 1; year <= projectLife; year++) {
    NPV += cashFlow[year] / (1 + discountRate / 100) ^ year
}
// Default discount rate: 10%
```

### 7.8 Internal Rate of Return (IRR)

```javascript
// Binary search approximation
low = -0.9, high = 10.0
for (iterations = 0; iterations < 100; iterations++) {
    mid = (low + high) / 2
    val = -equity
    for (year = 1; year <= projectLife; year++) {
        val += cashFlow[year] / (1 + mid) ^ year
    }
    if (abs(val) < 1) break
    if (val > 0) low = mid
    else high = mid
}
IRR = mid × 100
```

### 7.9 Payback Period

```javascript
cumulative = -equity
for (year = 1; year <= projectLife; year++) {
    prevCumulative = cumulative
    cumulative += netCashFlow[year]
    
    if (cumulative >= 0 && paybackYear === null) {
        // Interpolate to find exact payback year
        paybackYear = (year - 1) + abs(prevCumulative) / netCashFlow[year]
        break
    }
}
```

### 7.10 Return on Investment (ROI)

```javascript
ROI = (totalAccumulatedCashFlow + equity) / equity × 100

// Alternative:
ROI = (Total Benefits - Total Costs) / Total Costs × 100
```

---

## 8. System Optimization

### 8.1 Optimization Search Space

| Parameter | Search Range | Step |
|-----------|-------------|------|
| **Solar kWp** | 20% to 150% of peak load | 50 kWp |
| **BESS Hours** | [0, 1, 2, 4] hours | - |

### 8.2 BESS Sizing Heuristic

```javascript
// BESS capacity relative to solar size
bessKwh = solarKwp × bessHours × 0.25  // C&I ratio
bessKw = bessKwh / 2                    // 2-hour discharge rate
```

### 8.3 Optimization Algorithm

```javascript
// Grid search for optimal configuration
for (kwp = startKwp; kwp <= endKwp; kwp += stepKwp) {
    // Select optimal inverters for this solar size
    { totalAcKw } = selectOptimalInverters(kwp, inverterDB, dcAcRatio)
    
    for (hours of bessHourOptions) {
        bessKwh = kwp × hours × 0.25
        bessKw = bessKwh / 2
        
        // Simulate energy generation
        stats = calculateEnergy(kwp, data, bessKwh, bessKw, ...)
        
        // Calculate financials
        totalCapex = (kwp × solarPrice) + (bessKwh × bessPrice)
        fin = calculateFinancials(totalCapex, stats, prices, params)
        
        results.push({ kwp, bessKwh, payback, irr, npv, roi })
    }
}

// Sort by shortest payback period
results.sort((a, b) => a.payback - b.payback)
return { best: results[0], all: results }
```

---

### 8.4 Zero-Export Conservative Sizing (Safe Fit)

For systems where grid injection is strictly prohibited (Zero-Export), a more conservative approach is used to ensure no energy is wasted and no backfeed occurs:

1. **Base Month Selection**: Identify the month with the minimum total energy consumption (typically January in C&I projects).
2. **Daytime Load Calculation**:
   - Calculate Average Base Load (Fixed 24/7).
   - Calculate Average Variable Load (Daytime activity hours).
   - `Daytime Avg = Base Load + Variable Load`.
3. **Solar Peak Convergence**:
   - Cross-reference with the hourly load profile.
   - Find the *minimum* load recorded during peak solar hours (11:00 - 13:00) on the lowest activity days (Sundays/Weekends) of that base month.
4. **Optimal Sizing**: The target kWp is set equal to this minimum recorded load (assuming 1:1 Solar-to-Load ratio at peak).

---

## 📐 Formula Summary

| Metric | Formula |
|--------|---------|
| **Solar Energy** | `SolarUnit × kWp × Calibration × Derate` |
| **Self-Consumption Rate** | `Used / Generated` |
| **Curtailment Rate** | `Curtailed / Generated` |
| **Annual Revenue** | `Σ(Used × Price) + Export − GridCharge` |
| **NPV** | `Σ(CF_t / (1+r)^t) − Equity` |
| **IRR** | Rate where `NPV = 0` |
| **Payback** | Year when `Cumulative CF ≥ 0` |
| **ROI** | `(Accumulated + Equity) / Equity × 100` |

---

## 📦 Data Sources

| Data | Source |
|------|--------|
| **Solar Irradiance** | PVGIS, NASA POWER, local measurements |
| **EVN Tariffs** | Official EVN published rates |
| **Load Profiles** | Real C&I customer data (anonymized) |
| **Equipment Specs** | Manufacturer datasheets |

---

## 🔧 Configuration Defaults

| Parameter | Default Value |
|-----------|---------------|
| Project Life | 20 years |
| Degradation | 0.55%/year |
| Escalation | 2.0%/year |
| Discount Rate | 10% |
| O&M Cost | 1.0% of CAPEX |
| Insurance | 0.5% of CAPEX |
| DC/AC Ratio | 1.25 |
| Battery DoD | 90% |
| Battery Round-trip Eff. | 90.25% (95% × 95%) |
| CIT Rate | 20% |
| Depreciation Period | 20 years |

---

**Document Version**: 1.0  
**Last Updated**: February 2026  
**Tool Version**: Solar Optimizer v2.0
