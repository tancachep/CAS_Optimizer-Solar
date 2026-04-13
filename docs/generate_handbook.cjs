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
  .cover { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; background:linear-gradient(135deg,#1e40af 0%,#1e3a8a 50%,#0f172a 100%); color:white; text-align:center; padding:60px 40px; }
  .cover h1 { font-size:42px; font-weight:900; margin-bottom:10px; }
  .cover .subtitle { font-size:22px; color:#fbbf24; font-weight:600; margin-bottom:30px; letter-spacing:1px; }
  .cover .version { font-size:14px; color:rgba(255,255,255,0.5); margin-top:40px; border-top: 1px solid rgba(255,255,255,0.2); padding-top:20px; width:200px; }
  .cover .logo { font-size:32px; font-weight:900; color:#fbbf24; margin-bottom:10px; background:rgba(255,255,255,0.1); padding:10px 20px; border-radius:12px; }
  
  .content { max-width:900px; margin:0 auto; padding:40px 60px; }
  
  .section { margin:40px 0; border-bottom:1px solid #e2e8f0; padding-bottom:40px; }
  .section:last-child { border-bottom:none; }
  
  h1 { font-size:32px; font-weight:900; color:#1e3a8a; margin-bottom:20px; display:flex; align-items:center; }
  h1 .icon { margin-right:15px; font-size:36px; }
  
  h2 { font-size:24px; font-weight:800; color:#0f172a; margin:30px 0 15px; background:#f8fafc; padding:10px 15px; border-radius:8px; border-left:6px solid #fbbf24; }
  
  h3 { font-size:18px; font-weight:700; color:#334155; margin:20px 0 10px; }
  
  p { margin:12px 0; font-size:16px; color:#475569; }
  
  .instruction-box { background:#f0f9ff; border-radius:12px; padding:20px 25px; margin:20px 0; border:1px solid #bae6fd; }
  .instruction-box h4 { color:#0369a1; margin-bottom:10px; display:flex; align-items:center; }
  .instruction-box h4::before { content:"👉 "; margin-right:8px; }
  .instruction-box li { margin-left:20px; margin-bottom:8px; font-size:15px; color:#0c4a6e; }
  
  .explanation-box { background:#fefce8; border-radius:12px; padding:20px 25px; margin:20px 0; border:1px solid #fef08a; position:relative; }
  .explanation-box h4 { color:#854d0e; margin-bottom:10px; display:flex; align-items:center; }
  .explanation-box h4::before { content:"🗣️ "; margin-right:8px; }
  .explanation-box blockquote { font-style:italic; font-size:17px; color:#713f12; border-left:none; padding:0; margin:0; line-height:1.6; }
  
  .img-container { margin:30px 0; text-align:center; }
  .img-container img { max-width:100%; border-radius:16px; box-shadow:0 10px 30px rgba(0,0,0,0.15); border:1px solid #e2e8f0; }
  .img-caption { font-size:13px; color:#94a3b8; margin-top:12px; font-weight:500; }
  
  .tip-badge { display:inline-block; background:#10b981; color:white; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700; text-transform:uppercase; margin-bottom:8px; }
  
  .footer { text-align:center; color:#94a3b8; font-size:12px; margin-top:60px; padding:30px; border-top:1px solid #e2e8f0; }
  
  .intro-text { font-size:18px; color:#475569; margin-bottom:40px; text-align:center; max-width:700px; margin-left:auto; margin-right:auto; line-height:1.6; }
</style>
`;

const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>Cẩm nang Sale Solar Optimizer</title>${CSS}</head><body>

<div class="cover">
  <div class="logo">CAS SOLAR</div>
  <h1>CẨM NANG SỬ DỤNG<br/>SOLAR OPTIMIZER</h1>
  <div class="subtitle">DÀNH CHO ĐỘI NGŨ KINH DOANH</div>
  <p style="color:rgba(255,255,255,0.8);max-width:500px">Làm chủ công cụ tính toán năng lượng mặt trời chỉ trong 5 bước đơn giản</p>
  <div class="version">Phiên bản v2.0 • 2026</div>
</div>

<div class="content">

  <div class="intro-text">
    Chào mừng bạn đến với công cụ tính toán năng lượng mặt trời chuyên nghiệp. Cẩm nang này giúp bạn làm chủ 5 tính năng quan trọng nhất để tư vấn khách hàng "chuẩn không cần chỉnh".
  </div>

  <div class="section">
    <h2>1. PHÂN TÍCH PHỤ TẢI & SMART DESIGN</h2>
    <p>Đây là bước "khám bệnh" để hiểu rõ thói quen dùng điện của khách hàng.</p>
    
    <div class="instruction-box">
      <h4>Cách dùng:</h4>
      <ul>
        <li><strong>Nếu có file Excel:</strong> Nhấn "Upload Load Profile" để hệ thống đọc dữ liệu thực.</li>
        <li><strong>Nếu chưa có file:</strong> Dùng Smart Design. Chọn loại hình (ví dụ: "Nhà máy 2 ca") và nhập số điện trung bình tháng (kWh) từ hóa đơn.</li>
      </ul>
    </div>

    <div class="img-container">
      <img src="${imgBase64('04_smart_design.png')}" alt="Smart Design"/>
      <div class="img-caption">Màn hình chọn loại hình doanh nghiệp trong Smart Design</div>
    </div>

    <div class="explanation-box">
      <h4>Nói với khách hàng thế nào?</h4>
      <blockquote>"Dựa trên loại hình sản xuất của anh/chị, phần mềm của em giả lập biểu đồ dùng điện 24/7 để biết lúc nào anh chị dùng nhiều điện nhất để lắp pin cho hiệu quả nhất."</blockquote>
    </div>
  </div>

  <div class="page-break"></div>

  <div class="section">
    <h2>2. CHỌN TỈNH THÀNH & GIỜ NẮNG (PSH)</h2>
    <p>Mỗi khu vực địa lý có mức độ nắng khác nhau, cần chọn đúng để kết quả chính xác.</p>
    
    <div class="instruction-box">
      <h4>Cách dùng:</h4>
      <ul>
        <li>Chọn đúng tỉnh thành nơi lắp đặt trong danh sách.</li>
        <li>Hệ thống tự điền số <strong>PSH (Peak Sun Hours)</strong> - tức là số giờ nắng "vàng" mỗi ngày.</li>
      </ul>
    </div>

    <div class="img-container">
      <img src="${imgBase64('03_province.png')}" alt="Province Selector"/>
      <div class="img-caption">Chọn tỉnh thành để lấy dữ liệu bức xạ mặt trời thực tế</div>
    </div>

    <div class="explanation-box">
      <h4>Nói với khách hàng thế nào?</h4>
      <blockquote>"Miền Nam mình có khoảng 4.4 giờ nắng đỉnh mỗi ngày, nên 1kWp pin mặt trời sẽ tạo ra khoảng 4.4 số điện. Em chọn đúng khu vực để con số tính toán ra tiền là chính xác nhất cho anh/chị."</blockquote>
    </div>
  </div>

  <div class="page-break"></div>

  <div class="section">
    <h2>3. THIẾT KẾ "1-CLICK" (OPTIMAL & SAFE FIT)</h2>
    <p>Tự động tìm kiếm giải pháp mang lại lợi nhuận cao nhất hoặc an toàn nhất.</p>
    
    <div class="instruction-box">
      <h4>Cách dùng:</h4>
      <ul>
        <li><strong>Nút Optimised:</strong> Tự động tìm công suất để khách hàng lấy lại vốn nhanh nhất.</li>
        <li><strong>Nút Safe Fit (Zero-Export):</strong> Hệ thống bóp nhỏ lại để vừa đủ dùng, không dư điện.</li>
      </ul>
    </div>

    <div class="img-container">
      <img src="${imgBase64('05_design_bess.png')}" alt="Design"/>
      <div class="img-caption">Điều chỉnh công suất bằng thanh trượt hoặc dùng chế độ tự động</div>
    </div>

    <div class="explanation-box">
      <h4>Nói với khách hàng thế nào?</h4>
      <blockquote>"Em dùng thuật toán để tối ưu: Một là lắp để nhanh lấy lại vốn nhất (Optimised), hai là lắp vừa khít với nhu cầu để không lãng phí điện (Safe Fit)."</blockquote>
    </div>
  </div>

  <div class="page-break"></div>

  <div class="section">
    <h2>4. CHỈ SỐ TÀI CHÍNH (PAYBACK, IRR)</h2>
    <p>Con số thuyết phục nhất để khách hàng quyết định đầu tư.</p>
    
    <div class="instruction-box">
      <h4>Các chỉ số cần chốt:</h4>
      <ul>
        <li><strong>Payback (Hoàn vốn):</strong> Sau bao nhiêu năm thì hòa vốn. (Dưới 5 năm là cực tốt).</li>
        <li><strong>IRR (Lãi suất):</strong> So sánh với lãi suất ngân hàng. (Trên 15% là rất hấp dẫn).</li>
        <li><strong>Tiết kiệm năm 1:</strong> Số tiền mặt khách hàng giữ lại được ngay năm đầu tiên.</li>
      </ul>
    </div>

    <div class="img-container">
      <img src="${imgBase64('06_finance.png')}" alt="Finance"/>
      <div class="img-caption">Bảng tóm tắt hiệu quả đầu tư và dòng tiền gửi khách hàng</div>
    </div>

    <div class="explanation-box">
      <h4>Nói với khách hàng thế nào?</h4>
      <blockquote>"Dự án này hoàn vốn chỉ sau 4.5 năm. Từ năm thứ 5 trở đi, mỗi năm anh chị 'bỏ túi' thêm 200 triệu tiền điện tiết kiệm được, coi như là lợi nhuận ròng."</blockquote>
    </div>
  </div>

  <div class="page-break"></div>

  <div class="section">
    <h2>5. XUẤT BÁO CÁO GỬI KHÁCH HÀNG</h2>
    <p>Biến các con số thành một bản đề xuất chuyên nghiệp trong 5 giây.</p>
    
    <div class="instruction-box">
      <h4>Cách dùng:</h4>
      <ul>
        <li>Vào tab <strong>Report</strong>. Nhấn "Xuất PDF Báo cáo".</li>
        <li>File PDF sẽ có đủ biểu đồ, lộ trình tiết kiệm 20 năm, và hiệu quả môi trường (CO2).</li>
      </ul>
    </div>

    <div class="img-container">
      <img src="${imgBase64('07_report.png')}" alt="Report"/>
      <div class="img-caption">Lựa chọn các nội dung muốn hiển thị trong báo cáo PDF</div>
    </div>

    <div class="explanation-box">
      <h4>Nói với khách hàng thế nào?</h4>
      <blockquote>"Em gửi anh/chị báo cáo chi tiết bằng PDF. Trong này có đủ biểu đồ minh họa và lộ trình tiết kiệm tiền điện từng năm để anh/chị trình ban giám đốc."</blockquote>
    </div>
  </div>

  <div class="section no-break">
    <div class="tip-badge">Mẹo chốt deal</div>
    <div class="instruction-box" style="background:#ecfdf5; border-color:#a7f3d0">
      <ul style="color:#065f46">
        <li><strong>Tỷ lệ tự dùng > 80%:</strong> Nhấn mạnh việc hệ thống được thiết kế rất "vừa vặn".</li>
        <li><strong>Nếu khách hàng dùng điện ban đêm:</strong> Gợi ý thêm BESS (Pin lưu trữ) để tối ưu.</li>
        <li><strong>Hiệu quả môi trường:</strong> Dùng chỉ số "Số cây xanh tương đương" để tăng cảm xúc khi tư vấn cho các doanh nghiệp quan tâm đến hình ảnh CSR.</li>
      </ul>
    </div>
  </div>

  <div class="footer">
    © 2026 CAS Energy Solutions – Solar Optimizer v2.0 – Cẩm nang Đào tạo Nội bộ
  </div>

</div>
</body></html>`;

const outPath = path.join(__dirname, 'CAM_NANG_SALE_SOLAR.html');
fs.writeFileSync(outPath, html, 'utf-8');
console.log('✅ Created: ' + outPath);
