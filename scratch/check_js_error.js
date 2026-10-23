const puppeteer = require('puppeteer');
(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
        const page = await browser.newPage();
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
        await page.goto('https://betwithnet.com/games/chicken_road.html', { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 2000));
        await browser.close();
    } catch(e) {
        console.error(e);
    }
})();
