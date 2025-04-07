// N64Config.js - Override for N64 core settings
export function configureN64EmulatorJS() {
  // Store the original getCore function if it exists
  if (window.EmulatorJS && window.EmulatorJS.prototype.getCore) {
    const originalGetCore = window.EmulatorJS.prototype.getCore;
    
    // Override the getCore function to force parallel_n64 for N64 games
    window.EmulatorJS.prototype.getCore = function(generic) {
      // If using the n64 core (either directly or after mapping), force parallel_n64
      if ((!generic && this.config.system === 'n64') || 
          (generic && this.getCore(true) === 'n64')) {
        return 'parallel_n64';
      }
      
      // Otherwise use the original function
      return originalGetCore.call(this, generic);
    };
    
    console.log("[N64Config] Successfully overrode N64 core to use parallel_n64");
  } else {
    console.warn("[N64Config] Could not find EmulatorJS.prototype.getCore to override");
  }
}