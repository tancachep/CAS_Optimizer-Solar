const fs = require('fs');
const path = require('path');

const provincesFile = path.join(__dirname, 'src', 'data', 'provinces.json');

if (!fs.existsSync(provincesFile)) {
    console.error('File not found:', provincesFile);
    process.exit(1);
}

const provinces = JSON.parse(fs.readFileSync(provincesFile, 'utf8'));

let md = '# Bảng so sánh Sản lượng PV sau khi cập nhật\n\n';
md += 'Dưới đây là bảng so sánh giữa sản xuất trung bình tháng cũ (chia đều 12 tháng) và sự biến thiên sản lượng mới dựa trên dữ liệu GSA.\n\n';
md += '| STT | Tỉnh/Thành | Tổng năm (kWh) | TB Cũ (kWh/tháng) | Thấp nhất (Mới) | Cao nhất (Mới) | Độ chênh (Max-Min) |\n';
md += '|:---:|:---|:---:|:---:|:---:|:---:|:---:|\n';

let stt = 1;
provinces.forEach((p) => {
    if (p.id === 'viet_nam') return;
    
    const oldAvg = (p.yield_yearly / 12).toFixed(1);
    const minMonth = Math.min(...p.monthly_distribution);
    const maxMonth = Math.max(...p.monthly_distribution);
    const diff = maxMonth - minMonth;
    
    md += `| ${stt++} | ${p.name} | ${p.yield_yearly} | ${oldAvg} | ${minMonth} | ${maxMonth} | ${diff} |\n`;
});

md += '\n\n> [!NOTE]\n';
md += '> **Độ chênh (Max-Min)**: Con số này càng cao chứng tỏ sản lượng thay đổi rất mạnh giữa các mùa (ví dụ miền Bắc mùa đông nắng yếu, mùa hè nắng mạnh).\n';
md += '> Các tỉnh miền Nam thường có độ chênh thấp hơn vì nắng ổn định quanh năm.';

process.stdout.write(md);
