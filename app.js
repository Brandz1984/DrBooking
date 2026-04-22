const form = document.getElementById('bookingForm');
const dateInput = document.getElementById('dateInput');
const timeSelect = document.getElementById('timeSelect');
const statusEl = document.getElementById('status');
const submitBtn = document.getElementById('submitBtn');
const config = window.BOOKING_CONFIG || {};

const today = new Date();
const isoToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
dateInput.min = isoToday;

function setStatus(message, type = '') {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
}

async function loadSlots(date) {
  if (!config.scriptUrl || config.scriptUrl.includes('PASTE_YOUR_APPS_SCRIPT')) {
    setStatus('Add your Apps Script web app URL in index.html first.', 'error');
    return;
  }

  timeSelect.innerHTML = '<option value="">Loading available times...</option>';
  setStatus('Checking available times...');

  try {
    const response = await fetch(`${config.scriptUrl}?action=slots&date=${encodeURIComponent(date)}`);
    const data = await response.json();

    if (!data.success) throw new Error(data.message || 'Could not load slots.');

    timeSelect.innerHTML = '<option value="">Select a time</option>';

    if (!data.slots.length) {
      timeSelect.innerHTML = '<option value="">No available times</option>';
      setStatus('No available times for that date.', 'error');
      return;
    }

    data.slots.forEach(slot => {
      const option = document.createElement('option');
      option.value = slot.value;
      option.textContent = slot.label;
      timeSelect.appendChild(option);
    });

    setStatus('Available times loaded.', 'ok');
  } catch (error) {
    timeSelect.innerHTML = '<option value="">Could not load times</option>';
    setStatus(error.message || 'Could not load times.', 'error');
  }
}

dateInput.addEventListener('change', (e) => {
  if (e.target.value) loadSlots(e.target.value);
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!config.scriptUrl || config.scriptUrl.includes('PASTE_YOUR_APPS_SCRIPT')) {
    setStatus('Add your Apps Script web app URL in index.html first.', 'error');
    return;
  }

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  submitBtn.disabled = true;
  setStatus('Submitting booking...');

  try {
    const response = await fetch(config.scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Booking failed.');

    setStatus(`Booked successfully for ${data.slotLabel}. A notification was sent.`, 'ok');
    form.reset();
    timeSelect.innerHTML = '<option value="">Choose a date first</option>';
  } catch (error) {
    setStatus(error.message || 'Booking failed.', 'error');
  } finally {
    submitBtn.disabled = false;
  }
});
