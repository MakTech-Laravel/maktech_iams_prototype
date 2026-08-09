const { join } = require('path');

/* Pin Puppeteer's browser download inside the project instead of the user's temp cache.
   Browsershot (spatie/laravel-pdf) resolves Chromium through Puppeteer, so if the binary lands in a
   temp directory that gets cleaned, PDF generation fails at runtime with no obvious cause. Keeping it
   under node_modules means `npm install` reproduces it on every machine and on deploy. */
module.exports = {
    cacheDir: join(__dirname, 'node_modules', '.cache', 'puppeteer'),
};
