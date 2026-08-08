/* Exercises the two entry paths the jsdom smoke suite can't: a real CSV file picked through the file
   input, and a real .xlsx parsed by the lazily-CDN-loaded SheetJS. */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const TMP = path.join(__dirname, '_fixtures');
let pass = 0, fail = 0;
const check = (label, cond) => { cond ? (pass++, console.log('  OK   ' + label)) : (fail++, console.log('  FAIL ' + label)); };

const CSV = [
  'Candidate Name,Contact Number,Email Address,Polytechnic,Programme,Lead Date',
  '"Hasan, Md. Tarek",01911100022,tarek@example.com,Dhaka Polytechnic Institute,Web & App Development,05/08/2026',
  'Sumaiya Islam,01911100023,sumaiya@example.com,Rajshahi Polytechnic Institute,PLC,2026-08-04'
].join('\n');

(async () => {
  fs.mkdirSync(TMP, { recursive: true });
  const csvPath = path.join(TMP, 'visit-leads.csv');
  fs.writeFileSync(csvPath, CSV, 'utf8');

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));

  console.log('=== CSV file upload ===');
  await page.goto('http://localhost:8099/index.html');
  await page.waitForTimeout(900);
  await page.evaluate(() => navigate('leads'));
  await page.click('[data-action="open-lead-import"]');
  await page.setInputFiles('#liFileInput', csvPath);
  await page.waitForTimeout(600);

  check('CSV file advances the wizard to the mapping step', await page.isVisible('.li-map-table'));
  check('File name shown in the modal subtitle', (await page.textContent('#modalSub')).includes('visit-leads.csv'));
  const mapping = await page.evaluate(() => LeadImportState.mapping);
  check('"Candidate Name" auto-mapped to name', mapping.name === 'Candidate Name');
  check('"Contact Number" auto-mapped to phone', mapping.phone === 'Contact Number');
  check('"Polytechnic" auto-mapped to institution', mapping.institution_id === 'Polytechnic');
  check('"Programme" auto-mapped to course', mapping.interested_course_id === 'Programme');
  check('"Lead Date" auto-mapped to captured-on', mapping.created_at === 'Lead Date');

  await page.click('[data-action="li-goto-preview"]');
  await page.waitForTimeout(400);
  const csvRows = await page.evaluate(() => LeadImportState.preview.rows.map(r => ({ v: r.values, s: r.status })));
  check('Quoted comma inside a name survived the round trip', csvRows[0].v.name === 'Hasan, Md. Tarek');
  check('Day-first date from the CSV parsed', csvRows[0].v.created_at === '2026-08-05');
  check('Institution resolved from a partial name', csvRows[0].v.institution_id === 1);
  check('Course resolved from a partial name', typeof csvRows[0].v.interested_course_id === 'number');
  check('Both CSV rows are importable', csvRows.every(r => r.s === 'ready' || r.s === 'warn'));

  const before = await page.evaluate(() => DB.leads.length);
  await page.click('[data-action="li-commit"]');
  await page.waitForTimeout(400);
  check('CSV leads committed', await page.evaluate(() => DB.leads.length) === before + 2);
  await page.screenshot({ path: 'shots/9-csv-imported.png' });

  console.log('\n=== Excel (.xlsx) upload ===');
  // Built in-browser with the same CDN copy of SheetJS the wizard uses, which also proves the URL resolves.
  const b64 = await page.evaluate(async () => {
    const XLSX = await ensureXlsxLib();
    const ws = XLSX.utils.aoa_to_sheet([
      ['Full Name', 'Mobile', 'Institute', 'Course of Interest'],
      ['Excel Person One', '01922200011', 'Dhaka Polytechnic Institute', 'Web & App Development'],
      ['Excel Person Two', '01922200012', 'Khulna Polytechnic Institute', 'CNC']
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Visit Leads');
    return XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  });
  check('SheetJS loaded on demand from the CDN', typeof b64 === 'string' && b64.length > 100);

  const xlsxPath = path.join(TMP, 'visit-leads.xlsx');
  fs.writeFileSync(xlsxPath, Buffer.from(b64, 'base64'));

  await page.reload();
  await page.waitForTimeout(900);
  await page.evaluate(() => navigate('leads'));
  await page.click('[data-action="open-lead-import"]');
  await page.setInputFiles('#liFileInput', xlsxPath);
  await page.waitForTimeout(2500); // allow the CDN fetch on a cold page

  check('.xlsx workbook advances the wizard to the mapping step', await page.isVisible('.li-map-table'));
  check('Sheet name surfaced alongside the file name', (await page.textContent('#modalSub')).includes('Visit Leads'));
  const xlsxMap = await page.evaluate(() => LeadImportState.mapping);
  check('"Mobile" auto-mapped to phone', xlsxMap.phone === 'Mobile');
  check('"Institute" auto-mapped to institution', xlsxMap.institution_id === 'Institute');
  check('"Course of Interest" auto-mapped to course', xlsxMap.interested_course_id === 'Course of Interest');

  await page.click('[data-action="li-goto-preview"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'shots/10-xlsx-preview.png' });
  const xRows = await page.evaluate(() => LeadImportState.preview.rows.map(r => ({ v: r.values, s: r.status })));
  check('Both Excel rows parsed', xRows.length === 2);
  check('Excel row values read correctly', xRows[0].v.name === 'Excel Person One' && xRows[0].v.phone === '01922200011');
  check('Excel institution resolved', xRows[1].v.institution_id === 7);

  const beforeX = await page.evaluate(() => DB.leads.length);
  await page.click('[data-action="li-commit"]');
  await page.waitForTimeout(400);
  check('Excel leads committed', await page.evaluate(() => DB.leads.length) === beforeX + 2);

  check('no page errors', pageErrors.length === 0);
  if(pageErrors.length) console.log(pageErrors.join('\n'));

  await browser.close();
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed ===`);
  process.exit(fail ? 1 : 0);
})();
