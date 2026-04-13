const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, 'img');

function imgBase64(filename) {
  const fp = path.join(imgDir, filename);
  if (!fs.existsSync(fp)) return '';
  const data = fs.readFileSync(fp);
  return `data:image/png;base64,${data.toString('base64')}`;
}

const CSS = `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; color:#1e293b; line-height:1.7; background:#fff; }
  @media print {
    body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .page-break { page-break-before:always; }
    .no-break { page-break-inside:avoid; }
  }
  .cover { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0f172a 100%); color:white; text-align:center; padding:60px 40px; }
  .cover h1 { font-size:42px; font-weight:900; margin-bottom:10px; }
  .cover .subtitle { font-size:20px; color:#fbbf24; font-weight:600; margin-bottom:30px; }
  .cover .version { font-size:14px; color:rgba(255,255,255,0.5); margin-top:40px; }
  .cover .logo-text { font-size:28px; font-weight:800; color:#fbbf24; letter-spacing:2px; margin-bottom:5px; }
  .content { max-width:900px; margin:0 auto; padding:40px 50px; }
  h1 { font-size:28px; font-weight:800; color:#0f172a; margin:40px 0 15px; border-bottom:3px solid #f59e0b; padding-bottom:8px; }
  h2 { font-size:22px; font-weight:700; color:#1e3a5f; margin:30px 0 12px; }
  h3 { font-size:17px; font-weight:600; color:#334155; margin:20px 0 8px; }
  p { margin:8px 0; font-size:14px; }
  table { width:100%; border-collapse:collapse; margin:15px 0; font-size:13px; }
  th { background:#1e3a5f; color:white; padding:10px 12px; text-align:left; font-weight:600; }
  td { padding:8px 12px; border-bottom:1px solid #e2e8f0; }
  tr:nth-child(even) td { background:#f8fafc; }
  .img-container { margin:20px 0; text-align:center; }
  .img-container img { max-width:100%; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.12); border:1px solid #e2e8f0; }
  .img-caption { font-size:12px; color:#64748b; margin-top:8px; font-style:italic; }
  .tip { background:#fffbeb; border-left:4px solid #f59e0b; padding:12px 16px; margin:15px 0; border-radius:0 8px 8px 0; font-size:13px; }
  .tip::before { content:"💡 Mẹo: "; font-weight:700; color:#d97706; }
  .note { background:#eff6ff; border-left:4px solid #3b82f6; padding:12px 16px; margin:15px 0; border-radius:0 8px 8px 0; font-size:13px; }
  .note::before { content:"📝 Lưu ý: "; font-weight:700; color:#2563eb; }
  .warn { background:#fef2f2; border-left:4px solid #ef4444; padding:12px 16px; margin:15px 0; border-radius:0 8px 8px 0; font-size:13px; }
  .warn::before { content:"⚠️ Quan trọng: "; font-weight:700; color:#dc2626; }
  .code-block { background:#1e293b; color:#e2e8f0; padding:16px 20px; border-radius:8px; font-family:'Consolas',monospace; font-size:12px; margin:12px 0; overflow-x:auto; white-space:pre; line-height:1.5; }
  .toc { background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px 30px; margin:20px 0; }
  .toc h3 { color:#0f172a; margin-bottom:10px; }
  .toc ol { padding-left:20px; }
  .toc li { margin:5px 0; font-size:14px; color:#475569; }
  .glossary td:first-child { font-weight:700; color:#1e3a5f; white-space:nowrap; }
  .footer { text-align:center; color:#94a3b8; font-size:11px; margin-top:40px; padding:20px; border-top:1px solid #e2e8f0; }
  ul { padding-left:20px; margin:8px 0; }
  li { margin:4px 0; font-size:14px; }
  .step-num { display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; background:#f59e0b; color:white; border-radius:50%; font-weight:800; font-size:13px; margin-right:8px; }
</style>`;

// ===== SALE GUIDE HTML =====
const saleHTML = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>Hướng dẫn Sale - Solar Optimizer</title>${CSS}</head><body>

<div class="cover">
  <div class="logo-text">CAS ENERGY SOLUTIONS</div>
  <h1>📘 HƯỚNG DẪN SỬ DỤNG<br/>SOLAR OPTIMIZER</h1>
  <div class="subtitle">Dành cho đội ngũ Kinh doanh (Sale Team)</div>
  <p style="color:rgba(255,255,255,0.7);max-width:500px">Hướng dẫn từng bước sử dụng công cụ tính toán công suất lắp đặt hệ thống điện mặt trời</p>
  <div class="version">Phiên bản v2.0 • Tháng 3/2026</div>
</div>

<div class="content">

<div class="toc">
  <h3>📑 Mục Lục</h3>
  <ol>
    <li>Tổng quan công cụ</li>
    <li>Đăng nhập hệ thống</li>
    <li>Nhập dữ liệu đầu vào</li>
    <li>Tab Tổng quan (Dashboard)</li>
    <li>Tab Thiết kế & BESS</li>
    <li>Tab Kịch bản Đầu tư (Finance)</li>
    <li>Tab Báo cáo & Xuất PDF</li>
    <li>Tình huống thường gặp (FAQ)</li>
    <li>Thuật ngữ quan trọng</li>
  </ol>
</div>

<h1>1. Tổng quan công cụ</h1>
<p>Solar Optimizer là công cụ <strong>tính toán công suất lắp đặt hệ thống điện mặt trời</strong> cho khách hàng doanh nghiệp (C&I).</p>
<table>
  <tr><th>Tính năng</th><th>Mô tả</th></tr>
  <tr><td>📊 Phân tích phụ tải</td><td>Đọc hóa đơn điện / file Load Profile của khách hàng</td></tr>
  <tr><td>☀️ Mô phỏng năng lượng</td><td>Tính toán sản lượng điện mặt trời theo vị trí lắp đặt</td></tr>
  <tr><td>🔋 Thiết kế BESS</td><td>Đề xuất pin lưu trữ nếu cần</td></tr>
  <tr><td>💰 Phân tích tài chính</td><td>Tính hoàn vốn, IRR, NPV, tiết kiệm hàng năm</td></tr>
  <tr><td>📄 Xuất báo cáo PDF</td><td>Tạo báo cáo chuyên nghiệp gửi khách hàng</td></tr>
</table>
<div class="tip">Quy trình cơ bản: <strong>Nhập dữ liệu → Chọn tỉnh → Xem tổng quan → Thiết kế → Phân tích tài chính → Xuất PDF</strong></div>

<div class="page-break"></div>
<h1>2. Đăng nhập hệ thống</h1>
<p><span class="step-num">1</span> Mở trình duyệt, truy cập link công cụ (do quản lý cung cấp).</p>
<p><span class="step-num">2</span> Nhập <strong>Email</strong> và <strong>Mật khẩu</strong> được cấp.</p>
<p><span class="step-num">3</span> Nhấn <strong>ĐĂNG NHẬP</strong>.</p>
<div class="img-container no-break">
  <img src="${imgBase64('01_login.png')}" alt="Màn hình đăng nhập"/>
  <div class="img-caption">Hình 1: Màn hình đăng nhập Solar Optimizer</div>
</div>
<div class="note">Tài khoản Sale sẽ hiển thị giao diện đơn giản hóa. Một số tùy chọn kỹ thuật nâng cao sẽ được ẩn đi.</div>

<div class="page-break"></div>
<h1>3. Nhập dữ liệu đầu vào</h1>
<h2>3.1 Cách lấy dữ liệu từ khách hàng</h2>
<table>
  <tr><th>Loại dữ liệu</th><th>Định dạng</th><th>Ghi chú</th></tr>
  <tr><td><strong>Load Profile</strong> (ưu tiên)</td><td>Excel (.xlsx) / CSV</td><td>Dữ liệu tiêu thụ điện theo giờ</td></tr>
  <tr><td><strong>Hóa đơn điện EVN</strong></td><td>Ảnh chụp / kWh/tháng</td><td>Nhập thủ công 12 tháng</td></tr>
  <tr><td><strong>Giả lập nhanh</strong></td><td>Chọn loại hình</td><td>Dùng để tư vấn nhanh ban đầu</td></tr>
</table>

<h2>3.2 Sử dụng Smart Design (Giả lập nhanh)</h2>
<p>Nếu chưa có Load Profile, dùng <strong>Smart Design</strong>: Chọn loại hình khách hàng → Nhập kWh/tháng.</p>
<div class="img-container no-break">
  <img src="${imgBase64('04_smart_design.png')}" alt="Smart Design Selector"/>
  <div class="img-caption">Hình 2: Chọn loại hình kinh doanh khi dùng Smart Design</div>
</div>

<h2>3.3 Chọn Tỉnh/Thành phố</h2>
<p>Mỗi tỉnh có <strong>bức xạ mặt trời (PSH)</strong> khác nhau, ảnh hưởng trực tiếp đến sản lượng.</p>
<div class="img-container no-break">
  <img src="${imgBase64('03_province.png')}" alt="Province Selector"/>
  <div class="img-caption">Hình 3: Dropdown chọn tỉnh thành với chỉ số PSH</div>
</div>
<table>
  <tr><th>Khu vực</th><th>Bức xạ (PSH)</th><th>Đánh giá</th></tr>
  <tr><td>Miền Nam (TP.HCM, Đồng Nai...)</td><td>4.0 – 4.4</td><td>⭐⭐⭐ Tốt nhất</td></tr>
  <tr><td>Tây Nguyên (Lâm Đồng, Gia Lai...)</td><td>4.0 – 4.4</td><td>⭐⭐⭐ Rất tốt</td></tr>
  <tr><td>Miền Trung (Khánh Hòa, Đà Nẵng...)</td><td>3.8 – 4.3</td><td>⭐⭐ Tốt</td></tr>
  <tr><td>Miền Bắc (Hà Nội...)</td><td>2.6 – 3.2</td><td>⭐ Trung bình</td></tr>
</table>

<div class="page-break"></div>
<h1>4. Tab Tổng quan (Dashboard)</h1>
<div class="img-container no-break">
  <img src="${imgBase64('02_dashboard.png')}" alt="Dashboard"/>
  <div class="img-caption">Hình 4: Tab Tổng quan với các chỉ số chính và biểu đồ năng lượng</div>
</div>
<h2>4.1 Các chỉ số chính (5 thẻ phía trên)</h2>
<table>
  <tr><th>Thẻ</th><th>Ý nghĩa</th><th>Đơn vị</th></tr>
  <tr><td><strong>Sản lượng PV</strong></td><td>Tổng điện mặt trời tạo ra trong năm</td><td>MWh/năm</td></tr>
  <tr><td><strong>Năng lượng Solar</strong></td><td>Phần điện mặt trời KH sử dụng được</td><td>MWh/năm</td></tr>
  <tr><td><strong>Tiết kiệm</strong></td><td>Số tiền tiết kiệm hàng năm</td><td>Triệu VNĐ</td></tr>
  <tr><td><strong>Tự dùng</strong></td><td>Tỷ lệ điện solar được dùng (không dư thừa)</td><td>%</td></tr>
  <tr><td><strong>Hiệu suất</strong></td><td>Hiệu suất tổng thể hệ thống</td><td>%</td></tr>
</table>
<div class="tip"><strong>Mẹo cho Sale:</strong> Tỷ lệ tự dùng > 80% là lý tưởng. Nếu < 60% → hệ thống có thể quá lớn → giảm công suất hoặc thêm BESS.</div>

<div class="page-break"></div>
<h1>5. Tab Thiết kế & BESS</h1>
<div class="img-container no-break">
  <img src="${imgBase64('05_design_bess.png')}" alt="Design & BESS"/>
  <div class="img-caption">Hình 5: Thiết kế hệ thống - chọn inverter, BESS và công suất solar</div>
</div>
<h2>5.1 Điều chỉnh công suất (kWp)</h2>
<ul>
  <li>Kéo thanh trượt hoặc nhập trực tiếp công suất.</li>
  <li>Nút <strong>"Đề xuất tối ưu"</strong>: Công cụ tự tính công suất phù hợp nhất.</li>
  <li>Nút <strong>"Đề xuất an toàn"</strong>: Công suất bảo thủ, không dư thừa điện.</li>
</ul>
<h2>5.2 Khi nào nên đề xuất BESS?</h2>
<ul>
  <li>Khách hàng muốn tối ưu chi phí giờ cao điểm (Peak Shaving).</li>
  <li>Nhà máy hoạt động ca đêm.</li>
  <li>Yêu cầu Zero-Export (không bán điện lên lưới).</li>
</ul>
<h2>5.3 Cấu hình giá điện</h2>
<table>
  <tr><th>Thông số</th><th>Ý nghĩa</th></tr>
  <tr><td><strong>Loại giá điện</strong></td><td>Sản xuất / Kinh doanh / Sinh hoạt</td></tr>
  <tr><td><strong>Cấp điện áp</strong></td><td>110kV+, 22kV-110kV, 6kV-22kV, < 6kV</td></tr>
</table>
<div class="warn">Kiểm tra lại <strong>cấp điện áp</strong> trong hóa đơn EVN. Chọn sai cấp điện áp sẽ dẫn đến sai lệch đáng kể về tiết kiệm.</div>

<div class="page-break"></div>
<h1>6. Tab Kịch bản Đầu tư (Finance)</h1>
<div class="img-container no-break">
  <img src="${imgBase64('06_finance.png')}" alt="Finance"/>
  <div class="img-caption">Hình 6: Phân tích tài chính với biểu đồ dòng tiền và các chỉ số ROI</div>
</div>
<h2>6.1 Các thông số cần biết</h2>
<table>
  <tr><th>Thông số</th><th>Giá trị mặc định</th><th>Khi nào cần thay đổi</th></tr>
  <tr><td><strong>Đơn giá Solar</strong></td><td>12 triệu/kWp</td><td>Theo báo giá thực tế</td></tr>
  <tr><td><strong>Thời gian dự án</strong></td><td>20 năm</td><td>Thường không đổi</td></tr>
  <tr><td><strong>Tăng giá điện</strong></td><td>2.0%/năm</td><td>Tham khảo Engineering</td></tr>
  <tr><td><strong>O&M</strong></td><td>1.0–1.5% CAPEX</td><td>Chi phí bảo trì hàng năm</td></tr>
</table>
<h2>6.2 Đọc kết quả tài chính</h2>
<table>
  <tr><th>Chỉ số</th><th>Ý nghĩa</th><th>Giá trị tốt</th></tr>
  <tr><td><strong>Payback</strong></td><td>Số năm thu hồi vốn</td><td>< 5 năm: Rất tốt</td></tr>
  <tr><td><strong>IRR</strong></td><td>Tỷ suất sinh lời nội bộ</td><td>> 15%: Hấp dẫn</td></tr>
  <tr><td><strong>NPV</strong></td><td>Giá trị ròng hiện tại</td><td>> 0: Khả thi</td></tr>
  <tr><td><strong>ROI</strong></td><td>Tỷ suất lợi nhuận</td><td>> 200%: Rất tốt</td></tr>
</table>
<div class="tip"><strong>Khi trình bày với KH</strong>, tập trung vào Payback (dễ hiểu nhất) và Tiết kiệm năm 1 (con số cụ thể).</div>

<div class="page-break"></div>
<h1>7. Tab Báo cáo & Xuất PDF</h1>
<div class="img-container no-break">
  <img src="${imgBase64('07_report.png')}" alt="Report"/>
  <div class="img-caption">Hình 7: Cấu hình và xuất báo cáo PDF chuyên nghiệp</div>
</div>
<table>
  <tr><th>Phần</th><th>Nên bật cho</th></tr>
  <tr><td>✅ Tổng quan & Sản lượng tháng</td><td>Mọi khách hàng</td></tr>
  <tr><td>✅ Cấu hình hệ thống</td><td>Mọi khách hàng</td></tr>
  <tr><td>✅ Biểu đồ dòng tiền</td><td>Mọi khách hàng</td></tr>
  <tr><td>✅ Phân tích đầu tư</td><td>Mọi khách hàng</td></tr>
  <tr><td>✅ Hiệu quả môi trường</td><td>Doanh nghiệp lớn / CSR</td></tr>
</table>

<div class="page-break"></div>
<h1>8. FAQ – Tình huống thường gặp</h1>
<h3>❓ Khách hàng không có Load Profile?</h3>
<p>→ Dùng <strong>Smart Design</strong>: Chọn loại hình + nhập kWh/tháng từ hóa đơn.</p>
<h3>❓ Tỷ lệ tự dùng quá thấp (< 50%)?</h3>
<p>→ <strong>Giảm công suất kWp</strong> hoặc nhấn nút "Đề xuất an toàn".</p>
<h3>❓ Khách hàng muốn Zero-Export?</h3>
<p>→ Nhấn <strong>"Đề xuất an toàn" (Safe Fit)</strong>. Hệ thống sẽ tính công suất tối đa không dư thừa.</p>
<h3>❓ Số liệu tiết kiệm khác so với Engineering?</h3>
<p>→ Kiểm tra: cấp điện áp, loại giá điện, hệ số tổn thất.</p>

<div class="page-break"></div>
<h1>9. Thuật ngữ quan trọng</h1>
<table class="glossary">
  <tr><th>Thuật ngữ</th><th>Giải thích</th></tr>
  <tr><td>kWp</td><td>Công suất đỉnh của hệ thống solar (càng cao → nhiều điện hơn)</td></tr>
  <tr><td>PSH</td><td>Số giờ nắng đỉnh/ngày – đo mức bức xạ mặt trời</td></tr>
  <tr><td>Load Profile</td><td>Biểu đồ tiêu thụ điện theo giờ của khách hàng</td></tr>
  <tr><td>Tự dùng</td><td>Phần điện solar dùng trực tiếp (không bán/cắt giảm)</td></tr>
  <tr><td>Cắt giảm</td><td>Phần điện solar dư thừa bị lãng phí</td></tr>
  <tr><td>BESS</td><td>Pin lưu trữ – tích điện dư ban ngày, dùng ban đêm</td></tr>
  <tr><td>Payback</td><td>Thời gian hoàn vốn (số năm tiết kiệm = đầu tư)</td></tr>
  <tr><td>IRR</td><td>Tỷ suất sinh lời – so sánh với lãi suất ngân hàng</td></tr>
  <tr><td>NPV</td><td>Giá trị ròng – nếu > 0 tức dự án có lãi</td></tr>
  <tr><td>CAPEX</td><td>Tổng vốn đầu tư ban đầu</td></tr>
  <tr><td>O&M</td><td>Chi phí Vận hành & Bảo trì hàng năm</td></tr>
  <tr><td>TOU</td><td>Biểu giá theo giờ: Cao điểm / Bình thường / Thấp điểm</td></tr>
  <tr><td>Zero-Export</td><td>Chế độ không bán điện lên lưới</td></tr>
  <tr><td>Peak Shaving</td><td>Dùng pin xả vào giờ cao điểm để giảm chi phí</td></tr>
</table>

<div class="footer">© 2026 CAS Energy Solutions – Solar Optimizer v2.0</div>
</div>
</body></html>`;

// ===== ENGINEERING GUIDE HTML =====
const engHTML = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>Hướng dẫn Engineering - Solar Optimizer</title>${CSS}</head><body>

<div class="cover" style="background:linear-gradient(135deg,#0f172a 0%,#1a3a2a 50%,#0f172a 100%)">
  <div class="logo-text">CAS ENERGY SOLUTIONS</div>
  <h1>🔧 HƯỚNG DẪN KỸ THUẬT<br/>SOLAR OPTIMIZER</h1>
  <div class="subtitle">Dành cho đội ngũ Kỹ thuật (Engineering Team)</div>
  <p style="color:rgba(255,255,255,0.7);max-width:500px">Tài liệu kỹ thuật đầy đủ về logic tính toán, cấu hình hệ thống, và workflow kỹ thuật</p>
  <div class="version">Phiên bản v2.0 • Tháng 3/2026</div>
</div>

<div class="content">

<div class="toc">
  <h3>📑 Mục Lục</h3>
  <ol>
    <li>Kiến trúc hệ thống</li>
    <li>Dữ liệu đầu vào & Parsers</li>
    <li>Logic tính toán năng lượng mặt trời</li>
    <li>Load Profile & Synthetic Generation</li>
    <li>Hệ thống giá điện EVN (TOU)</li>
    <li>Inverter Selection Algorithm</li>
    <li>BESS Simulation Engine</li>
    <li>System Losses & Derate Factors</li>
    <li>Financial Model & Formulas</li>
    <li>Optimization Engine</li>
    <li>Configuration Defaults</li>
  </ol>
</div>

<div class="page-break"></div>
<h1>1. Kiến trúc hệ thống</h1>
<div class="img-container no-break">
  <img src="${imgBase64('08_architecture.png')}" alt="Architecture"/>
  <div class="img-caption">Hình 1: Sơ đồ kiến trúc hệ thống Solar Optimizer</div>
</div>
<h2>1.1 Tech Stack</h2>
<table>
  <tr><th>Layer</th><th>Công nghệ</th></tr>
  <tr><td>Frontend</td><td>React + Vite</td></tr>
  <tr><td>Styling</td><td>TailwindCSS</td></tr>
  <tr><td>Charts</td><td>Recharts</td></tr>
  <tr><td>Auth</td><td>Supabase Auth</td></tr>
  <tr><td>PDF Export</td><td>html-to-image + jsPDF</td></tr>
</table>

<h2>1.2 Cấu trúc thư mục</h2>
<div class="code-block">src/
├── App.jsx                    # Entry point, auth + role routing
├── SolarOptimizer.jsx         # Component chính (3696 lines)
├── domain/usecases/
│   ├── CalculateEnergyGeneration.js   # Core energy sim
│   ├── CalculateFinancials.js         # Financial model
│   └── CalculatePeakShaving.js        # Peak shaving
├── utils/
│   ├── inverterOptimizer.js           # Inverter selection
│   ├── loadProfileGenerator.js        # Synthetic load gen
│   └── loadProfilesData.js            # 20+ pre-built profiles
├── data/
│   ├── provinces.json                 # 63 provinces + PSH
│   ├── evn_tariffs.js                 # EVN price tables
│   └── sources/HardwareDatabase.js    # Panel/Inverter/BESS specs
└── presentation/features/
    ├── dashboard/  ├── design/
    ├── finance/    └── report/</div>

<h2>1.3 Role-based Access</h2>
<div class="code-block">// App.jsx – Role detection from email
const getUserRole = (user) => {
    return user.email.includes('sale') ? 'sales' : 'engineer';
};</div>

<div class="page-break"></div>
<h1>2. Dữ liệu đầu vào & Parsers</h1>
<h2>2.1 Supported Formats</h2>
<table>
  <tr><th>Parser</th><th>Format</th><th>Mô tả</th></tr>
  <tr><td>parseGSAExcel</td><td>Excel</td><td>Global Solar Atlas export</td></tr>
  <tr><td>parsePVSystCSV</td><td>CSV</td><td>PVsyst simulation output</td></tr>
  <tr><td>parse8760Data</td><td>CSV/JSON</td><td>8760 hourly annual data</td></tr>
  <tr><td>processExcelData</td><td>Excel</td><td>Generic load profile</td></tr>
  <tr><td>parseSmartDesignData</td><td>Internal</td><td>Smart Design profiles</td></tr>
</table>

<h2>2.2 Province Data</h2>
<div class="code-block">// provinces.json structure
{
  "id": "ho_chi_minh",
  "name": "TP. Hồ Chí Minh",
  "peakSunHours": 4.02,
  "yield_yearly": 1467,
  "monthly_distribution": [135,120,149,147,136,113,116,119,105,111,110,106]
}</div>

<div class="page-break"></div>
<h1>3. Logic tính toán năng lượng</h1>
<div class="img-container no-break">
  <img src="${imgBase64('02_dashboard.png')}" alt="Dashboard"/>
  <div class="img-caption">Hình 2: Kết quả tính toán hiển thị trên Dashboard</div>
</div>
<h2>3.1 Core Formula</h2>
<div class="code-block">Solar Power (kW) = Solar Unit × System Size (kWp) × Calibration × System Derate</div>
<h2>3.2 Inverter Clipping (AC Capping)</h2>
<div class="code-block">if (solarPowerKw > inverterMaxAcKw) {
    solarPowerKw = inverterMaxAcKw;  // Clip to AC limit
}</div>

<div class="page-break"></div>
<h1>4. Load Profile Generation</h1>
<div class="img-container no-break">
  <img src="${imgBase64('04_smart_design.png')}" alt="Smart Design"/>
  <div class="img-caption">Hình 3: Smart Design – Chọn loại hình phụ tải để tạo synthetic profile</div>
</div>
<h2>4.1 Synthetic Profile Algorithm</h2>
<div class="code-block">// utils/loadProfileGenerator.js
// Step 1: Normalize weights (sum = 1)
normalizedWeight[h] = baseProfile[h] / sum(baseProfile)

// Step 2: Working vs off days
avgDailyWork = monthlyKWh / (workDays + offDays × offDayRatio)

// Step 3: Hourly distribution with noise
hourlyLoad = dailyTotal × normalizedWeight[h] × randomFactor(±10%)

// Step 4: Cooling boost (May-July, 12:00-16:00)
if (hasCooling) hourlyLoad *= 1.20  // +20%</div>

<div class="page-break"></div>
<h1>5. Giá điện EVN (TOU)</h1>
<h2>5.1 TOU Schedule</h2>
<div class="code-block">Peak:     09:30-11:30, 17:00-20:00 (Mon-Sat only)
Normal:   04:00-09:30, 11:30-17:00, 20:00-22:00
Off-Peak: 22:00-04:00 (every day)</div>
<h2>5.2 EVN Tariffs – Sản xuất (VNĐ/kWh)</h2>
<table>
  <tr><th>Cấp điện áp</th><th>Bình thường</th><th>Cao điểm</th><th>Thấp điểm</th></tr>
  <tr><td>110kV+</td><td>1,811</td><td>3,266</td><td>1,146</td></tr>
  <tr><td>22kV-110kV</td><td>1,833</td><td>3,398</td><td>1,190</td></tr>
  <tr><td>6kV-22kV</td><td>1,899</td><td>3,508</td><td>1,234</td></tr>
  <tr><td>< 6kV</td><td>1,987</td><td>3,640</td><td>1,300</td></tr>
</table>
<h2>5.3 EVN Tariffs – Kinh doanh (VNĐ/kWh)</h2>
<table>
  <tr><th>Cấp điện áp</th><th>Bình thường</th><th>Cao điểm</th><th>Thấp điểm</th></tr>
  <tr><td>22kV+</td><td>2,887</td><td>5,025</td><td>1,609</td></tr>
  <tr><td>6kV-22kV</td><td>3,108</td><td>5,202</td><td>1,829</td></tr>
  <tr><td>< 6kV</td><td>3,152</td><td>5,422</td><td>1,918</td></tr>
</table>

<div class="page-break"></div>
<h1>6. Inverter Selection</h1>
<div class="img-container no-break">
  <img src="${imgBase64('05_design_bess.png')}" alt="Design"/>
  <div class="img-caption">Hình 4: Cấu hình Inverter và BESS trong tab Thiết kế</div>
</div>
<div class="code-block">// utils/inverterOptimizer.js
targetAC = targetDC / dcAcRatio  // Default: 1.25

// Greedy fill algorithm
while (remainingAC > 0) {
    bestFit = findOptimalInverter(remainingAC, inverterDB)
    selection[bestFit.id]++
    remainingAC -= bestFit.acPower
}
// Verify DC input limit
while (totalMaxPv < targetDC) addLargestInverter()</div>

<div class="page-break"></div>
<h1>7. BESS Simulation</h1>
<table>
  <tr><th>Parameter</th><th>Value</th></tr>
  <tr><td>Charge/Discharge Eff.</td><td>95% each (90.25% round-trip)</td></tr>
  <tr><td>Depth of Discharge</td><td>90%</td></tr>
</table>
<div class="code-block">// Charging from solar excess
realChargeInput = min(excessSolar, roomInBattery / 0.95)
actualStored = realChargeInput × 0.95

// Discharging
availableEnergy = (currentSoC - minSoC) × 0.95
outputToLoad = min(deficit, availableEnergy, maxTransfer)

// BESS Sizing Heuristic
bessKwh = solarKwp × bessHours × 0.25  // C&I ratio
bessKw  = bessKwh / 2                    // C/2 rate</div>

<div class="page-break"></div>
<h1>8. System Losses</h1>
<table>
  <tr><th>Loại tổn thất</th><th>Giá trị</th><th>Mô tả</th></tr>
  <tr><td>Temperature</td><td>5-10%</td><td>Panel > 25°C</td></tr>
  <tr><td>Soiling</td><td>2-5%</td><td>Bụi, lá cây</td></tr>
  <tr><td>Cable</td><td>1-3%</td><td>DC & AC wiring</td></tr>
  <tr><td>Inverter</td><td>2-4%</td><td>DC→AC conversion</td></tr>
</table>
<div class="code-block">systemDerate = 1 - (totalLossPct / 100)
// Example: 13% loss → derate = 0.87</div>
<div class="warn">Khi dùng PVOUT data (GSA), losses đã included. Đặt loss = 0% để tránh double-counting.</div>

<div class="page-break"></div>
<h1>9. Financial Model</h1>
<div class="img-container no-break">
  <img src="${imgBase64('06_finance.png')}" alt="Finance"/>
  <div class="img-caption">Hình 5: Tab Kịch bản Đầu tư – Financial Analysis</div>
</div>
<h2>9.1 Revenue Year 1</h2>
<div class="code-block">revenueSavings = (usedPeak × pricePeak) + (usedNormal × priceNormal) + (usedOffPeak × priceOffPeak)
revenueExport = totalExported × gridInjectionPrice
firstYearIncome = revenueSavings + revenueExport - costGridCharge</div>
<h2>9.2 Degradation & Escalation</h2>
<div class="code-block">degradationFactor = (1 - 0.0055) ^ (year - 1)  // 0.55%/year
escalationFactor  = (1 + 0.020) ^ (year - 1)   // 2.0%/year
annualRevenue = firstYearIncome × degradation × escalation</div>
<h2>9.3 Loan (PMT)</h2>
<div class="code-block">r = annualRate / 12
PMT = (principal × r × (1+r)^n) / ((1+r)^n - 1)</div>
<h2>9.4 NPV & IRR</h2>
<div class="code-block">NPV = -equity + Σ(CF_t / (1 + discountRate)^t)   // discount: 10%
IRR = rate where NPV = 0  (binary search, 100 iterations)</div>
<h2>9.5 Payback</h2>
<div class="code-block">paybackYear = (year-1) + |prevCumulative| / netCashFlow[year]</div>

<div class="page-break"></div>
<h1>10. Optimization Engine</h1>
<div class="code-block">// Grid Search
for (kwp = peakLoad×0.20; kwp <= peakLoad×1.50; kwp += 50) {
    for (hours of [0, 1, 2, 4]) {
        bessKwh = kwp × hours × 0.25
        stats = calculateEnergy(kwp, data, bessKwh, ...)
        fin = calculateFinancials(totalCapex, stats, ...)
        results.push({ kwp, bessKwh, payback, irr, npv })
    }
}
results.sort((a, b) => a.payback - b.payback)  // Best payback first</div>
<h2>Zero-Export (Safe Fit)</h2>
<div class="code-block">1. Find month with minimum consumption
2. Calculate base + variable load during daytime
3. Find MIN load during peak solar (11:00-13:00) on weekends
4. Target kWp = that minimum load value (1:1 ratio)</div>
<div class="warn">Safe Fit rất bảo thủ: thấp hơn 30-50% so với Optimal. Chỉ dùng khi KH tuyệt đối không muốn dư thừa.</div>

<div class="page-break"></div>
<h1>11. Configuration Defaults</h1>
<table>
  <tr><th>Parameter</th><th>Default</th></tr>
  <tr><td>Project Life</td><td>20 years</td></tr>
  <tr><td>Degradation</td><td>0.55%/year</td></tr>
  <tr><td>Escalation</td><td>2.0%/year</td></tr>
  <tr><td>Discount Rate</td><td>10%</td></tr>
  <tr><td>O&M</td><td>1.0-1.5% CAPEX</td></tr>
  <tr><td>DC/AC Ratio</td><td>1.25</td></tr>
  <tr><td>Battery DoD</td><td>90%</td></tr>
  <tr><td>Battery Eff.</td><td>90.25%</td></tr>
  <tr><td>CIT Rate</td><td>20%</td></tr>
  <tr><td>Solar Price</td><td>12M VNĐ/kWp</td></tr>
  <tr><td>BESS Price</td><td>9M VNĐ/kWh</td></tr>
  <tr><td>CO₂ Factor</td><td>0.816 kg/kWh</td></tr>
</table>

<h2>Environmental Constants</h2>
<div class="code-block">CO2_KG_PER_KWH   = 0.816   // Vietnam Grid Emission Factor
TREES_PER_CO2_KG = 0.06    // ~16.7 kg CO2/tree/year
COAL_KG_PER_KWH  = 0.4     // Standard Coal equivalent
OIL_LITERS_PER_KWH = 0.25  // Standard Oil equivalent</div>

<div class="footer">© 2026 CAS Energy Solutions – Solar Optimizer v2.0 – Engineering Documentation</div>
</div>
</body></html>`;

// Write files
const saleOutPath = path.join(__dirname, 'HUONG_DAN_SALE.html');
const engOutPath = path.join(__dirname, 'HUONG_DAN_ENGINEERING.html');

fs.writeFileSync(saleOutPath, saleHTML, 'utf-8');
fs.writeFileSync(engOutPath, engHTML, 'utf-8');

console.log('✅ Created: ' + saleOutPath);
console.log('✅ Created: ' + engOutPath);
console.log('');
console.log('👉 Mở file HTML trong Chrome → Ctrl+P → Save as PDF');
console.log('   Chọn: Margins = None, Background graphics = ON');
