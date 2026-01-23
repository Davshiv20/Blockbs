// Load settings when popup opens
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  setupEventListeners();
});

function setupEventListeners() {
  // Enable/disable toggle
  document.getElementById('enableToggle').addEventListener('change', (e) => {
    chrome.storage.sync.set({ enabled: e.target.checked });
  });

  // Add site button
  document.getElementById('addSite').addEventListener('click', addSite);
  
  // Add site on Enter key
  document.getElementById('newSite').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addSite();
    }
  });
}

async function loadSettings() {
  const { enabled, blockedSites } = await chrome.storage.sync.get(['enabled', 'blockedSites']);
  
  // Set toggle state
  document.getElementById('enableToggle').checked = enabled !== false;
  
  // Load sites list
  if (blockedSites && blockedSites.length > 0) {
    renderSitesList(blockedSites);
  } else {
    showEmptyState();
  }
}

function renderSitesList(sites) {
  const sitesList = document.getElementById('sitesList');
  sitesList.innerHTML = '';
  
  if (sites.length === 0) {
    showEmptyState();
    return;
  }
  
  sites.forEach(site => {
    const li = document.createElement('li');
    li.className = 'site-item';
    
    li.innerHTML = `
      <span class="site-name">${site}</span>
      <button class="btn-remove" data-site="${site}">×</button>
    `;
    
    li.querySelector('.btn-remove').addEventListener('click', () => removeSite(site));
    
    sitesList.appendChild(li);
  });
}

function showEmptyState() {
  const sitesList = document.getElementById('sitesList');
  sitesList.innerHTML = '<div class="empty-state">No sites added yet. Add sites you want to monitor!</div>';
}

async function addSite() {
  const input = document.getElementById('newSite');
  const site = input.value.trim().toLowerCase();
  
  if (!site) return;
  
  // Clean up the input (remove protocol, www, trailing slashes)
  const cleanSite = site
    .replace(/^(https?:\/\/)?(www\.)?/, '')
    .replace(/\/+$/, '');
  
  if (!cleanSite) return;
  
  const { blockedSites } = await chrome.storage.sync.get(['blockedSites']);
  const currentSites = blockedSites || [];
  
  // Check if site already exists
  if (currentSites.includes(cleanSite)) {
    input.value = '';
    input.placeholder = 'Site already added!';
    setTimeout(() => {
      input.placeholder = 'e.g., twitter.com';
    }, 2000);
    return;
  }
  
  // Request permission for this site
  const origin = `*://*.${cleanSite}/*`;
  
  try {
    const granted = await chrome.permissions.request({
      origins: [origin]
    });
    
    if (!granted) {
      input.placeholder = 'Permission denied for this site';
      setTimeout(() => {
        input.placeholder = 'e.g., twitter.com';
      }, 2000);
      return;
    }
  } catch (error) {
    console.error('Permission request failed:', error);
    input.placeholder = 'Could not request permission';
    setTimeout(() => {
      input.placeholder = 'e.g., twitter.com';
    }, 2000);
    return;
  }
  
  // Add the new site
  const updatedSites = [...currentSites, cleanSite];
  await chrome.storage.sync.set({ blockedSites: updatedSites });
  
  // Clear input and refresh list
  input.value = '';
  renderSitesList(updatedSites);
}

async function removeSite(site) {
  const { blockedSites } = await chrome.storage.sync.get(['blockedSites']);
  const updatedSites = (blockedSites || []).filter(s => s !== site);
  
  await chrome.storage.sync.set({ blockedSites: updatedSites });
  
  // Optionally revoke permission for this site
  const origin = `*://*.${site}/*`;
  try {
    await chrome.permissions.remove({
      origins: [origin]
    });
    console.log('Permission removed for', site);
  } catch (error) {
    console.log('Could not remove permission:', error);
  }
  
  renderSitesList(updatedSites);
}
