// Track the last active tab and whether we're switching
let lastActiveTabId = null;
let pendingTabSwitch = new Map(); // Maps tabId to { timestamp, approved }


const APPROVAL_DURATION = 5 * 60 * 1000;
// Default blocked sites - user can customize via popup
const DEFAULT_BLOCKED_SITES = [
  'twitter.com',
  'x.com',
  'facebook.com',
  'instagram.com',
  'reddit.com',
];

// Initialize storage with default values and request permissions
chrome.runtime.onInstalled.addListener(async () => {
  const { blockedSites, enabled } = await chrome.storage.sync.get(['blockedSites', 'enabled']);
  
  if (!blockedSites) {
    await chrome.storage.sync.set({ blockedSites: DEFAULT_BLOCKED_SITES });
  }
  if (enabled === undefined) {
    await chrome.storage.sync.set({ enabled: true });
  }
  
  // Request optional permissions for default sites
  await requestPermissionsForSites(DEFAULT_BLOCKED_SITES);
});

// Helper to request permissions for sites
async function requestPermissionsForSites(sites) {
  const origins = sites.map(site => `*://*.${site}/*`);
  
  try {
    const granted = await chrome.permissions.request({
      origins: origins
    });
    
    if (granted) {
      console.log('Permissions granted for:', sites);
    } else {
      console.log('Permissions denied by user');
    }
  } catch (error) {
    console.log('Permission request failed:', error);
  }
}

// Listen for navigation completion
chrome.webNavigation.onCompleted.addListener(async (details) => {
  // Only main frame (not iframes)
  if (details.frameId !== 0) return;
  
  await checkAndShowBarrier(details.tabId, details.url);
}, { url: [{ schemes: ['http', 'https'] }] });

// Helper function to check if barrier should be shown and display it
async function checkAndShowBarrier(tabId, url) {
  try {
    const { enabled, blockedSites } = await chrome.storage.sync.get(['enabled', 'blockedSites']);
    
    console.log('Extension enabled:', enabled);
    console.log('Blocked sites:', blockedSites);
    
    if (!enabled) {
      console.log('Extension is disabled');
      return;
    }

    console.log('Checking tab:', url);
    
    // Check if this tab needs a barrier
    const shouldBlock = shouldShowBarrier(url, blockedSites || DEFAULT_BLOCKED_SITES);
    console.log('Should show barrier:', shouldBlock);
    
    if (shouldBlock) {
      // Check if this tab was recently approved
      const approval = pendingTabSwitch.get(tabId);
      const now = Date.now();
      
      if (approval && approval.approved && (now - approval.timestamp < APPROVAL_DURATION)) {
        // Recently approved, allow it
        console.log('Tab recently approved, skipping barrier');
        return;
      }
      
      // Check if we have permission for this origin
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace(/^www\./, '');
      const origin = `*://*.${hostname}/*`;
      
      const hasPermission = await chrome.permissions.contains({
        origins: [origin]
      });
      
      if (!hasPermission) {
        console.log('No permission for', origin, '- cannot show barrier');
        return;
      }
      
      console.log('Dynamically injecting content script into tab', tabId);
      
      // Dynamically inject content script and CSS
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        });
        
        await chrome.scripting.insertCSS({
          target: { tabId: tabId },
          files: ['modal.css']
        });
        
        console.log('Scripts injected, sending SHOW_BARRIER message');
        
        // Wait a moment for scripts to initialize
        setTimeout(async () => {
          try {
            await chrome.tabs.sendMessage(tabId, {
              type: 'SHOW_BARRIER',
              url: url,
              minChars: 50,
              visitCount: 0
            });
            console.log('Barrier message sent successfully');
          } catch (error) {
            console.error('Could not send message:', error);
          }
        }, 100);
        
      } catch (error) {
        console.error('Could not inject scripts:', error);
      }
    }
  } catch (error) {
    console.error('Error in checkAndShowBarrier:', error);
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'BARRIER_APPROVED') {
    // Mark this tab as approved for the next 5 minutes
    pendingTabSwitch.set(sender.tab.id, {
      timestamp: Date.now(),
      approved: true
    });

    chrome.tabs.sendMessage(sender.tab.id, {
      type: 'START_TIMER',
      duration: APPROVAL_DURATION
    }).catch(error => {
      console.error('Could not send timer message:', error);
    });
    sendResponse({ success: true });
  }
  return true;
});

// Helper function to check if URL matches blocked sites
function shouldShowBarrier(url, blockedSites) {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    return blockedSites.some(site => {
      const cleanSite = site.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '');
      return hostname === cleanSite || hostname.endsWith('.' + cleanSite);
    });
  } catch (error) {
    return false;
  }
}

// Clean up old approvals periodically
setInterval(() => {
  const now = Date.now();
  for (const [tabId, approval] of pendingTabSwitch.entries()) {
    if (now - approval.timestamp > APPROVAL_DURATION) {
      pendingTabSwitch.delete(tabId);
    }
  }
}, 60000);