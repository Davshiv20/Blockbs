// Flag to track if barrier is currently showing
let barrierActive = false;
let modalElement = null;
let timerElement = null;
let timerInterval = null;
let timerEndTime = null;
// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  if (message.type === 'SHOW_BARRIER' && !barrierActive) {
    console.log('Showing barrier for:', message.url);
    showBarrier(message.url);
  } else if (barrierActive) {
    console.log('Barrier already active, skipping');
  }

  if (message.type === 'START_TIMER') {
    console.log('Starting timer for', message.duration / 1000, 'seconds');
    showTimer(message.duration);
  }
});

function showBarrier(url) {
  if (barrierActive) return;
  
  barrierActive = true;
  
  // Wait for document.body to be ready
  let attempts = 0;
  const maxAttempts = 200; // 2 seconds max
  
  const attemptToShow = () => {
    if (!document.body || !document.documentElement) {
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(attemptToShow, 10);
      } else {
        console.error('Failed to show barrier: document.body not available after 2 seconds');
        barrierActive = false;
      }
      return;
    }
    
    console.log('Document body ready, creating barrier');
    
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'mindful-tab-barrier';
    overlay.className = 'mindful-barrier-overlay';
    
    // Get site name from URL
    let siteName = 'this site';
    try {
      const urlObj = new URL(url);
      siteName = urlObj.hostname.replace(/^www\./, '');
    } catch (e) {}
    
    overlay.innerHTML = `
    <div class="mindful-barrier-modal">
      <div class="mindful-barrier-header">
        <h2>Hold on</h2>
      </div>
      <div class="mindful-barrier-content">
        <p class="mindful-barrier-question">
          Why are you opening <strong>${siteName}</strong>?
        </p>
        <textarea 
          id="mindful-barrier-input" 
          class="mindful-barrier-input"
          placeholder="Type your reason here (minimum 50 characters)..."
          rows="4"
          autofocus
        ></textarea>
        <div class="mindful-barrier-counter">
          <span id="mindful-char-count">0</span> / 50 characters
        </div>
        <div class="mindful-barrier-actions">
          <button id="mindful-barrier-submit" class="mindful-barrier-btn" disabled>
            Continue
          </button>
          <button id="mindful-barrier-cancel" class="mindful-barrier-btn mindful-barrier-btn-secondary">
            Go Back
          </button>
        </div>
      </div>
    </div>
  `;
  
    // Double-check body still exists before appending
    if (!document.body) {
      console.error('document.body disappeared before appending');
      barrierActive = false;
      return;
    }
    
    try {
      document.body.appendChild(overlay);
      modalElement = overlay;
      console.log('Barrier modal appended successfully');
    } catch (error) {
      console.error('Error appending barrier modal:', error);
      barrierActive = false;
      return;
    }
    
    // Prevent scrolling on the page behind
    document.body.style.overflow = 'hidden';
    
    // Get elements
    const input = document.getElementById('mindful-barrier-input');
    const submitBtn = document.getElementById('mindful-barrier-submit');
    const cancelBtn = document.getElementById('mindful-barrier-cancel');
    const charCount = document.getElementById('mindful-char-count');
    
    // Focus the input
    setTimeout(() => input.focus(), 100);
    
    // Update character count and enable/disable submit button
    input.addEventListener('input', () => {
      const length = input.value.trim().length;
      charCount.textContent = length;
      
      if (length >= 50) {
        submitBtn.disabled = false;
      } else {
        submitBtn.disabled = true;
      }
    });
    
    // Handle Enter key (with Shift for new line)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !submitBtn.disabled) {
        e.preventDefault();
        submitBtn.click();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelBtn.click();
      }
    });
    
    // Submit button
    submitBtn.addEventListener('click', () => {
      const reason = input.value.trim();
      if (reason.length >= 50) {
        // Log the reason (could be saved to storage for analytics)
        console.log('Tab access reason:', reason);
        
        // Notify background script that barrier was passed
        chrome.runtime.sendMessage({ type: 'BARRIER_APPROVED' });
        
        // Remove barrier
        removeBarrier();
      }
    });
    
    // Cancel button
    cancelBtn.addEventListener('click', () => {
      // Close the current tab or go back
      window.history.back();
      removeBarrier();
    });
  };
  
  attemptToShow();
}

function removeBarrier() {
  if (modalElement) {
    modalElement.remove();
    modalElement = null;
  }
  document.body.style.overflow = '';
  barrierActive = false;
}


function showTimer(duration) {
  // Remove existing timer if any
  removeTimer();
  
  timerEndTime = Date.now() + duration;
  
  // Create timer element
  timerElement = document.createElement('div');
  timerElement.id = 'mindful-timer';
  timerElement.className = 'mindful-timer';
  
  // Wait for body to be ready
  const addTimer = () => {
    if (!document.body) {
      setTimeout(addTimer, 10);
      return;
    }
    
    document.body.appendChild(timerElement);
    updateTimer();
    
    // Update every second
    timerInterval = setInterval(updateTimer, 1000);
  };
  
  addTimer();
}

function updateTimer() {
  if (!timerElement) return;
  
  const remaining = timerEndTime - Date.now();
  
  if (remaining <= 0) {
    removeTimer();
    return;
  }
  
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  
  timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function removeTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  if (timerElement) {
    timerElement.remove();
    timerElement = null;
  }
  
  timerEndTime = null;
}