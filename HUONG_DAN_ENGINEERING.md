# 🔧 HƯỚNG DẪN KỸ THUẬT - SOLAR OPTIMIZER
## Dành cho đội ngũ Kỹ thuật (Engineering Team)

> **Phiên bản**: v2.0 | **Cập nhật**: Tháng 3/2026  
> **Mục đích**: Tài liệu kỹ thuật đầy đủ về logic tính toán, cấu hình hệ thống, và workflow kỹ thuật của Solar Optimizer.

---

## 📑 Mục Lục

1. [Kiến trúc hệ thống](#1-kiến-trúc-hệ-thống)
2. [Dữ liệu đầu vào & Parsers](#2-dữ-liệu-đầu-vào--parsers)
3. [Logic tính toán năng lượng mặt trời](#3-logic-tính-toán-năng-lượng-mặt-trời)
4. [Load Profile & Synthetic Generation](#4-load-profile--synthetic-generation)
5. [Hệ thống giá điện EVN (TOU)](#5-hệ-thống-giá-điện-evn-tou)
6. [Inverter Selection Algorithm](#6-inverter-selection-algorithm)
7. [BESS Simulation Engine](#7-bess-simulation-engine)
8. [System Losses & Derate Factors](#8-system-losses--derate-factors)
9. [Financial Model & Formulas](#9-financial-model--formulas)
10. [Optimization Engine](#10-optimization-engine)
11. [Peak Shaving & Demand Charge](#11-peak-shaving--demand-charge)
12. [PDF Report Generation](#12-pdf-report-generation)
13. [Configuration Defaults & Overrides](#13-configuration-defaults--overrides)
14. [Troubleshooting & Debug](#14-troubleshooting--debug)

---

## 1. Kiến trúc hệ thống

### 1.1 Tech Stack

| Layer | Công nghệ |
|-------|----------|
| **Frontend** | React + Vite |
| **Styling** | TailwindCSS |
| **Charts** | Recharts (ComposedChart, AreaChart, ScatterChart) |
| **Auth** | Supabase Auth |
| **PDF Export** | html-to-image + jsPDF |
| **Data Parsing** | XLSX (SheetJS), PapaParse |

### 1.2 Cấu trúc thư mục

```
src/
├── App.jsx                     # Entry point, xử lý auth + role routing
├── SolarOptimizer.jsx          # Component chính (3696 lines)
├── domain/
│   ├── entities/               # Data models
│   ├── usecases/
│   │   ├── CalculateEnergyGeneration.js   # Core energy simulation
│   │   ├── CalculateFinancials.js         # Financial model
│   │   └── CalculatePeakShaving.js        # Peak shaving logic
│   └── repositories/
├── infra/
│   ├── parsers.js              # All data format parsers
│   └── supabaseClient.js       # Auth configuration
├── presentation/
│   ├── features/
│   │   ├── auth/LoginPage.jsx
│   │   ├── dashboard/Dashboard.jsx
│   │   ├── design/Design.jsx
│   │   ├── finance/Finance.jsx
│   │   └── report/Report.jsx
│   ├── components/
│   │   ├── BillInputModal.jsx  # Nhập hóa đơn EVN
│   │   ├── FormulaModal.jsx    # Hiển thị công thức
│   │   └── SmartDesignSelector.jsx  # Design mode selector
│   └── hooks/
│       ├── useSolarSystemData.js    # Data management hook
│       ├── useSolarConfiguration.js  # System config hook
│       └── useFinancialModel.js     # Financial params hook
├── utils/
│   ├── inverterOptimizer.js     # Inverter selection algorithm
│   ├── loadProfileGenerator.js  # Synthetic load generation
│   ├── loadProfilesData.js      # 20+ pre-built profiles
│   └── dateParsing.js           # Date format utilities
└── data/
    ├── provinces.json           # 63 provinces + PSH data
    ├── evn_tariffs.js           # EVN price tables
    └── sources/
        └── HardwareDatabase.js  # Panel, Inverter, BESS specs
```

### 1.3 Role-based Access

```javascript
// App.jsx – Role detection from email
const getUserRole = (user) => {
    if (!user?.email) return 'engineer';
    return user.email.toLowerCase().includes('sale') ? 'sales' : 'engineer';
};
```

- **`sales`**: UI đơn giản hóa, ẩn các tùy chọn kỹ thuật nâng cao.
- **`engineer`**: Full access tất cả features, chỉnh sửa mọi thông số.

---

## 2. Dữ liệu đầu vào & Parsers

### 2.1 Supported Data Formats

Hệ thống hỗ trợ nhiều format dữ liệu thông qua module `infra/parsers.js`:

| Parser | Format | Mô tả |
|--------|--------|-------|
| `parseGSAExcel` | Excel (.xlsx) | Global Solar Atlas export |
| `parseMETData` | CSV/Excel | Meteorological data |
| `parsePDFData` | Extracted data | PDF text extraction |
| `parsePVSystCSV` | CSV | PVsyst simulation output |
| `parseStandardCSV` | CSV | Generic hourly data |
| `processExcelData` | Excel (.xlsx) | Generic load profile Excel |
| `parseSmartDesignData` | Internal | Smart Design generated profiles |
| `parseTMYData` | CSV | Typical Meteorological Year |
| `parse8760Data` | CSV/JSON | 8760 hourly annual data |
| `parseGSAMapData` | JSON | GSA map export data |

### 2.2 Solar Profile Sources

Mỗi tỉnh thành có file JSON pre-computed với 8760 giá trị hourly:

```
public/data/gsa/{province_id}.json
```

**Loading flow:**
```javascript
// SolarOptimizer.jsx:896-920
useEffect(() => {
    fetch(`/data/gsa/${selectedProvince.id}.json?v=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data) && data.length === 8760) {
                setLoadedGsaProfile(data);  // Dữ liệu 8760h từ GSA
            }
        });
}, [selectedProvince]);
```

### 2.3 Province Data Structure

```json
{
  "id": "ho_chi_minh",
  "name": "TP. Hồ Chí Minh",
  "peakSunHours": 4.02,
  "yield_yearly": 1467,
  "monthly_distribution": [135, 120, 149, 147, 136, 113, 116, 119, 105, 111, 110, 106],
  "icon": "🏙️"
}
```

**Ý nghĩa `monthly_distribution`:** Hệ số phân phối sản lượng theo 12 tháng. Tổng 12 tháng ≈ `yield_yearly`. Được dùng để generate solar profile hình dạng thực tế theo mùa.

---

## 3. Logic tính toán năng lượng mặt trời

### 3.1 Core Formula

```
Solar Power (kW) = Solar Unit × System Size (kWp) × Calibration Factor × System Derate
```

Trong đó:
- **Solar Unit**: Giá trị bức xạ hourly per kWp (từ GSA 8760 data hoặc synthetic curve)
- **System Size**: Công suất DC lắp đặt (kWp)
- **Calibration Factor**: Hệ số hiệu chỉnh user (default = 100%)
- **System Derate**: Tổng hiệu suất sau tổn thất (xem mục 8)

### 3.2 Solar Profile Generation

Có 2 mode tạo solar profile:

#### Mode 1: Realistic (từ GSA data)
- Sử dụng 8760 giá trị hourly thực tế từ Global Solar Atlas.
- Phản ánh biến động thời tiết, mây che, mùa.

#### Mode 2: Smooth Sine Wave
- Sử dụng hàm toán học (sine curve) tạo profile mượt.
- Dùng khi không có data GSA hoặc cần so sánh đơn giản.

```javascript
// Trong generateSolarProfile() - infra/parsers.js
// Tạo profile từ monthly_distribution:
// Phân bổ sản lượng tháng → giá trị hourly
// Peak tại 12:00, sunrise/sunset theo mùa
```

### 3.3 Inverter Clipping (AC Capping)

```javascript
// Nếu DC output > AC inverter capacity → clip
if (solarPowerKw > inverterMaxAcKw) {
    solarPowerKw = inverterMaxAcKw;  // Giới hạn tại AC inverter
}
```

Đây là hiệu ứng "clipping" xảy ra khi DC/AC ratio > 1.0. Ví dụ: 100 kWp DC với inverter 80 kW AC (ratio 1.25) sẽ bị clip tại 80 kW vào giờ cao điểm.

---

## 4. Load Profile & Synthetic Generation

### 4.1 Pre-built Load Profiles

File `utils/loadProfilesData.js` chứa **20+ pre-defined load profiles** dựa trên data thực C&I:

| ID | Loại | Đặc điểm |
|----|------|----------|
| `commercial_day` | Kinh doanh – Đỉnh ban ngày | Peak 9:00-17:00 |
| `commercial_night` | Kinh doanh – Đỉnh ban đêm | Peak 17:00-22:00 |
| `commercial_double` | Kinh doanh – 2 đỉnh | 9:00-12:00 & 17:00-20:00 |
| `manufacturing_flat` | Sản xuất – Phụ tải đều | Constant 24/7 |
| `manufacturing_double` | Sản xuất – 2 ca | 8:00-17:00 & 13:00-18:00 |
| `manufacturing_triple` | Sản xuất – 3 ca | 3 × 8-hour shifts |
| `residential_day` | Sinh hoạt – Ngày | 8:00-18:00 |
| `residential_evening` | Sinh hoạt – Chiều tối | 17:00-21:00 |

### 4.2 Synthetic Profile Generation Algorithm

```javascript
// utils/loadProfileGenerator.js → generateSyntheticProfile()

// Bước 1: Normalize trọng số giờ (tổng = 1)
normalizedWeight[hour] = baseProfile[hour] / sum(baseProfile)

// Bước 2: Tính ngày làm việc vs ngày nghỉ
offDayRatio = baseLoadPct / 100     // Default: 15% so với ngày thường
avgDailyWork = monthlyKWh / (workingDays + offDays × offDayRatio)

// Bước 3: Áp dụng tiêu thụ theo ngày
dailyTotal = isWorkDay ? avgDailyWork : (avgDailyWork × offDayRatio)

// Bước 4: Phát sinh giá trị hourly với noise
hourlyLoad = dailyTotal × normalizedWeight[hour] × randomFactor(±10%)

// Bước 5: Tăng tải mùa hè (cooling boost) cho tháng 5-7
if (hasCooling && month ∈ [4,5,6] && hour ∈ [12,16]) {
    hourlyLoad *= 1.20  // +20% cooling load
}
```

### 4.3 Special Load Modifiers

| Modifier | Ảnh hưởng |
|----------|-----------|
| **EV Charging** | +15% load trong 18:00-22:00 |
| **Heat Pump** | +5% constant 24/7 |
| **Machinery** | +15% trong 8:00-17:00 |
| **Weekend Schedule** | Cấu hình theo ngày (T2-CN) |

---

## 5. Hệ thống giá điện EVN (TOU)

### 5.1 TOU Schedule

```javascript
// SolarOptimizer.jsx:53-68
const isPeakHour = (date) => {
    const day = date.getDay();
    const hour = date.getHours();
    const minute = date.getMinutes();
    if (day === 0) return false;          // Chủ nhật: không có peak
    if (hour === 9 && minute >= 30) return true;  // 09:30-11:30
    if (hour === 10) return true;
    if (hour === 11 && minute < 30) return true;
    if (hour >= 17 && hour < 20) return true;     // 17:00-20:00
    return false;
};

const isOffPeakHour = (date) => {
    const hour = date.getHours();
    return (hour >= 22 || hour < 4);     // 22:00-04:00
};
// Bình thường = phần còn lại
```

### 5.2 EVN Tariff Tables

Source: `data/evn_tariffs.js`

#### Sản xuất (Manufacturing)

| Cấp điện áp | Bình thường | Cao điểm | Thấp điểm |
|-------------|-------------|----------|-----------|
| 110kV+ | 1,811 | 3,266 | 1,146 |
| 22kV-110kV | 1,833 | 3,398 | 1,190 |
| 6kV-22kV | 1,899 | 3,508 | 1,234 |
| < 6kV (LV) | 1,987 | 3,640 | 1,300 |

#### Kinh doanh (Business)

| Cấp điện áp | Bình thường | Cao điểm | Thấp điểm |
|-------------|-------------|----------|-----------|
| 22kV+ | 2,887 | 5,025 | 1,609 |
| 6kV-22kV | 3,108 | 5,202 | 1,829 |
| < 6kV (LV) | 3,152 | 5,422 | 1,918 |

### 5.3 Blended Price Calculation

```javascript
// Tỷ lệ tiêu thụ mặc định
ratios = { normal: 60%, peak: 25%, offPeak: 15% }

blendedPrice = (price_normal × 0.60) + (price_peak × 0.25) + (price_offPeak × 0.15)
```

### 5.4 Two-Part Tariff (Biểu giá 2 thành phần)

System cũng hỗ trợ tính **Demand Charge** (Giá công suất) qua `getTwoPartTariff()` trong `data/evn_tariffs.js`, cho phép tính Peak Shaving savings.

---

## 6. Inverter Selection Algorithm

### 6.1 DC/AC Ratio

```javascript
targetAC = targetDC / dcAcRatio  // Default dcAcRatio = 1.25
// Ví dụ: 100 kWp DC → 80 kW AC inverter capacity
```

### 6.2 Selection Logic

File: `utils/inverterOptimizer.js` → `selectOptimalInverters()`

```javascript
// Step 1: Filter inverters có AC power > 0 và maxPv > 0
// Sort theo AC power giảm dần
validInverters = inverterDB
    .filter(i => i.acPower > 0 && i.maxPv > 0)
    .sort((a, b) => b.acPower - a.acPower)

// Step 2: Greedy fill – Chọn inverter lớn nhất phù hợp
while (remainingAC > 0) {
    bestFit = findOptimalInverter(remainingAC, validInverters)
    selection[bestFit.id]++
    remainingAC -= bestFit.acPower
}

// Step 3: Verify DC input limit
while (totalMaxPv < targetDC) {
    addLargestInverter()  // Đảm bảo đủ DC capacity
}
```

### 6.3 Hardware Database

File: `data/sources/HardwareDatabase.js` → `INVERTER_DB`, `PANEL_SPECS`, `BESS_DB`

Chứa specs của các inverter, tấm pin, và BESS từ các nhà sản xuất (Huawei, Sungrow, Growatt...).

---

## 7. BESS Simulation Engine

### 7.1 Parameters

| Tham số | Giá trị | Mô tả |
|---------|---------|-------|
| Charge Efficiency | 95% | Hiệu suất sạc |
| Discharge Efficiency | 95% | Hiệu suất xả |
| Round-trip Efficiency | 90.25% | (0.95 × 0.95) |
| Depth of Discharge (DoD) | 90% | Dung lượng sử dụng tối đa |
| Minimum SoC | Capacity × (1 - DoD) | Dung lượng dự phòng |

### 7.2 Charging from Solar Excess

```javascript
roomInBattery = bessCapacity - currentSoC
maxInput = min(excessSolar, maxTransferEnergy)
realChargeInput = min(maxInput, roomInBattery / CHARGE_EFF)
actualStored = realChargeInput × 0.95
```

### 7.3 Grid Charging (Off-Peak Only)

```javascript
// Chỉ sạc từ lưới trong giờ thấp điểm (22:00-04:00)
if (enableGridCharge && touType === 'OFF_PEAK') {
    roomInBattery = bessCapacity - currentSoC
    actualStored = min(roomInBattery, maxInput × CHARGE_EFF)
    totalGridCharge += actualStored / 0.95  // Track grid kWh consumed
}
```

### 7.4 Discharging Logic

```javascript
// TOU Mode: Chỉ xả vào giờ cao điểm (Peak Shaving)
// Standard: Xả khi thiếu hụt năng lượng

if (shouldDischarge && currentSoC > minSoC) {
    availableEnergy = (currentSoC - minSoC) × DISCHARGE_EFF
    outputToLoad = min(deficitEnergy, availableEnergy, maxTransferEnergy)
    deductedFromBattery = outputToLoad / 0.95
}
```

### 7.5 BESS Strategy Modes

| Strategy | Logic |
|----------|-------|
| **`standard`** | Sạc từ solar excess, xả khi có deficit |
| **`peak-shaving`** | Sạc off-peak, xả chỉ trong giờ peak |

### 7.6 BESS Sizing Heuristic

```javascript
bessKwh = solarKwp × bessHours × 0.25  // C&I ratio
bessKw  = bessKwh / 2                    // 2-hour discharge rate (C/2)
```

---

## 8. System Losses & Derate Factors

### 8.1 Loss Components

| Loại tổn thất | Giá trị điển hình | Mô tả |
|---------------|-------------------|-------|
| Temperature Loss | 5-10% | Hiệu suất giảm khi nhiệt độ panel > 25°C |
| Soiling Loss | 2-5% | Bụi, lá cây, chim... |
| Cable Loss | 1-3% | Tổn thất DC & AC wiring |
| Inverter Loss | 2-4% | Hiệu suất chuyển đổi DC→AC |

### 8.2 Derate Calculation

```javascript
totalLossPct = tempLoss + soilingLoss + cableLoss + inverterLoss
systemDerate = 1 - (totalLossPct / 100)

// Ví dụ: 5% + 3% + 2% + 3% = 13% total loss
// systemDerate = 0.87 (87% effective)
```

> [!IMPORTANT]
> Khi sử dụng dữ liệu **PVOUT từ Global Solar Atlas**, data đã bao gồm losses. Trong trường hợp này, các giá trị loss nên đặt = 0% để tránh tính tổn thất 2 lần (double-counting).

---

## 9. Financial Model & Formulas

### 9.1 Revenue/Savings Calculation (Year 1)

Source: `domain/usecases/CalculateFinancials.js`

```javascript
// Doanh thu tiết kiệm = Solar sử dụng × Giá điện theo khung giờ
revenueSavings = (usedPeak × pricePeak) 
               + (usedNormal × priceNormal) 
               + (usedOffPeak × priceOffPeak)

// Doanh thu bán điện (nếu cho phép)
revenueExport = totalExported × gridInjectionPrice

// Chi phí sạc pin từ lưới
costGridCharge = totalGridCharge × priceOffPeak

// Thu nhập năm 1
firstYearIncome = revenueSavings + revenueExport - costGridCharge
```

### 9.2 Degradation & Escalation

```javascript
// Suy giảm sản lượng hàng năm
degradationFactor = (1 - degradation/100) ^ (year - 1)   // Default: 0.55%/year

// Tăng giá điện hàng năm
escalationFactor = (1 + escalation/100) ^ (year - 1)      // Default: 2.0%/year

// Thu nhập năm Y
annualRevenue = firstYearIncome × degradationFactor × escalationFactor
```

### 9.3 Operating Expenses

```javascript
// O&M Cost (tăng theo giá)
omCost = capex × (omPercent/100) × escalationFactor  // Default: 1.0-1.5%

// Insurance (cố định)
insuranceCost = capex × insuranceRate                  // Default: 0.5%
```

### 9.4 Equipment Replacement

| Thiết bị | Tuổi thọ mặc định | Chi phí thay thế |
|----------|-------------------|-----------------|
| **Battery** | 10 năm | 60% giá trị BESS ban đầu |
| **Inverter** | 10-20 năm (cấu hình được) | 10% CAPEX (trừ BESS) |

### 9.5 Loan Calculation (PMT)

```javascript
// Trả góp hàng tháng (PMT Formula)
if (rate === 0) {
    PMT = principal / nPeriods
} else {
    r = annualRate / 100 / 12      // Monthly rate
    n = term × 12                   // Total months
    PMT = (principal × r × (1+r)^n) / ((1+r)^n - 1)
}

// Amortization schedule (tổng hợp theo năm)
for each month:
    interest = loanBalance × monthlyRate
    principalPayment = PMT - interest
    loanBalance -= principalPayment
```

### 9.6 Tax & Depreciation

```javascript
// Khấu hao đường thẳng
annualDepreciation = CAPEX / depreciationPeriod  // Default: 20 năm

// Thu nhập chịu thuế
taxableIncome = annualRevenue - omCost - insurance - depreciation - interest
if (taxableIncome < 0) taxableIncome = 0

// Thuế TNDN
taxPaid = taxableIncome × (taxRate / 100)  // Default: 20%
```

### 9.7 NPV (Net Present Value)

```javascript
NPV = -equity
for (year = 1; year <= projectLife; year++) {
    NPV += cashFlow[year] / (1 + discountRate/100) ^ year
}
// Default discount rate: 10%
```

### 9.8 IRR (Internal Rate of Return)

```javascript
// Binary search (Newton's method approximation)
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
IRR = mid × 100  // Convert to percentage
```

### 9.9 Payback Period

```javascript
cumulative = -equity
for (year = 1; year <= projectLife; year++) {
    prevCumulative = cumulative
    cumulative += netCashFlow[year]
    
    if (cumulative >= 0 && paybackYear === null) {
        // Linear interpolation cho payback chính xác
        paybackYear = (year - 1) + abs(prevCumulative) / netCashFlow[year]
        break
    }
}
```

### 9.10 ROI (Return on Investment)

```javascript
ROI = (totalAccumulatedCashFlow + equity) / equity × 100
```

### 9.11 Carbon Credit Revenue

```javascript
// Tính doanh thu Carbon
co2SavedTons = totalSolarUsed × CO2_KG_PER_KWH / 1000
carbonRevenue = co2SavedTons × carbonPrice × usdExchangeRate  // VND
```

**Environmental Constants:**
```javascript
const CO2_KG_PER_KWH = 0.816    // Vietnam Grid Emission Factor
const TREES_PER_CO2_KG = 0.06   // ~16.7 kg CO2/tree/year
const COAL_KG_PER_KWH = 0.4     // Standard Coal equivalent
const OIL_LITERS_PER_KWH = 0.25 // Standard Oil equivalent
```

---

## 10. Optimization Engine

### 10.1 Grid Search Algorithm

```javascript
// domain/usecases hoặc useSolarConfiguration hook

// Search space
startKwp = peakLoad × 0.20   // 20% of peak load
endKwp   = peakLoad × 1.50   // 150% of peak load
stepKwp  = 50                 // 50 kWp increment
bessHourOptions = [0, 1, 2, 4] // Hours of storage

for (kwp = startKwp; kwp <= endKwp; kwp += stepKwp) {
    { totalAcKw } = selectOptimalInverters(kwp, inverterDB, dcAcRatio)
    
    for (hours of bessHourOptions) {
        bessKwh = kwp × hours × 0.25
        bessKw = bessKwh / 2
        
        stats = calculateEnergy(kwp, data, bessKwh, bessKw, ...)
        
        totalCapex = (kwp × solarPrice) + (bessKwh × bessPrice)
        fin = calculateFinancials(totalCapex, stats, prices, params)
        
        results.push({ kwp, bessKwh, payback, irr, npv, roi })
    }
}

// Sort by shortest payback
results.sort((a, b) => a.payback - b.payback)
return { best: results[0], all: results }
```

### 10.2 Zero-Export Conservative Sizing (Safe Fit)

Algorithm cho hệ thống không xuất lưới:

```
1. Xác định tháng có tiêu thụ thấp nhất (thường T1 cho C&I)
2. Tính Average Base Load (phần tải 24/7 cố định)
3. Tính Average Variable Load (phần tải giờ hoạt động)
4. Tìm giá trị tải TỐI THIỂU trong giờ peak solar (11:00-13:00) 
   vào ngày nghỉ (CN) của tháng đó
5. Target kWp = giá trị tải tối thiểu đó (1:1 ratio)
```

> [!WARNING]
> Safe Fit rất bảo thủ. Thường cho kết quả thấp hơn 30-50% so với Optimal. Chỉ dùng khi khách hàng **tuyệt đối không muốn** bất kỳ điện dư thừa nào.

---

## 11. Peak Shaving & Demand Charge

### 11.1 Peak Shaving Simulation

Source: `domain/usecases/CalculatePeakShaving.js`

```javascript
// simulatePeakShaving(hourlyData, bessKw, bessKwh, ...)
// Mô phỏng 8760 giờ, tìm optimal threshold để cắt đỉnh

// calculateDemandChargeSavings(originalPeak, newPeak, tariff)
// Tính tiết kiệm từ giảm demand charge
```

### 11.2 Two-Part Tariff

Biểu giá 2 thành phần = **Giá năng lượng (kWh)** + **Giá công suất (kW)**

Khi BESS xả vào giờ peak, nó giảm peak demand → giảm demand charge → tiết kiệm thêm ngoài energy savings.

---

## 12. PDF Report Generation

### 12.1 Workflow

```javascript
// Sử dụng html-to-image + jsPDF
// 1. Render các section vào hidden DOM elements
// 2. Capture mỗi section thành image (html-to-image)
// 3. Ghép images vào PDF pages (jsPDF)
// 4. Download file PDF
```

### 12.2 Configurable Sections

Các phần có thể bật/tắt trong PDF:

| Section Key | Nội dung |
|-------------|---------|
| `overview` | Tổng quan & Sản lượng tháng |
| `system_config` | Cấu hình hệ thống & Kịch bản |
| `daily_charts` | Biểu đồ ngày & Tuần |
| `energy_dispatch` | Biểu đồ Điều độ Năng lượng |
| `correlation` | Biểu đồ tương quan Load-Solar |
| `monthly_table` | Bảng số liệu tháng |
| `power_curves` | Power Curve 12 tháng |
| `detailed_specs` | Thông số chi tiết |
| `cashflow` | Biểu đồ dòng tiền |
| `cashflow_table` | Bảng chi tiết dòng tiền |
| `investment_analysis` | Phân tích hiệu quả đầu tư |
| `env_impact` | Hiệu quả Môi trường |

---

## 13. Configuration Defaults & Overrides

### 13.1 System Defaults

| Parameter | Default | Source |
|-----------|---------|--------|
| Project Life | 20 years | `useFinancialModel` |
| Degradation | 0.5%/year | `finParams.degradation` |
| Escalation | 2.0%/year | `finParams.escalation` |
| Discount Rate | 10% | `finParams.discountRate` |
| O&M Cost | 1.0-1.5% of CAPEX | `finParams.omPercent` |
| DC/AC Ratio | 1.25 | `useSolarConfiguration` |
| Battery DoD | 90% | Hardcoded |
| Battery Efficiency | 95% × 95% = 90.25% | Hardcoded |
| CIT Rate | 20% | `finParams` |
| Depreciation | 20 years (straight-line) | `finParams` |
| Solar Price | 12,000,000 VNĐ/kWp | `params.systemPrice` |
| BESS Price | 9,000,000 VNĐ/kWh | `params.bessPrice` |

### 13.2 Loan Defaults

| Parameter | Default |
|-----------|---------|
| Enable | `false` |
| Ratio | 70% of CAPEX |
| Interest Rate | 8.0%/year |
| Term | 10 years |

### 13.3 Weather Scenarios

Source: `useSolarConfiguration.js` → `WEATHER_SCENARIOS`

Cho phép apply hệ số thời tiết (tốt/trung bình/xấu) lên solar output để stress-test tài chính.

---

## 14. Troubleshooting & Debug

### 14.1 Common Issues

| Vấn đề | Nguyên nhân | Giải pháp |
|--------|------------|-----------|
| Solar output = 0 | Chưa chọn tỉnh hoặc chưa load solar layer | Chọn tỉnh ở sidebar |
| Sản lượng quá cao/thấp | Loss factors sai | Kiểm tra PVOUT vs PSH mode |
| PDF blank pages | Browser memory limit | Giảm số sections trong PDF config |
| Financial numbers sai | Double-counting losses | Nếu dùng PVOUT data → đặt loss = 0 |
| Load Profile shape lạ | File format không đúng | Kiểm tra parser logs trong console |

### 14.2 Debug Scripts

Repo chứa nhiều debug/analysis scripts (chạy bằng Node.js):

```bash
# Kiểm tra load profile
node check_load_profile.cjs

# So sánh với PVsyst data
node compare_pvsyst.js

# Debug Excel parsing
node debug-load-excel.js

# Verify province data
node fix_provinces.cjs
```

### 14.3 Formula Verification

Tool có **FormulaModal** (`presentation/components/FormulaModal.jsx`) hiển thị tất cả công thức đang được dùng. Access qua nút **"Xem Công Thức"** trong sidebar.

### 14.4 Console Logging

Các quá trình quan trọng có console log:
- Load province GSA data: `"Failed to load GSA profile for province"`
- Inverter selection: Log trong `inverterOptimizer.js`
- Energy calculation: Log trong `CalculateEnergyGeneration.js`

> [!TIP]
> Mở **DevTools Console** (F12) khi debug. Filter log bằng keyword `"solar"`, `"inverter"`, `"bess"`.

---

## 📐 Quick Reference – Formula Summary

| Metric | Formula |
|--------|---------|
| **Solar Energy** | `SolarUnit × kWp × Calibration × Derate` |
| **Self-Consumption Rate** | `Used / Generated × 100` |
| **Curtailment Rate** | `Curtailed / Generated × 100` |
| **Annual Revenue** | `Σ(Used × TOU_Price) + Export − GridCharge` |
| **NPV** | `Σ(CF_t / (1+r)^t) − Equity` |
| **IRR** | Rate where `NPV = 0` (binary search) |
| **Payback** | Year where `Cumulative CF ≥ 0` (interpolated) |
| **ROI** | `(Accumulated + Equity) / Equity × 100` |
| **LCOE** | `Total Lifetime Cost / Total Lifetime Energy` |
| **CO₂ Saved** | `kWh × 0.816 / 1000` (tons/year) |

---

## 📦 Data Sources

| Data | Source |
|------|--------|
| Solar Irradiance | PVGIS, NASA POWER, Global Solar Atlas |
| EVN Tariffs | Official EVN published rates (2024-2025) |
| Load Profiles | Real C&I customer data (anonymized) |
| Equipment Specs | Manufacturer datasheets (Huawei, Sungrow, Growatt...) |
| Province PSH | GSA + local measurement validation |

---

*© 2026 CAS Energy Solutions – Solar Optimizer v2.0 – Engineering Documentation*
