// Test script to check ScreenScraper platform IDs
const fetch = require('node-fetch');

async function checkPlatforms() {
  try {
    // Get the list of platforms from ScreenScraper
    const response = await fetch('https://www.screenscraper.fr/api2/systemesListe.php?devid=nanoy25822&devpassword=KvflDez0eEf&softname=JRPGLegend&ssid=nanoy25822&sspassword=nanoy25822&output=json');
    const data = await response.json();
    
    if (data.error) {
      console.error('API Error:', data.error);
      return;
    }
    
    // Extract and sort platforms by ID
    const platforms = data.response.systemes.map(sys => ({
      id: sys.id,
      name: sys.nom
    })).sort((a, b) => a.id - b.id);
    
    console.log('ScreenScraper Platform IDs:');
    console.log('==========================');
    platforms.forEach(platform => {
      console.log(`ID: ${platform.id}, Name: ${platform.name}`);
    });
    
    // Check specific platforms we're interested in
    const nesPlatform = platforms.find(p => p.name.toLowerCase().includes('nes') || p.name.toLowerCase().includes('nintendo'));
    const snesPlatform = platforms.find(p => p.name.toLowerCase().includes('snes') || p.name.toLowerCase().includes('super nintendo'));
    
    console.log('\nSpecific Platforms:');
    console.log('===================');
    console.log('NES:', nesPlatform);
    console.log('SNES:', snesPlatform);
    
    // Test Duck Hunt search on both platforms
    console.log('\nTesting Duck Hunt search:');
    console.log('========================');
    
    // Test on NES platform
    const nesId = nesPlatform ? nesPlatform.id : 1;
    console.log(`Testing Duck Hunt on NES (ID: ${nesId})...`);
    const nesResponse = await fetch(`https://www.screenscraper.fr/api2/jeuInfos.php?devid=nanoy25822&devpassword=KvflDez0eEf&softname=JRPGLegend&output=json&romnom=duck%20hunt&systemeid=${nesId}&ssid=nanoy25822&sspassword=nanoy25822`);
    const nesData = await nesResponse.json();
    console.log('NES Search Result:', nesData.response ? 'Game found' : 'No game found');
    
    // Test on SNES platform
    const snesId = snesPlatform ? snesPlatform.id : 3;
    console.log(`Testing Duck Hunt on SNES (ID: ${snesId})...`);
    const snesResponse = await fetch(`https://www.screenscraper.fr/api2/jeuInfos.php?devid=nanoy25822&devpassword=KvflDez0eEf&softname=JRPGLegend&output=json&romnom=duck%20hunt&systemeid=${snesId}&ssid=nanoy25822&sspassword=nanoy25822`);
    const snesData = await snesResponse.json();
    console.log('SNES Search Result:', snesData.response ? 'Game found' : 'No game found');
    
    if (snesData.response && snesData.response.jeu) {
      console.log('Game Platform:', snesData.response.jeu.systeme?.text || 'Unknown');
      console.log('Game Platform ID:', snesData.response.jeu.systemeid || 'Unknown');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkPlatforms(); 