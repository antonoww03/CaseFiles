import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
 testDir:'./tests-production',
 timeout:90000,
 expect:{timeout:30000},
 retries:process.env.CI?1:0,
 workers:1,
 use:{
  baseURL:process.env.CASEFILES_SITE_URL||'https://casefiles-game.onrender.com',
  actionTimeout:30000,
  navigationTimeout:60000,
  trace:'retain-on-failure',
  screenshot:'only-on-failure'
 },
 projects:[
  {name:'desktop-chromium',use:{...devices['Desktop Chrome']}},
  {name:'mobile-chromium',use:{...devices['Desktop Chrome'],viewport:{width:390,height:844},isMobile:true,hasTouch:true}}
 ]
});
