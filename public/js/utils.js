// Fetch with timeout utility
async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Request timeout. Please check your connection.");
    }
    throw error;
  }
}

// Retry fetch with exponential backoff
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetchWithTimeout(url, options);
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        // Wait with exponential backoff: 500ms, 1000ms, 2000ms
        await new Promise((resolve) =>
          setTimeout(resolve, 500 * Math.pow(2, i)),
        );
      }
    }
  }

  throw lastError;
}

// Show alert utility
function showAlert(message, type = "info", alertBoxId = "alertBox") {
  const alertBox = document.getElementById(alertBoxId);
  if (!alertBox) return;

  alertBox.textContent = message;
  alertBox.className = `alert alert-${type}`;
  alertBox.classList.remove("hidden");
  setTimeout(() => {
    alertBox.classList.add("hidden");
  }, 5000);
}

// Set loading state utility
function setLoading(
  btnId,
  loading,
  btnTextId = "btnText",
  btnLoaderId = "btnLoader",
) {
  const submitBtn = document.getElementById(btnId);
  const btnText = document.getElementById(btnTextId);
  const btnLoader = document.getElementById(btnLoaderId);

  if (!submitBtn) return;

  submitBtn.disabled = loading;
  if (btnText && btnLoader) {
    if (loading) {
      btnText.classList.add("hidden");
      btnLoader.classList.remove("hidden");
    } else {
      btnText.classList.remove("hidden");
      btnLoader.classList.add("hidden");
    }
  }
}

// Debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle utility
function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
