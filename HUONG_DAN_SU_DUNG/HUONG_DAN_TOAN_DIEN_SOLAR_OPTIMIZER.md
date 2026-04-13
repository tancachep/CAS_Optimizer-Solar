# 🚀 HÀNH TRÌNH TÍNH TOÁN SOLAR OPTIMIZER
## TỪ ĐĂNG NHẬP ĐẾN XUẤT BÁO CÁO
---
*Tài liệu hướng dẫn Engineer thực hiện quy trình tính toán khép kín.*
*Tách riêng 2 luồng: Import Load Profile và Nhập EVN Bill.*

---
---

# ═══════════════════════════════════════════
# CASE 1: IMPORT LOAD PROFILE (Dữ liệu đo đếm thực tế)
# ═══════════════════════════════════════════

*Áp dụng khi khách hàng có file đo đếm Smart Meter (Excel/CSV) ghi nhận công suất tiêu thụ theo bước 15p, 30p hoặc 1h.*

---

## Bước 1.1: Đăng nhập & Khởi tạo Dự án
- **Thao tác**: Truy cập web tool → Đăng nhập → Nhấn **"Dự án mới"**.
- **Nhập**: Tên dự án, Đơn vị tư vấn.
- **Logic hệ thống**: Tool khởi tạo bộ nhớ rỗng cho 8,760 điểm dữ liệu (tương ứng 8,760 giờ trong năm) và thiết lập các hằng số tính toán (CO2 = 0.816 kg/kWh, Than = 0.4 kg/kWh, Dầu = 0.25 lít/kWh).

---

## Bước 1.2: Chọn Khu vực & Dữ liệu Nắng
- **Thao tác**: Tại Sidebar, chọn **Tỉnh/Thành phố** (ví dụ: Bình Dương, TP.HCM).
- **Logic hệ thống**:
  1. Tool truy vấn database **GSA (Global Solar Atlas)** tích hợp sẵn theo tọa độ tỉnh.
  2. Tải bộ dữ liệu bức xạ **TMY (Typical Meteorological Year)** gồm 8,760 giá trị bức xạ (W/m²).
  3. Tạo "Hồ sơ nắng" cơ sở hiển thị trên Dashboard (đường cong vàng).
- **Kết quả**: Đường cong Solar Profile xuất hiện trên biểu đồ.

---

## Bước 1.3: Upload & Mapping Load Profile
- **Thao tác**: Click nút **"Select Load Profile"** → Chọn file Excel/CSV từ máy tính.
- **Logic hệ thống**:
  1. Tool đọc file và tự động nhận diện cấu trúc (Cột Thời gian, Cột Giá trị kW).
  2. Nếu file có định dạng đặc biệt (PVSyst, MET, GSA Export), tool tự chọn parser phù hợp.
  3. Dữ liệu được chuyển đổi về dạng chuẩn: mảng 8,760 điểm {timestamp, load_kW}.
- **Lưu ý cho Engineer**: Kiểm tra xem biểu đồ Preview có "nhảy điểm" (outlier) không. Nếu có, dữ liệu nguồn có thể bị lỗi.

---

## Bước 1.4: Tinh chỉnh Dữ liệu (Interpolate & Tuning)
- **Thao tác**: Nhấn nút **"Interpolate 30m"** (Nếu dữ liệu gốc là bước 1h).
- **Logic hệ thống**:
  1. Thuật toán **nội suy tuyến tính** tạo ra các điểm trung gian giữa 2 điểm liền kề.
  2. Kết quả: Biểu đồ tải mịn hơn, giúp logic sạc/xả pin BESS ở Bước 1.7 chính xác hơn (tránh sai số do bước thời gian quá lớn).
- **Tuning thêm**:
  - Chọn **Profile Shape**: "Realistic ⚡" (có biến động ngẫu nhiên) hoặc "Sine Wave 🌊" (hình sin lý tưởng).
  - Bật/tắt **CN Nghỉ** (Sunday Off) nếu nhà máy không hoạt động Chủ nhật.

---

## Bước 1.5: Cấu hình Giá điện & Cấp điện áp
- **Thao tác**: Tại Sidebar, chọn **Nhóm khách hàng** (Sản xuất / Kinh doanh / Hành chính) và **Cấp điện áp** (Dưới 6kV / 6kV-22kV / 22kV-110kV).
- **Logic hệ thống**:
  1. Tool tra cứu bảng biểu giá EVN (theo QĐ 1279) tương ứng với Cấp điện áp đã chọn.
  2. Lấy ra 3 mức giá: **Bình thường (BT)**, **Cao điểm (CĐ)**, **Thấp điểm (TD)**.
  3. Đây là "chìa khóa" để chuyển đổi kWh Solar sang VND tiết kiệm ở Bước 1.8.
- **Tác động dây chuyền**: Mỗi lần thay đổi Cấp điện áp → Toàn bộ Cash Flow ở Bước 1.9 được tính lại tức thì.

---

## Bước 1.6: Thiết kế Hệ thống Solar (PV Design)
- **Thao tác**: Nhập **Công suất Solar (kWp)**, chọn loại **Tấm pin** và **Biến tần (Inverter)**.
- **Logic hệ thống**:
  1. **Sản lượng DC thô** = Bức xạ (từ Bước 1.2) × Công suất kWp × Calibration Factor.
  2. **Trừ Suy hao (Losses)**: DC thô × (1 - Σ Losses). Bao gồm: Nhiệt độ, Bụi bẩn (Soiling), Dây dẫn (Cable), Biến tần (Inverter).
  3. **Clipping (Cắt ngọn)**: Nếu DC sau suy hao > **Inverter AC Limit** → Sản lượng bị giới hạn bằng trần AC.
  4. **Weather Derate**: Nhân thêm hệ số thời tiết xấu nếu đang chạy kịch bản bi quan.
- **Kết quả**: Chỉ số **PV Yield (MWh/năm)** xuất hiện trên Dashboard.

### 🌦️ Bước 1.6b: Chọn Kịch bản Thời tiết (Weather Scenarios)
- **Thao tác**: Tại Sidebar, chọn kịch bản thời tiết:
  - ☀️ **Bình thường (Normal)**: Derate = 100% (mặc định – theo dữ liệu TMY).
  - 🌦️ **Mưa nhiều (Rainy Year)**: Derate = 85% (giảm 15% sản lượng).
  - 🌧️ **Thời tiết xấu (Bad Weather)**: Derate = 75% (giảm 25%).
  - ⛈️ **Cực đoan (Extreme)**: Derate = 70% (giảm 30%).
- **Logic hệ thống**: Hệ số Weather Derate được nhân trực tiếp vào sản lượng DC tại Bước 1.6, **LUÔN áp dụng** kể cả khi dữ liệu đã là Actual Yield (PVSyst).
- **Mục đích**: Giúp Engineer đánh giá hiệu quả đầu tư trong trường hợp xấu nhất (Stress Test).

---

## Bước 1.7: Cấu hình Pin BESS & Điều độ Năng lượng
- **Thao tác**: Nhập dung lượng Pin (kWh), Công suất xả (kW), và chọn chiến lược.
- **Logic điều độ (chạy cho 8,760 giờ)**:
  - Tại **mỗi giờ**, tool tính: `Excess = Solar_kW - Load_kW`.
  - **Nếu Dư (Excess > 0)**: Sạc vào pin. Lượng sạc thực tế = Excess × Hiệu suất sạc (√Round-trip Eff). Pin không sạc quá 100% dung lượng.
  - **Nếu Thiếu (Excess < 0)**:
    - **Standard**: Xả pin ngay lập tức để bù thiếu.
    - **Peak Shaving**: Chỉ xả nếu đang trong khung giờ **Cao điểm** (9:30-11:30 & 17:00-20:00).
  - **Grid Charge** (Tùy chọn): Cho phép sạc pin từ lưới điện vào giờ **Thấp điểm** (22:00-04:00) để xả vào giờ Cao điểm.
- **Kết quả**: Hệ thống xuất ra **16 thông số kỹ thuật** cuối cùng:
  - #1-5: Sản lượng, Tự dùng, Cắt giảm (tổng).
  - #6-8: Mua lưới, Tổng tải, Tổn thất hệ thống.
  - #9-12: Phân tích Tự dùng theo khung giờ BT/CĐ.
  - #13-16: Phân tích Cắt giảm theo khung giờ BT/CĐ.

### 📊 Bước 1.7b: Phân tích Kịch bản Công suất (Scenario Comparison)
- **Thao tác**: Tại tab **Báo cáo chi tiết**, xem bảng **"Phân tích Năng lượng theo Khung giờ & Kịch bản"**.
- **Logic hệ thống**:
  1. Tool tự động chạy mô phỏng song song cho **nhiều mức kWp** khác nhau (ví dụ: 200, 300, 400, 500 kWp).
  2. Mỗi kịch bản sẽ xuất ra 4 giá trị: **Tự dùng CĐ**, **Tự dùng BT**, **Cắt giảm CĐ**, **Cắt giảm BT**.
  3. Engineer click vào dòng kịch bản bất kỳ → Tool cập nhật toàn bộ Dashboard, 16 thông số, và Cash Flow theo kịch bản đó.
- **Mục đích**: Giúp Engineer **nhìn một lần, so sánh nhiều phương án**, xác định điểm mà tỷ lệ Cắt giảm bắt đầu tăng vọt (dấu hiệu lắp quá lớn).

### 🎯 Bước 1.7c: Tối ưu hóa Hệ thống (4 chế độ Optimization)
- **Thao tác**: Chọn một trong 4 nút tối ưu:
  1. **"Optimal Suggest" (Toàn hệ thống)**: Quét kWp + BESS đồng thời để tìm IRR/NPV tối ưu nhất.
  2. **"Solar Only" (Chỉ Solar)**: Tối ưu kWp với BESS = 0. Tìm điểm Tự dùng cao nhất mà không cần pin.
  3. **"BESS Only" (Chỉ Pin)**: Giữ nguyên kWp hiện tại, chỉ tối ưu dung lượng Pin để hấp thụ phần dư thừa.
  4. **"Safe Capacity" (Công suất An toàn)**: Đề xuất kWp bảo thủ nhất, đảm bảo tỷ lệ Cắt giảm gần 0%.
- **Logic hệ thống**: Tool lặp lại Bước 1.6 → 1.7 cho hàng loạt tổ hợp kWp/BESS, rồi chọn phương án tốt nhất.

---

## Bước 1.8: Chuyển đổi Kỹ thuật → Tài chính
- **Logic tự động**:
  1. Tool lấy kết quả kWh tự dùng từng khung giờ (Bước 1.7) × Đơn giá EVN tương ứng (Bước 1.5).
  2. `Tiết kiệm Năm 1 = (Used_Peak × Price_Peak) + (Used_Normal × Price_Normal) + (Used_OffPeak × Price_OffPeak)`.
  3. Nếu có bán điện dư: `+ Exported × Grid_Injection_Price`.
  4. Nếu có BESS Grid Charge: `- GridCharge × Price_OffPeak` (chi phí sạc từ lưới).
- **Kết quả**: Con số **"Year 1 Revenue"** (Doanh thu tiết kiệm Năm 1) được xác lập.

---

## Bước 1.9: Mô phỏng Dòng tiền 20 năm (Cash Flow)
- **Thao tác**: Nhập CAPEX, cấu hình Vốn vay (Loan), Thuế TNDN, phí O&M.
- **Logic mô phỏng**:
  1. **Năm 0**: Dòng tiền = -Vốn tự có (CAPEX - Vốn vay).
  2. **Năm 1 → 20**: Lặp lại mỗi năm:
     - `Doanh thu` = Tiết kiệm Năm 1 × (1 + Escalation)^(năm-1) × (1 - Degradation)^(năm-1).
     - `Chi phí` = O&M + Bảo hiểm + Trả nợ (Gốc + Lãi) + Thuế TNDN.
     - `Replacement`: Thay pin BESS (năm 10), thay Inverter (năm 15-20) nếu có.
     - `Dòng tiền ròng` = Doanh thu - Chi phí - Replacement.
  3. **Tích lũy (Accumulated)**: Cộng dồn dòng tiền ròng. Điểm cắt trục 0 = **Payback (Hoàn vốn)**.
- **Chỉ số xuất ra**: NPV, IRR, Payback, LCOE, ROI.
- **Tối ưu**: Nhấn **"Optimal Suggest"** → Tool tự lặp lại Bước 1.6 → 1.9 với nhiều mức kWp khác nhau để tìm điểm IRR/NPV tối ưu nhất.

---

## Bước 1.10: Kiểm tra & Xuất Báo cáo PDF
- **Thao tác**: Vào tab **"Báo cáo chi tiết"** → Kiểm tra các biểu đồ → Nhấn **"Xuất PDF"**.
- **Cấu hình PDF**: Chọn/bỏ chọn các section: Tổng quan, Biểu đồ ngày, Bảng tháng, Cash Flow, Power Curves, Thông số chi tiết, Hiệu quả Môi trường.
- **Kết quả cuối cùng**: Tool tổng hợp toàn bộ kết quả từ 10 bước trên thành file PDF chuyên nghiệp gửi khách hàng.

---
---

# ═══════════════════════════════════════════
# CASE 2: NHẬP HÓA ĐƠN EVN BILL (Ước tính từ hóa đơn)
# ═══════════════════════════════════════════

*Áp dụng khi khách hàng chỉ cung cấp được hóa đơn tiền điện hàng tháng (không có file đo đếm).*

---

## Bước 2.1: Đăng nhập & Khởi tạo Dự án
- *(Giống Bước 1.1)*
- **Thao tác**: Truy cập web tool → Đăng nhập → Nhấn **"Dự án mới"** → Nhập tên dự án.
- **Logic hệ thống**: Khởi tạo bộ nhớ rỗng cho 8,760 giờ và các hằng số ESG.

---

## Bước 2.2: Chọn Khu vực & Dữ liệu Nắng
- *(Giống Bước 1.2)*
- **Thao tác**: Chọn **Tỉnh/Thành phố** tại Sidebar.
- **Logic hệ thống**: Truy vấn GSA → Tải TMY → Tạo đường cong Solar Profile.

---

## Bước 2.3: Nhập Hóa đơn Điện EVN (Bill Input)
- **Thao tác**: Tại tab Design, chọn chế độ **"Bill EVN"** → Nhập sản lượng kWh **12 tháng** theo 3 cột: **Bình thường (BT)**, **Cao điểm (CĐ)**, **Thấp điểm (TD)**.
- **Công cụ hỗ trợ**:
  - **"Bù tháng"**: Tự động điền giá trị cho các tháng còn trống dựa trên tháng đã nhập.
  - **"Dàn đều"**: Phân bố đều sản lượng cho tất cả các tháng.
  - **"Phân bổ"**: Tự động phát hiện tháng có dữ liệu đầu tiên làm cơ sở để phân phối cho các tháng còn lại.
- **Lưu ý cho Engineer**: Nếu khách hàng chỉ cung cấp tổng kWh tháng (không chia theo khung giờ), Engineer cần ước tính tỷ lệ BT/CĐ/TD dựa trên kinh nghiệm (ví dụ: Sản xuất thường có tải CĐ chiếm 25-30%).

---

## Bước 2.4: Phân bổ & Tạo Load Profile Giả lập
- **Thao tác**: Chọn **Template rải tải** (Nhà máy 1 ca, 2 ca, 3 ca, Văn phòng, F&B...) và chỉnh **Base Load (Tải nền)**.
- **Logic hệ thống**:
  1. Tool lấy tổng kWh tháng → Áp dụng thuật toán **Distribution** theo template đã chọn.
  2. Chia sản lượng vào 24 giờ/ngày theo tỷ trọng của template (ví dụ: 2 ca sản xuất sẽ tập trung tải vào 6:00-22:00).
  3. **Base Load**: Phần "sàn" tiêu thụ tối thiểu ban đêm (server, điều hòa, bảo vệ...). Nên để ở mức 10-20% tải đỉnh.
  4. Kết quả: Tạo ra mảng 8,760 điểm dữ liệu tải giả lập.
- **Kết quả**: Biểu đồ Load Profile (đường xanh) xuất hiện trên Dashboard, sẵn sàng so khớp với đường cong Solar.

---

## Bước 2.5: Cấu hình Giá điện & Cấp điện áp
- *(Giống Bước 1.5)*
- **Thao tác**: Chọn **Nhóm khách hàng** và **Cấp điện áp**.
- **Logic hệ thống**: Tra cứu biểu giá EVN → Lấy 3 mức giá BT/CĐ/TD.
- **Tác động dây chuyền**: Thay đổi Cấp điện áp → Cash Flow tính lại tức thì.

---

## Bước 2.6: Thiết kế Hệ thống Solar (PV Design)
- *(Giống Bước 1.6)*
- **Thao tác**: Nhập kWp, chọn Tấm pin, Biến tần.
- **Logic hệ thống**: DC thô → Suy hao → Clipping → PV Yield.
- **Lưu ý Case 2**: Do Load Profile là dữ liệu giả lập, Engineer nên chạy **Optimal Suggest** (Bước 2.9) sớm để kiểm tra xem kWp đề xuất có hợp lý không trước khi tinh chỉnh sâu.

---

## Bước 2.7: Cấu hình Pin BESS & Điều độ Năng lượng
- *(Giống Bước 1.7)*
- **Thao tác**: Nhập dung lượng Pin, Công suất xả, chọn chiến lược.
- **Logic điều độ**: Chạy 8,760 giờ: Sạc khi dư → Xả khi thiếu (theo chiến lược Standard hoặc Peak Shaving).
- **Kết quả**: 16 thông số kỹ thuật được xuất ra.

### 🌦️ Bước 2.7b: Kịch bản Thời tiết & So sánh Công suất
- *(Giống Bước 1.6b và 1.7b)*
- Chọn kịch bản thời tiết (Normal/Rainy/Bad/Extreme) để kiểm tra hiệu quả đầu tư.
- Xem bảng So sánh Kịch bản Công suất để đánh giá tỷ lệ Cắt giảm.
- **Đặc biệt quan trọng với Case 2**: Vì Load Profile là giả lập, stress test bằng kịch bản thời tiết xấu sẽ cho Engineer thấy "trường hợp tệ nhất" để tư vấn khách hàng.

### 🎯 Bước 2.7c: Tối ưu hóa Hệ thống
- *(Giống Bước 1.7c)*
- 4 chế độ: Optimal Suggest / Solar Only / BESS Only / Safe Capacity.
- **Lưu ý Case 2**: Nên ưu tiên chế độ **"Safe Capacity"** vì dữ liệu Load Profile không phải đo đếm thực tế, cần công suất bảo thủ hơn để giảm rủi ro cắt giảm.

---

## Bước 2.8: Chuyển đổi Kỹ thuật → Tài chính
- *(Giống Bước 1.8)*
- **Logic tự động**: kWh tự dùng × Đơn giá EVN → Year 1 Revenue.

---

## Bước 2.9: Mô phỏng Dòng tiền 20 năm (Cash Flow)
- *(Giống Bước 1.9)*
- **Thao tác**: Nhập CAPEX, Vốn vay, Thuế, O&M.
- **Logic mô phỏng**: Năm 0 (CAPEX) → Năm 1-20 (Revenue - Chi phí) → Tích lũy → Payback.
- **Chỉ số**: NPV, IRR, Payback, LCOE, ROI.
- **Optimal Suggest**: Đặc biệt quan trọng với Case 2 vì Load Profile là ước tính – Engineer cần kiểm chứng tính hợp lý của kWp đề xuất.

---

## Bước 2.10: Kiểm tra & Xuất Báo cáo PDF
- *(Giống Bước 1.10)*
- **Thao tác**: Tab Báo cáo → Kiểm tra → Xuất PDF.
- **Lưu ý Case 2**: Báo cáo nên ghi rõ rằng dữ liệu Load Profile là **ước tính từ hóa đơn**, không phải đo đếm thực tế, để khách hàng hiểu mức độ chính xác.

---
---

# 📘 PHỤ LỤC: TỪ ĐIỂN 16 THÔNG SỐ KỸ THUẬT

| # | Thông số | Công thức | Ý nghĩa thực tế |
|:--|:---|:---|:---|
| 1 | Tổng sản lượng PV | `Σ (PV Monthly)` | Tổng điện Solar tạo ra trong năm |
| 2 | Solar Tự dùng | `Σ Min(Solar, Load)` | Lượng điện Solar được tải tiêu thụ |
| 3 | Tỷ lệ Tự dùng (%) | `(Used / Yield) × 100` | Mục tiêu > 70% |
| 4 | Cắt giảm (Dư thừa) | `Yield - Used` | Lượng điện bị phí (cần BESS nếu > 20%) |
| 5 | Tỷ lệ Cắt giảm (%) | `(Curtailed / Yield) × 100` | Chỉ số lãng phí năng lượng |
| 6 | Mua lưới (Import) | `Total Load - Used` | Điện vẫn phải mua từ EVN |
| 7 | Tổng tải | `Σ (Load hàng giờ)` | Tổng nhu cầu điện trong năm |
| 8 | Tổn thất (%) | `(1 - Derate) × 100` | Hao hụt do nhiệt, dây dẫn, bụi |
| 9 | Tự dùng BT | `Σ Used (giờ BT)` | Solar dùng được giờ giá trung bình |
| 10 | Tỷ lệ BT (%) | `(Used BT / Total Used) × 100` | Tỷ trọng tiết kiệm giờ BT |
| 11 | **Tự dùng CĐ** | `Σ Used (giờ CĐ)` | **Chỉ số Vàng** – tiết kiệm giá cao nhất |
| 12 | Tỷ lệ CĐ (%) | `(Used CĐ / Total Used) × 100` | Tỷ trọng tiết kiệm giờ CĐ |
| 13 | Cắt giảm BT | `Σ Curtailed (giờ BT)` | Dư thừa giờ trung bình |
| 14 | Tỷ lệ Cắt giảm BT (%) | `(Curt BT / Total Curt) × 100` | Phân bổ dư thừa |
| 15 | Cắt giảm CĐ | `Σ Curtailed (giờ CĐ)` | Dư thừa giờ cao điểm |
| 16 | Tỷ lệ Cắt giảm CĐ (%) | `(Curt CĐ / Total Curt) × 100` | Phân bổ dư thừa |

---

# 💰 PHỤ LỤC: CÁC CHỈ SỐ TÀI CHÍNH

| Chỉ số | Ý nghĩa | Ngưỡng tốt |
|:---|:---|:---|
| **NPV** | Giá trị hiện tại ròng (quy chiết khấu) | > 0 |
| **IRR** | Tỉ suất sinh lời nội tại | > 15% |
| **Payback** | Thời gian hoàn vốn | < 7 năm |
| **LCOE** | Giá thành 1 kWh Solar | < Giá EVN |
| **ROI** | Tổng lợi nhuận / Vốn đầu tư | > 100% |

---
**💡 Kết luận**: Dù theo Case 1 hay Case 2, hành trình tính toán đều đi theo chuỗi: **Nắng → Điện → Tiền**. Sự khác biệt cốt lõi nằm ở **Bước 3-4** (Load Profile thực vs giả lập).
