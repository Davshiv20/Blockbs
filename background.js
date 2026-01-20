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

// Initialize storage with default values
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['blockedSites', 'enabled'], (result) => {
    if (!result.blockedSites) {
      chrome.storage.sync.set({ blockedSites: DEFAULT_BLOCKED_SITES });
    }
    if (result.enabled === undefined) {
      chrome.storage.sync.set({ enabled: true });
    }
  });
});

// Listen for tab activation (switching)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await checkAndShowBarrier(activeInfo.tabId);
  lastActiveTabId = activeInfo.tabId;
});

// Listen for tab updates (navigation, page load)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only trigger when URL changes or page completes loading
  if (changeInfo.status === 'complete' && tab.url) {
    await checkAndShowBarrier(tabId);
  }
});

// Helper function to check if barrier should be shown and display it
async function checkAndShowBarrier(tabId) {
  try {
    const { enabled, blockedSites } = await chrome.storage.sync.get(['enabled', 'blockedSites']);
    
    console.log('Extension enabled:', enabled);
    console.log('Blocked sites:', blockedSites);
    
    if (!enabled) {
      console.log('Extension is disabled');
      return;
    }

    const tab = await chrome.tabs.get(tabId);
    console.log('Checking tab:', tab.url);
    
    // Check if this tab needs a barrier
    const shouldBlock = shouldShowBarrier(tab.url, blockedSites || DEFAULT_BLOCKED_SITES);
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
      
      console.log('Sending SHOW_BARRIER message to tab', tabId);
      
      // Show the barrier by injecting a message to content script
      try {
        await chrome.tabs.sendMessage(tabId, {
          type: 'SHOW_BARRIER',
          url: tab.url
        });
        console.log('Barrier message sent successfully');
      } catch (error) {
        console.error('Could not inject barrier:', error);
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