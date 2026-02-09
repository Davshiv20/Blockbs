// Flag to track if barrier is currently showing
let barrierActive = false;
let modalElement = null;
let timerElement = null;
let timerInterval = null;
let timerEndTime = null;
let currentSiteName = null;
let currentTimerMinutes = 5;

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
    currentTimerMinutes = message.timerMinutes || 5;
    showTimer(message.duration);
  }

  if (message.type === 'TIME_EXPIRED') {
    console.log('Time expired (from alarm)');
    removeTimer();
    showTimeExpiredAlert();
  }
});

// Helper: create the barrier modal overlay with configurable content
function createBarrierModal(config) {
  const overlay = document.createElement('div');
  overlay.id = 'mindful-tab-barrier';
  overlay.className = 'mindful-barrier-overlay';

  overlay.innerHTML = `
    <div class="mindful-barrier-modal">
      <div class="mindful-barrier-header">
        <h2>${config.header}</h2>
      </div>
      <div class="mindful-barrier-content">
        <p class="mindful-barrier-question">
          ${config.question}
        </p>
        ${config.subtext ? `<p class="mindful-barrier-subtext">${config.subtext}</p>` : ''}
        <textarea
          id="mindful-barrier-input"
          class="mindful-barrier-input"
          placeholder="${config.placeholder}"
          rows="4"
          autofocus
        ></textarea>
        <div class="mindful-barrier-counter">
          <span id="mindful-char-count">0</span> / 30 characters
        </div>
        <div id="mindful-validation-feedback" class="mindful-validation-feedback"></div>
        <div class="mindful-barrier-actions">
          <button id="mindful-barrier-submit" class="mindful-barrier-btn" disabled>
            ${config.submitLabel}
          </button>
          <button id="mindful-barrier-cancel" class="mindful-barrier-btn mindful-barrier-btn-secondary">
            ${config.cancelLabel}
          </button>
        </div>
      </div>
    </div>
  `;

  return overlay;
}

// Debounce helper
function debounce(fn, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}

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

    // Get site name from URL
    let siteName = 'this site';
    try {
      const urlObj = new URL(url);
      siteName = urlObj.hostname.replace(/^www\./, '');
    } catch (e) {}
    currentSiteName = siteName;

    const overlay = createBarrierModal({
      header: 'Hold on',
      question: `Why are you opening <strong>${siteName}</strong>?`,
      placeholder: 'Type your reason here (minimum 30 characters)...',
      submitLabel: 'Continue',
      cancelLabel: 'Go Back',
    });

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
    const feedback = document.getElementById('mindful-validation-feedback');

    // Focus the input
    setTimeout(() => input.focus(), 100);

    // Debounced validation
    const runValidation = debounce(() => {
      const text = input.value;
      const trimmedLength = text.trim().length;
      charCount.textContent = trimmedLength;

      if (trimmedLength === 0) {
        feedback.textContent = '';
        feedback.className = 'mindful-validation-feedback';
        submitBtn.disabled = true;
        return;
      }

      const result = validateReason(text);
      if (result.valid) {
        feedback.textContent = '';
        feedback.className = 'mindful-validation-feedback';
        submitBtn.disabled = false;
      } else {
        feedback.textContent = result.errors[0];
        feedback.className = 'mindful-validation-feedback mindful-validation-fail';
        submitBtn.disabled = true;
      }
    }, 150);

    // Update character count immediately, run validation debounced
    input.addEventListener('input', () => {
      charCount.textContent = input.value.trim().length;
      runValidation();
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

    // Submit button — defense-in-depth: validate again at submit time
    submitBtn.addEventListener('click', () => {
      const reason = input.value;
      const result = validateReason(reason);
      if (result.valid) {
        console.log('Tab access reason:', reason.trim());
        chrome.runtime.sendMessage({
          type: 'BARRIER_APPROVED',
          reason: reason.trim(),
          site: currentSiteName || 'unknown'
        });
        removeBarrier();
      } else {
        feedback.textContent = result.errors[0];
        feedback.className = 'mindful-validation-feedback mindful-validation-fail';
        submitBtn.disabled = true;
      }
    });

    // Cancel button
    cancelBtn.addEventListener('click', () => {
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

function showTimeExpiredAlert() {
  // Remove any existing barrier first
  removeBarrier();
  barrierActive = true;

  const siteName = currentSiteName || 'this site';

  const overlay = createBarrierModal({
    header: "Time's up",
    question: `Your ${currentTimerMinutes} minutes on <strong>${siteName}</strong> are up.`,
    subtext: 'If you need more time, explain why below.',
    placeholder: 'Why do you need more time? (minimum 30 characters)...',
    submitLabel: 'Continue',
    cancelLabel: 'Leave Site',
  });

  if (!document.body) return;

  document.body.appendChild(overlay);
  modalElement = overlay;
  document.body.style.overflow = 'hidden';

  const input = document.getElementById('mindful-barrier-input');
  const submitBtn = document.getElementById('mindful-barrier-submit');
  const cancelBtn = document.getElementById('mindful-barrier-cancel');
  const charCount = document.getElementById('mindful-char-count');
  const feedback = document.getElementById('mindful-validation-feedback');

  setTimeout(() => input.focus(), 100);

  const runValidation = debounce(() => {
    const text = input.value;
    const trimmedLength = text.trim().length;
    charCount.textContent = trimmedLength;

    if (trimmedLength === 0) {
      feedback.textContent = '';
      feedback.className = 'mindful-validation-feedback';
      submitBtn.disabled = true;
      return;
    }

    const result = validateReason(text);
    if (result.valid) {
      feedback.textContent = '';
      feedback.className = 'mindful-validation-feedback';
      submitBtn.disabled = false;
    } else {
      feedback.textContent = result.errors[0];
      feedback.className = 'mindful-validation-feedback mindful-validation-fail';
      submitBtn.disabled = true;
    }
  }, 150);

  input.addEventListener('input', () => {
    charCount.textContent = input.value.trim().length;
    runValidation();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !submitBtn.disabled) {
      e.preventDefault();
      submitBtn.click();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelBtn.click();
    }
  });

  // Submit — re-approve for another session
  submitBtn.addEventListener('click', () => {
    const reason = input.value;
    const result = validateReason(reason);
    if (result.valid) {
      console.log('Extended time reason:', reason.trim());
      chrome.runtime.sendMessage({
        type: 'BARRIER_APPROVED',
        reason: reason.trim(),
        site: currentSiteName || 'unknown'
      });
      removeBarrier();
    } else {
      feedback.textContent = result.errors[0];
      feedback.className = 'mindful-validation-feedback mindful-validation-fail';
      submitBtn.disabled = true;
    }
  });

  // Leave Site — close the tab via background script
  cancelBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'CLOSE_TAB' });
    removeBarrier();
  });
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
    showTimeExpiredAlert();
    return;
  }

  // Add warning class when under 60 seconds
  if (remaining <= 60000) {
    timerElement.classList.add('mindful-timer-warning');
  }

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  timerElement.textContent = `\u23F1 ${minutes}:${seconds.toString().padStart(2, '0')}`;
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
