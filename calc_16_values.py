import pandas as pd
import json

file_path = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/1. Database/7. Nhà máy Huỳnh Đức/1. Load profile/HUYNH DU LOAD PROFILE (09-2024 TO 09-2025).xlsx"
TOTAL_PV_ANNUAL = 412162

# Fixed daily profile pattern (normalized to 1.0)
daily_profile_raw = {
    "06:00": 0.010, "06:30": 0.020, "07:00": 0.040, "07:30": 0.060,
    "08:00": 0.080, "08:30": 0.100, "09:00": 0.110, "09:30": 0.120,
    "10:00": 0.125, "10:30": 0.130, "11:00": 0.130, "11:30": 0.130,
    "12:00": 0.125, "12:30": 0.120, "13:00": 0.110, "13:30": 0.100,
    "14:00": 0.080, "14:30": 0.060, "15:00": 0.040, "15:30": 0.020,
    "16:00": 0.010,
}
sum_prof = sum(daily_profile_raw.values())
daily_prof = {k: v / sum_prof for k, v in daily_profile_raw.items()}

def get_tariff(dt):
    if dt.weekday() == 6: # Sunday = 6 in Python
        if dt.hour >= 22 or dt.hour < 4: return 'TD'
        return 'BT'
    
    if dt.hour >= 22 or dt.hour < 4: return 'TD'
    time_val = dt.hour * 60 + dt.minute
    if (9*60+30 <= time_val < 11*60+30) or (17*60 <= time_val < 20*60):
        return 'CD'
    return 'BT'

try:
    print("Reading Excel...")
    df = pd.read_excel(file_path, sheet_name=None)
    sheet_name = [s for s in ['Summary', 'Data', 'Load Profile', 'Sheet1'] if s in df.keys()]
    sheet_name = sheet_name[0] if sheet_name else list(df.keys())[0]
    
    df = df[sheet_name]
    
    print("Processing data...")
    # Find meter time column and Power column
    # Typically meter time is column 2 (index 1), Total P is column 6 (index 5) depending on header row. 
    # Row 4 in Excel = Index 3 in pandas
    data_start = 4 
    valid_data = df.iloc[data_start:].copy()
    
    valid_data.columns = df.iloc[3].tolist() # Row 5 in Excel is headers usually
    
    # Let's extract values safely to avoid Pandas column name mismatches
    total_PV = 0; pv_used = 0; pv_curtailed = 0; grid_import = 0; total_load = 0
    pv_used_bt = 0; pv_used_cd = 0; pv_curtailed_bt = 0; pv_curtailed_cd = 0
    
    dates = set()
    rows = []
    
    for _, row in valid_data.iterrows():
        try:
            val = row.iloc[2] # Timestamp
            if pd.isna(val): continue
            
            # Format handling for Excel dates/timestamps
            if isinstance(val, (int, float)):
                dt = pd.to_datetime(val, unit='D', origin='1899-12-30')
            else:
                dt = pd.to_datetime(val)
                
            dates.add(dt.date())
            
            load_kW = float(row.iloc[6]) if not pd.isna(row.iloc[6]) else 0
            rows.append({"dt": dt, "load_kW": load_kW})
        except Exception:
            continue
            
    total_days = len(dates) if len(dates)>0 else 365
    pv_per_day = TOTAL_PV_ANNUAL / total_days
    print(f"Total days: {total_days}, PV/day: {pv_per_day}")
    
    for r in rows:
        dt = r['dt']
        load_kwh = r['load_kW'] * 0.5
        total_load += load_kwh
        
        hm_str = dt.strftime("%H:%M")
        pv_kwh = daily_prof.get(hm_str, 0) * pv_per_day
        
        total_PV += pv_kwh
        used = min(load_kwh, pv_kwh)
        curtailed = pv_kwh - used
        grid = load_kwh - used
        
        pv_used += used
        pv_curtailed += curtailed
        grid_import += grid
        
        tariff = get_tariff(dt)
        if tariff == 'BT':
            pv_used_bt += used
            pv_curtailed_bt += curtailed
        elif tariff == 'CD':
            pv_used_cd += used
            pv_curtailed_cd += curtailed
            
    res = {
        "1. PV Total": total_PV,
        "2. PV Used": pv_used,
        "3. % PV Used": (pv_used/total_PV)*100 if total_PV else 0,
        "4. PV Curtailed": pv_curtailed,
        "5. % PV Curtailed": (pv_curtailed/total_PV)*100 if total_PV else 0,
        "6. Grid": grid_import,
        "7. Load Consumption": total_load,
        "9. PV Used BT": pv_used_bt,
        "11. PV Used CD": pv_used_cd,
        "13. PV Cur BT": pv_curtailed_bt,
        "15. PV Cur CD": pv_curtailed_cd
    }
    
    with open("py_result.json", "w") as f:
        json.dump(res, f, indent=4)
        
    print("Done! Open py_result.json")
    
except Exception as e:
    print("Error:", e)
