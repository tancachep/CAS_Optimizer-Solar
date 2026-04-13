# ⚙️ SOLAR OPTIMIZER - QUY TRÌNH & HƯỚNG DẪN KỸ THUẬT CHI TIẾT
---
*Tài liệu dành cho Kỹ sư (Engineer) - Tập trung vào luồng xử lý dữ liệu và kịch bản thực tế.*

## 📑 Mục lục
1. [Bản đồ Liên kết Dữ liệu (Data Interaction Map)](#1-bản-đồ-liên-kết-dữ-liệu-data-interaction-map)
2. [Chi tiết Chức năng các Công cụ (Component Deep Dive)](#2-chi-tiết-chức-năng-các-công-cụ-component-deep-dive)
3. [CASE 1: Phân tích từ Load Profile thực tế (Import Excel/CSV)](#3-case-1-phân-tích-từ-load-profile-thực-tế-import-excelcsv)
4. [CASE 2: Ước tính từ Hóa đơn Điện lực (EVN Bill)](#4-case-2-ước-tính-từ-hóa-đơn-điện-lực-evn-bill)
5. [Giải mã 16 Thông số Kỹ thuật & Công thức](#5-giải-mã-16-thông-số-kỹ-thuật--công-thức)
6. [Phân tích Dòng tiền (Cash Flow) & ROI](#6-phân-tích-dòng-tiền-cash-flow--roi)
7. [Các Thông số Năng cao (BESS, Losses, Env)](#7-các-thông-số-nâng-cao-bess-losses-env)

---

## 🔗 1. Bản đồ Liên kết Dữ liệu (Data Interaction Map)

Dưới đây là cách các công cụ trong tool "nói chuyện" với nhau. Một thay đổi ở đầu vào sẽ kéo theo chuỗi thay đổi ở đầu ra:

| Đầu vào (Input) | Công cụ xử lý (Tool) | Kết quả đầu ra (Output) | Sự liên kết (Connection) |
|:---|:---|:---|:---|
| **Tỉnh/Thành** | GSA Database | Bức xạ Solar (kWh/kWp) | Xác định năng suất nắng thực tế của khu vực. |
| **Load Profile** | Profile Engine | Biểu đồ phụ tải 24h | Làm căn cứ để so khớp với đồ thị nắng (Correlate). |
| **Cấp điện áp** | EVN Tariff Table | Đơn giá BT/CĐ/TD | Thay đổi trực tiếp khoản Tiết kiệm (VND) trong Dòng tiền. |
| **Công suất kWp** | Solar Simulator | Sản lượng Solar hàng giờ | Ảnh hưởng tỷ lệ Tự dùng vs Cắt giảm. |
| **BESS Strategy** | BESS Controller | Profile sạc/xả | Dịch chuyển năng lượng dư thừa sang giờ Cao điểm để tối ưu tài chính. |
| **Loan & Tax** | Finance Engine | NPV, IRR, Payback | Chuyển đổi hiệu quả kỹ thuật sang hiệu quả kinh tế. |

---

## 🛠️ 2. Chi tiết Chức năng các Công cụ (Component Deep Dive)

### 2.1 Công cụ Tinh chỉnh Phụ tải (Load Tuning)
-   **Interpolate (Làm mượt)**: Tự động tính toán các điểm dữ liệu trung gian (ví dụ từ bước 1h sang 30p). Giúp biểu đồ mịn hơn và tính toán sạc/xả pin chính xác hơn.
-   **Base Load (Tải nền)**: Dùng trong Case 2 (EVN Bill) để thiết lập mức tiêu thụ tối thiểu ban đêm (ví dụ: máy lạnh, bảo vệ, server).
-   **Phân bổ (Distribution)**: Tự động rải tổng kWh tháng vào 24h dựa trên template (1 ca, 2 ca, 3 ca). Kết nối trực tiếp với logic tính toán Tự dùng trong báo cáo.

### 2.2 Công cụ Thiết kế Pin (BESS Config)
-   **Standard Strategy**: Ưu tiên sạc khi dư solar, xả ngay khi thiếu solar.
-   **Peak Shaving (Cắt đỉnh)**: Pin chỉ xả vào giờ Cao điểm (9:30 - 11:30 & 17:00 - 20:00). Liên kết trực tiếp với mục tiêu giảm hóa đơn tiền điện mức cao nhất.
-   **Grid Charge**: Cho phép sạc pin từ lưới điện vào giờ Thấp điểm (giá rẻ) để dùng vào giờ Cao điểm (giá đắt).

### 2.3 Công cụ Tối ưu tài chính (Financial Engine)
-   **Optimal Suggest**: Nút bấm quan trọng nhất. Tool sẽ chạy thử hàng loạt kịch bản công suất (ví dụ từ 100kWp đến 500kWp) để tìm ra quy mô có IRR cao nhất hoặc Hoàn vốn nhanh nhất.
-   **Escalation (%)**: Dự báo tỷ lệ tăng giá điện hàng năm của EVN (mặc định 2-5%). Liên kết với Doanh thu dự kiến ở các năm thứ 5, 10, 20.

---

## 📊 3. CASE 1: Phân tích từ Load Profile thực tế (Import Excel/CSV)

*Dành cho khách hàng có dữ liệu đo đếm chi tiết.*

### Bước 1: Upload & Mapping
Click **"Select Load Profile"**. Sau khi tải lên:
1.  **Mapping**: Chọn đúng cột "Thời gian" và "Công suất (kW)".
2.  **Kiểm tra**: Xem biểu đồ Preview xem có bị nhảy điểm dữ liệu (Outlier) không.

---

## 📝 4. CASE 2: Ước tính từ Hóa đơn Điện lực (EVN Bill)

*Dành cho khách hàng chỉ có hóa đơn tiền điện.*

### Bước 1: Nhập dữ liệu 12 tháng
Tại tab Design, chọn **"Bill EVN"**. Nhập kWh 12 tháng theo 3 khung giờ.
> [!NOTE]
> Tool hỗ trợ tính năng **"Copy/Paste"** hoặc rải đều sản lượng cho các tháng nếu chỉ có dữ liệu 1 quý.

### Bước 2: Phân bổ & Kiểm tra liên kết
Click **"Phân bổ"** -> Chọn template "Nhà máy 2 ca". Ngay lập tức, tab **Dashboard** sẽ cập nhật biểu đồ tương quan Solar - Load mới.

---

## 📐 5. Giải mã 16 Thông số Kỹ thuật & Công thức

1.  **Tổng sản lượng PV**: Năng suất thực tế của hệ thống sau khi trừ hao hụt.
2.  **Tự dùng giờ Cao điểm (CĐ)**: Chỉ số này càng cao, thời gian hoàn vốn càng ngắn.
3.  **Cắt giảm (Dư thừa)**: Nếu chỉ số này > 30%, Engineer nên đề xuất thêm pin BESS hoặc giảm công suất Solar.
4.   ... (Xem chi tiết tại bảng thông số trong báo cáo)

---

## 💰 6. Phân tích Dòng tiền (Cash Flow) & ROI

Sự liên kết tài chính diễn ra như sau:
- **Technical Stats** (Used kWh) x **Tariff** (VND/kWh) => **Gross Savings**.
- **Gross Savings** - **O&M** - **Loan Interest** => **EBT** (Lợi nhuận trước thuế).
- **EBT** - **Income Tax** => **Net Cash Flow**.

---

## ⚙️ 7. Các Thông số Nâng cao (BESS, Losses, Env)

- **Calibration Factor**: Dùng khi Engineer muốn đối chiếu với sản lượng thực tế của một dự án lân cận để tăng độ tin cậy.
- **Inverter AC Limit**: Hạn chế công suất đầu ra. Liên kết với phần lựa chọn thiết bị (Hardware DB).

---
**💡 Ghi chú:** Sự mạnh mẽ của Solar Optimizer nằm ở chỗ: Khi bạn thay đổi **"Cấp điện áp"**, toàn bộ bảng **Cash Flow** và biểu đồ **ROI** sẽ được tính toán lại sau 0.1 giây, giúp Engineer tư vấn khách hàng cực kỳ nhanh chóng.
