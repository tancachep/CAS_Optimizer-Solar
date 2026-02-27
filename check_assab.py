import pandas as pd
import sys

file_path = "d:\\TOOL GOOGLE ANTIGRAVITY\\2. Tool Tính toán công suất\\1. Database\\Make_Template_ASSAB.xlsx"

try:
    xl = pd.ExcelFile(file_path)
    print("Sheet names:")
    for sheet in xl.sheet_names:
        print(f"- {sheet}")
        try:
            df = xl.parse(sheet, nrows=5)
            print(f"  Columns: {list(df.columns)}")
        except Exception as e:
            print(f"  Error reading sheet: {e}")
except Exception as e:
    print(f"Error opening Excel file: {e}")
