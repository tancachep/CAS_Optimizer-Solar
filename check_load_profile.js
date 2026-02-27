/**
 * Script kiểm tra dữ liệu phụ tải từ file Load Profile
 * Chạy: node check_load_profile.js
 */
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.resolve(__dirname, '../TEST/HUYNH DUC 1/HUYNHDUC1 LOAD PROFILE ( 08-2024 TO 09-2025).xlsx');

console.log('=== KIỂM TRA FILE LOAD PROFILE ===');
console.log('File:', filePath);
console.log('');

try {
    const wb = XLSX.readFile(filePath);

    console.log('📋 Danh sách Sheet:');
    wb.SheetNames.forEach((name, i) => {
        const ws = wb.Sheets[name];
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        const rows = range.e.r - range.s.r + 1;
        const cols = range.e.c - range.s.c + 1;
        console.log(`  ${i + 1}. "${name}" - ${rows} hàng x ${cols} cột`);
    });

    console.log('\n📊 Chi tiết từng sheet (10 hàng đầu):');
    wb.SheetNames.forEach((name) => {
        const ws = wb.Sheets[name];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        console.log(`\n--- Sheet: "${name}" ---`);
        console.log(`Tổng hàng: ${data.length}`);

        // In 10 hàng đầu
        const preview = data.slice(0, 10);
        preview.forEach((row, i) => {
            const cells = row.slice(0, 8).map(c => {
                if (c === '') return '(trống)';
                if (typeof c === 'number') return c.toFixed ? Number(c.toFixed(4)) : c;
                return String(c).substring(0, 25);
            });
            console.log(`  Row ${i + 1}: ${cells.join(' | ')}`);
        });

        // Kiểm tra dữ liệu số (phụ tải)
        let numericCount = 0;
        let minVal = Infinity, maxVal = -Infinity;
        data.forEach(row => {
            row.forEach(cell => {
                if (typeof cell === 'number' && cell > 0) {
                    numericCount++;
                    if (cell < minVal) minVal = cell;
                    if (cell > maxVal) maxVal = cell;
                }
            });
        });

        if (numericCount > 0) {
            console.log(`  📈 Dữ liệu số: ${numericCount} giá trị`);
            console.log(`  📉 Min: ${minVal.toFixed(4)} | Max: ${maxVal.toFixed(4)}`);
        } else {
            console.log(`  ⚠️ Không có dữ liệu số`);
        }
    });

} catch (err) {
    console.error('❌ Lỗi:', err.message);
}
