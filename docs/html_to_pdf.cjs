const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });

  const files = [
    { html: 'HUONG_DAN_SALE.html', pdf: 'HUONG_DAN_SALE.pdf' },
    { html: 'HUONG_DAN_ENGINEERING.html', pdf: 'HUONG_DAN_ENGINEERING.pdf' },
    { html: 'CAM_NANG_SALE_SOLAR.html', pdf: 'CAM_NANG_SALE_SOLAR.pdf' },
  ];

  for (const f of files) {
    const page = await browser.newPage();
    const htmlPath = path.resolve(__dirname, f.html);
    await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    const pdfPath = path.resolve(__dirname, f.pdf);
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    console.log('✅ PDF created: ' + pdfPath);
    await page.close();
  }

  await browser.close();
  console.log('\n🎉 Done! Both PDF files are ready.');
})();
