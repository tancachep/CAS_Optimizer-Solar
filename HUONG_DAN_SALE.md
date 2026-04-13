# 📘 HƯỚNG DẪN SỬ DỤNG - SOLAR OPTIMIZER
## Dành cho đội ngũ Kinh doanh (Sale Team)

> **Phiên bản**: v2.0 | **Cập nhật**: Tháng 3/2026  
> **Mục đích**: Hướng dẫn từng bước sử dụng công cụ Solar Optimizer để tạo báo cáo tư vấn chuyên nghiệp cho khách hàng.

---

## 📑 Mục Lục

1. [Tổng quan công cụ](#1-tổng-quan-công-cụ)
2. [Đăng nhập hệ thống](#2-đăng-nhập-hệ-thống)
3. [Bước 1 – Nhập dữ liệu đầu vào](#3-bước-1--nhập-dữ-liệu-đầu-vào)
4. [Bước 2 – Tab Tổng quan (Dashboard)](#4-bước-2--tab-tổng-quan-dashboard)
5. [Bước 3 – Tab Thiết kế & BESS](#5-bước-3--tab-thiết-kế--bess)
6. [Bước 4 – Tab Kịch bản Đầu tư (Finance)](#6-bước-4--tab-kịch-bản-đầu-tư-finance)
7. [Bước 5 – Tab Báo cáo & Xuất PDF](#7-bước-5--tab-báo-cáo--xuất-pdf)
8. [Các tình huống thường gặp (FAQ)](#8-các-tình-huống-thường-gặp-faq)
9. [Thuật ngữ quan trọng](#9-thuật-ngữ-quan-trọng)

---

## 1. Tổng quan công cụ

Solar Optimizer là công cụ **tính toán công suất lắp đặt hệ thống điện mặt trời** cho khách hàng doanh nghiệp (C&I). Công cụ giúp bạn:

| Tính năng | Mô tả |
|-----------|-------|
| 📊 **Phân tích phụ tải** | Đọc hóa đơn điện / file Load Profile của khách hàng |
| ☀️ **Mô phỏng năng lượng** | Tính toán sản lượng điện mặt trời theo vị trí lắp đặt |
| 🔋 **Thiết kế BESS** | Đề xuất pin lưu trữ nếu cần |
| 💰 **Phân tích tài chính** | Tính hoàn vốn, IRR, NPV, tiết kiệm hàng năm |
| 📄 **Xuất báo cáo PDF** | Tạo báo cáo chuyên nghiệp gửi khách hàng |

> [!TIP]
> Quy trình cơ bản: **Nhập dữ liệu → Chọn tỉnh → Xem tổng quan → Thiết kế → Phân tích tài chính → Xuất PDF**

---

## 2. Đăng nhập hệ thống

1. Mở trình duyệt, truy cập link công cụ (do quản lý cung cấp).
2. Nhập **Email** và **Mật khẩu** được cấp.
3. Nhấn **ĐĂNG NHẬP**.

> [!NOTE]
> Tài khoản Sale sẽ hiển thị giao diện đơn giản hóa so với tài khoản Engineering. Một số tùy chọn kỹ thuật nâng cao sẽ được ẩn đi.

---

## 3. Bước 1 – Nhập dữ liệu đầu vào

### 3.1 Cách lấy dữ liệu từ khách hàng

Bạn cần **một trong các loại dữ liệu** sau từ khách hàng:

| Loại dữ liệu | Định dạng | Ghi chú |
|---------------|-----------|---------|
| **Load Profile (ưu tiên)** | File Excel (.xlsx) hoặc CSV | Dữ liệu tiêu thụ điện theo giờ cả năm |
| **Hóa đơn điện EVN** | Ảnh chụp hoặc giá trị kWh/tháng | Nhập thủ công 12 tháng |
| **Giả lập nhanh** | Chọn loại hình kinh doanh | Dùng để tư vấn nhanh ban đầu |

### 3.2 Upload file Load Profile

1. Tại màn hình chính, nhấn nút **"Chọn file Load Profile"**.
2. Chọn file Excel/CSV từ máy tính.
3. Công cụ sẽ tự động đọc và phân tích dữ liệu.

### 3.3 Sử dụng Smart Design (Giả lập nhanh)

Nếu chưa có Load Profile thực, bạn có thể dùng **Smart Design**:

1. Chọn **loại hình** khách hàng (VD: Sản xuất 1 ca, Kinh doanh, F&B...).
2. Nhập **điện năng tiêu thụ trung bình tháng** (kWh/tháng).
3. Công cụ sẽ tạo phụ tải giả lập phù hợp.

### 3.4 Chọn Tỉnh/Thành phố

Ở panel bên trái, chọn **Khu vực / Tỉnh thành**:
- Gõ tên tỉnh vào ô tìm kiếm để lọc nhanh.
- Mỗi tỉnh có **bức xạ mặt trời (PSH)** khác nhau, ảnh hưởng trực tiếp đến sản lượng.

| Khu vực | Bức xạ (PSH) | Đánh giá |
|---------|--------------|----------|
| Miền Nam (TP.HCM, Đồng Nai...) | 4.0 – 4.4 | ⭐⭐⭐ Tốt nhất |
| Tây Nguyên (Lâm Đồng, Gia Lai...) | 4.0 – 4.4 | ⭐⭐⭐ Rất tốt |
| Miền Trung (Khánh Hòa, Đà Nẵng...) | 3.8 – 4.3 | ⭐⭐ Tốt |
| Miền Bắc (Hà Nội...) | 2.6 – 3.2 | ⭐ Trung bình |

---

## 4. Bước 2 – Tab Tổng quan (Dashboard)

Sau khi nhập dữ liệu, tab **Tổng quan** hiển thị:

### 4.1 Các chỉ số chính (5 thẻ phía trên)

| Thẻ | Ý nghĩa | Đơn vị |
|-----|---------|--------|
| **Sản lượng PV** | Tổng điện mặt trời tạo ra trong năm | MWh/năm |
| **Năng lượng Solar** | Phần điện mặt trời khách hàng thực sự sử dụng được | MWh/năm |
| **Tiết kiệm** | Số tiền tiết kiệm hàng năm | Triệu VNĐ |
| **Tự dùng** | Tỷ lệ điện mặt trời được dùng (không dư thừa) | % |
| **Hiệu suất** | Hiệu suất tổng thể của hệ thống | % |

### 4.2 Biểu đồ

- **Biểu đồ ngày điển hình**: So sánh đường cong phụ tải và sản lượng solar trong ngày.
- **Biểu đồ tháng**: Sản lượng solar và tiêu thụ theo từng tháng.

> [!TIP]
> **Mẹo cho Sale**: Tỷ lệ tự dùng > 80% là lý tưởng. Nếu tỷ lệ tự dùng thấp (< 60%), hệ thống có thể đang quá lớn so với nhu cầu khách hàng → cân nhắc giảm công suất hoặc thêm BESS.

---

## 5. Bước 3 – Tab Thiết kế & BESS

### 5.1 Điều chỉnh công suất (kWp)

- **Công suất Solar (kWp)**: Kéo thanh trượt hoặc nhập trực tiếp.
- Nút **"Đề xuất tối ưu"**: Để công cụ tự tính công suất phù hợp nhất.
- Nút **"Đề xuất an toàn"** (Safe Fit): Công suất bảo thủ, đảm bảo không dư thừa điện.

### 5.2 Pin lưu trữ (BESS)

- Bật/tắt BESS theo nhu cầu khách hàng.
- Nếu bật, công cụ sẽ đề xuất dung lượng pin phù hợp.
- **Khi nào nên đề xuất BESS cho khách**:
  - Khách hàng muốn tối ưu chi phí giờ cao điểm (Peak Shaving).
  - Nhà máy hoạt động ca đêm.
  - Yêu cầu Zero-Export (không bán điện lên lưới).

### 5.3 Chọn biến tần (Inverter)

- Công cụ sẽ **tự động đề xuất** biến tần phù hợp theo công suất.
- Bạn không cần điều chỉnh phần này (team Engineering sẽ review).

### 5.4 Cấu hình giá điện

| Thông số | Ý nghĩa |
|----------|---------|
| **Loại giá điện** | Sản xuất / Kinh doanh / Sinh hoạt |
| **Cấp điện áp** | 110kV+, 22kV-110kV, 6kV-22kV, < 6kV |
| **Giá bán lên lưới** | Giá FIT/xuất lưới (nếu có) |

> [!IMPORTANT]
> Kiểm tra lại **cấp điện áp** trong hóa đơn EVN của khách hàng. Chọn sai cấp điện áp sẽ dẫn đến sai lệch đáng kể về tiết kiệm.

---

## 6. Bước 4 – Tab Kịch bản Đầu tư (Finance)

### 6.1 Các thông số cần biết

| Thông số | Giá trị mặc định | Khi nào cần thay đổi |
|----------|------------------|----------------------|
| **Đơn giá Solar** | 12 triệu/kWp | Theo báo giá thực tế của công ty |
| **Vốn đầu tư (CAPEX)** | Tự tính: kWp × đơn giá | Nếu đã có tổng giá trị hợp đồng |
| **Thời gian dự án** | 20 năm | Thường không đổi |
| **Tăng giá điện hàng năm** | 2.0%/năm | Tham khảo team Engineering |
| **O&M** | 1.0 – 1.5% CAPEX | Chi phí vận hành bảo trì hàng năm |

### 6.2 Cấu hình Vay vốn

Nếu khách hàng sử dụng vay ngân hàng:
1. **Bật** phần "Vay vốn".
2. Nhập: Tỷ lệ vay (%), Lãi suất (%), Thời hạn vay (năm).
3. Công cụ sẽ tính dòng tiền bao gồm trả lãi + gốc.

### 6.3 Đọc kết quả tài chính

| Chỉ số | Ý nghĩa | Giá trị tốt |
|--------|---------|-------------|
| **Payback (Hoàn vốn)** | Số năm thu hồi vốn đầu tư | < 5 năm: Rất tốt, 5-7 năm: Tốt |
| **IRR** | Tỷ suất sinh lời nội bộ | > 15%: Hấp dẫn |
| **NPV** | Giá trị ròng hiện tại | > 0: Dự án khả thi |
| **ROI** | Tỷ suất lợi nhuận trên đầu tư | > 200%: Rất tốt |
| **LCOE** | Chi phí điện bình quân từ solar | Thấp hơn giá EVN: Có lợi |

> [!TIP]
> **Khi trình bày với khách hàng**, tập trung vào **Payback** (dễ hiểu nhất) và **Tiết kiệm năm 1** (con số cụ thể). Chỉ đề cập NPV/IRR nếu khách hàng có nền tảng tài chính.

---

## 7. Bước 5 – Tab Báo cáo & Xuất PDF

### 7.1 Cấu hình báo cáo

Trước khi xuất PDF, bạn có thể chọn các phần muốn đưa vào:

| Phần | Nên bật cho | Ghi chú |
|------|-------------|---------|
| ✅ Tổng quan & Sản lượng tháng | Mọi khách hàng | Luôn bật |
| ✅ Cấu hình hệ thống | Mọi khách hàng | Luôn bật |
| ✅ Biểu đồ ngày & Tuần | Khách hàng kỹ tính | Tùy chọn |
| ✅ Biểu đồ dòng tiền | Mọi khách hàng | Khuyến khích bật |
| ✅ Phân tích đầu tư | Mọi khách hàng | Luôn bật |
| ✅ Hiệu quả môi trường | CSR / ESG | Nên bật cho doanh nghiệp lớn |
| ⬜ Power Curves 12 tháng | Chỉ khi cần chi tiết | Tùy chọn |

### 7.2 Xuất PDF

1. Nhấn **"Xuất PDF Báo cáo"**.
2. Chờ 10-30 giây để công cụ tạo báo cáo.
3. File PDF tự động tải xuống.

### 7.3 Nội dung báo cáo PDF gồm

- **Trang bìa** với logo CAS Energy Solutions.
- **Tổng quan kỹ thuật**: Sản lượng, hiệu suất tự dùng.
- **Cấu hình hệ thống**: Số lượng tấm pin, biến tần, BESS.
- **Biểu đồ năng lượng**: Hàng ngày, hàng tháng.
- **Phân tích tài chính**: Bảng dòng tiền 20 năm.
- **Hiệu quả môi trường**: Giảm CO₂, tương đương trồng cây.

---

## 8. Các tình huống thường gặp (FAQ)

### ❓ Khách hàng không có Load Profile?

→ Dùng **Smart Design**: Chọn loại hình kinh doanh + nhập kWh/tháng từ hóa đơn điện.

### ❓ Tỷ lệ tự dùng quá thấp (< 50%)?

→ **Giảm công suất kWp** xuống hoặc nhấn nút **"Đề xuất an toàn"** để lấy công suất bảo thủ.

### ❓ Khách hàng muốn Zero-Export?

→ Trong phần thiết kế, nhấn **"Đề xuất an toàn"** (Safe Fit). Hệ thống sẽ tính công suất tối đa mà không bao giờ dư thừa.

### ❓ Số liệu tiết kiệm khác so với team Engineering?

→ Kiểm tra lại:
1. **Cấp điện áp** có đúng không.
2. **Loại giá điện** (Sản xuất vs Kinh doanh) có đúng không.
3. **Hệ số tổn thất** có phù hợp không (thường 10-15%).

### ❓ Muốn so sánh nhiều kịch bản?

→ Tab **Kịch bản Đầu tư** hỗ trợ tạo và so sánh nhiều phương án công suất khác nhau.

---

## 9. Thuật ngữ quan trọng

| Thuật ngữ | Giải thích dễ hiểu |
|-----------|-------------------|
| **kWp** | Công suất đỉnh của hệ thống solar (càng cao → tạo ra càng nhiều điện) |
| **PSH (Peak Sun Hours)** | Số giờ nắng đỉnh/ngày – đo mức bức xạ mặt trời tại khu vực |
| **Load Profile** | Biểu đồ tiêu thụ điện theo giờ của khách hàng |
| **Tự dùng (Self-consumption)** | Phần điện solar khách hàng dùng trực tiếp (không bán/cắt giảm) |
| **Cắt giảm (Curtailment)** | Phần điện solar dư thừa bị lãng phí (không bán được) |
| **BESS** | Pin lưu trữ năng lượng – tích điện dư ban ngày, dùng ban đêm/giờ cao điểm |
| **Payback** | Thời gian hoàn vốn (số năm để tiền tiết kiệm = tiền đầu tư) |
| **IRR** | Tỷ suất sinh lời nội bộ – so sánh với lãi suất ngân hàng (càng cao càng tốt) |
| **NPV** | Giá trị ròng – nếu > 0 tức là dự án có lãi |
| **CAPEX** | Tổng vốn đầu tư ban đầu |
| **O&M** | Chi phí Vận hành & Bảo trì hàng năm |
| **TOU** | Biểu giá theo giờ: Cao điểm / Bình thường / Thấp điểm |
| **DC/AC Ratio** | Tỷ lệ công suất tấm pin và biến tần (thường 1.25) |
| **Zero-Export** | Chế độ không bán điện lên lưới |
| **Peak Shaving** | Dùng pin xả vào giờ cao điểm để giảm chi phí |

---

> **Liên hệ hỗ trợ**: Nếu gặp lỗi hoặc cần tư vấn thêm, liên hệ team Engineering hoặc quản lý trực tiếp.

---

*© 2026 CAS Energy Solutions – Solar Optimizer v2.0*
