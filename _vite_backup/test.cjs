const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

async function run() {
  console.log("Starting preview server...");
  const preview = spawn('npm', ['run', 'preview'], { shell: true });
  
  await new Promise(r => setTimeout(r, 5000)); // wait for server

  console.log("Launching puppeteer...");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  console.log("Navigating to http://localhost:4173...");
  try {
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle0', timeout: 10000 });
  } catch (e) {
    console.log("Navigation error:", e.message);
  }
  
  await new Promise(r => setTimeout(r, 2000)); // allow time for errors
  
  await browser.close();
  preview.kill();
  console.log("Done.");
}
run();
