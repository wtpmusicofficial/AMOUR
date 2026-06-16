const SUBMIT_URL = '/api/signup';
const TOTAL_STEPS = 8;
const AUTO_ADVANCE_DELAY = 350;

const EVENT_CONFIG = {
  title: 'RUN & RAVE - WEST HOLLYWOOD',
  location: 'The Artist Tree, 8625 Santa Monica Blvd, West Hollywood, CA 90069',
  date: '20260628',
  startTime: '120000',
  endTime: '143000',
  timezone: 'America/Los_Angeles',
};

const SHARE_MESSAGE =
  "I just signed up for a daytime run and rave in West Hollywood on June 28th. Here's the link!";

function trackCompleteRegistration() {
  if (typeof fbq === 'function') {
    fbq('track', 'CompleteRegistration');
  }
}

const form = document.getElementById('signupForm');
const page = document.querySelector('.page');
const header = document.querySelector('.header');
const steps = document.querySelectorAll('.step');
const progressFill = document.getElementById('progressFill');
const stepIndicator = document.getElementById('stepIndicator');
const backBtn = document.getElementById('backBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const navButtons = document.querySelector('.nav-buttons');
const successScreen = document.getElementById('successScreen');
const phoneInput = document.getElementById('phone');
const phoneHint = document.getElementById('phoneHint');
const nameHint = document.getElementById('nameHint');
const instagramInput = document.getElementById('instagram');
const instagramHint = document.getElementById('instagramHint');
const calendarBtn = document.getElementById('calendarBtn');
const shareBtn = document.getElementById('shareBtn');

let currentStep = 1;

function updateNavButtons(step) {
  backBtn.hidden = step === 1;
  nextBtn.hidden = step !== 7;
  submitBtn.hidden = step !== TOTAL_STEPS;
  navButtons.hidden = backBtn.hidden && nextBtn.hidden && submitBtn.hidden;
}

function syncStepBranching(step) {
  const location = getSelectedRadio('location')?.value;
  const age = getSelectedRadio('age')?.value;
  const houseMusic = getSelectedRadio('houseMusic')?.value;
  const dancing = getSelectedRadio('dancing')?.value;

  document.getElementById('step1Notice').hidden = step !== 1 || location !== 'No';
  document.getElementById('step2Notice').hidden = step !== 2 || age !== 'Under 21';
  document.getElementById('step4Notice').hidden = step !== 4 || houseMusic !== 'No';
  document.getElementById('step5Notice').hidden = step !== 5 || dancing !== 'No';

  updateNavButtons(step);
}

function getSelectedRadio(name) {
  return form.querySelector(`input[name="${name}"]:checked`);
}

function updateUI() {
  steps.forEach((step) => {
    step.classList.toggle('active', Number(step.dataset.step) === currentStep);
  });

  progressFill.style.width = `${(currentStep / TOTAL_STEPS) * 100}%`;
  stepIndicator.textContent = `Step ${currentStep} of ${TOTAL_STEPS}`;

  syncStepBranching(currentStep);
}

function validateStep(step) {
  switch (step) {
    case 1:
      if (!getSelectedRadio('location')) {
        shakeOptions(step);
        return false;
      }
      return true;

    case 2:
      if (!getSelectedRadio('age')) {
        shakeOptions(step);
        return false;
      }
      if (getSelectedRadio('age').value === 'Under 21') {
        return false;
      }
      return true;

    case 3:
      if (!getSelectedRadio('gender')) {
        shakeOptions(step);
        return false;
      }
      return true;

    case 4:
      if (!getSelectedRadio('houseMusic')) {
        shakeOptions(step);
        return false;
      }
      return true;

    case 5:
      if (!getSelectedRadio('dancing')) {
        shakeOptions(step);
        return false;
      }
      return true;

    case 6:
      if (!getSelectedRadio('interests')) {
        shakeOptions(step);
        return false;
      }
      return true;

    case 7: {
      const handle = normalizeInstagram(instagramInput.value);
      if (!handle) {
        instagramInput.classList.add('invalid');
        instagramHint.textContent = 'Instagram handle is required';
        return false;
      }
      instagramInput.classList.remove('invalid');
      instagramHint.textContent = '';
      return true;
    }

    case 8: {
      const firstNameInput = document.getElementById('firstName');
      const lastNameInput = document.getElementById('lastName');
      const firstName = firstNameInput.value.trim();
      const lastName = lastNameInput.value.trim();

      firstNameInput.classList.remove('invalid');
      lastNameInput.classList.remove('invalid');
      nameHint.textContent = '';

      if (!firstName) {
        firstNameInput.classList.add('invalid');
        nameHint.textContent = 'First name is required';
        return false;
      }

      if (!lastName) {
        lastNameInput.classList.add('invalid');
        nameHint.textContent = 'Last name is required';
        return false;
      }

      const phoneResult = validatePhone(phoneInput.value);
      if (!phoneResult.valid) {
        phoneInput.classList.add('invalid');
        phoneHint.textContent = phoneResult.message;
        return false;
      }
      phoneInput.classList.remove('invalid');
      phoneHint.textContent = '';
      return true;
    }

    default:
      return true;
  }
}

function shakeOptions(step) {
  const fieldset = form.querySelector(`.step[data-step="${step}"] .options`);
  if (fieldset) {
    fieldset.style.animation = 'none';
    fieldset.offsetHeight;
    fieldset.style.animation = 'shake 0.35s ease';
  }
}

function normalizeInstagram(raw) {
  return raw.trim().replace(/^@+/, '');
}

function validatePhone(raw) {
  const digits = raw.replace(/\D/g, '');

  if (digits.length === 0) {
    return { valid: false, message: 'Phone number is required' };
  }

  if (digits.startsWith('1') && digits.length === 11) {
    return {
      valid: false,
      message: 'Enter your 10-digit number without the leading 1',
    };
  }

  if (digits.startsWith('1') && digits.length !== 11) {
    return {
      valid: false,
      message: 'Phone number should not start with 1',
    };
  }

  if (digits.length !== 10) {
    return {
      valid: false,
      message: 'Enter a valid 10-digit US phone number',
    };
  }

  const areaCode = digits.slice(0, 3);
  const exchange = digits.slice(3, 6);

  if (areaCode[0] === '0' || areaCode[0] === '1') {
    return { valid: false, message: 'Invalid area code' };
  }

  if (exchange[0] === '0' || exchange[0] === '1') {
    return { valid: false, message: 'Invalid phone number format' };
  }

  return {
    valid: true,
    formatted: `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`,
    digits,
  };
}

function formatPhoneDisplay(value) {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

phoneInput.addEventListener('input', () => {
  phoneInput.value = formatPhoneDisplay(phoneInput.value);
  phoneInput.classList.remove('invalid');
  phoneHint.textContent = '';
});

document.getElementById('firstName').addEventListener('input', () => {
  document.getElementById('firstName').classList.remove('invalid');
  nameHint.textContent = '';
});

document.getElementById('lastName').addEventListener('input', () => {
  document.getElementById('lastName').classList.remove('invalid');
  nameHint.textContent = '';
});

instagramInput.addEventListener('input', () => {
  instagramInput.classList.remove('invalid');
  instagramHint.textContent = '';
});

function collectFormData() {
  const interests = getSelectedRadio('interests').value;
  const phoneResult = validatePhone(phoneInput.value);
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();

  return {
    location: getSelectedRadio('location').value,
    age: getSelectedRadio('age').value,
    gender: getSelectedRadio('gender').value,
    houseMusic: getSelectedRadio('houseMusic').value,
    dancing: getSelectedRadio('dancing').value,
    interests,
    instagram: normalizeInstagram(instagramInput.value),
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    phone: phoneResult.formatted,
  };
}

function advanceStep() {
  if (!validateStep(currentStep)) return;
  if (currentStep < TOTAL_STEPS) {
    currentStep++;
    updateUI();
  }
}

function handleRadioBranch(step, value) {
  switch (step) {
    case 1:
    case 4:
    case 5:
      if (value === 'No') {
        updateUI();
        return;
      }
      setTimeout(advanceStep, AUTO_ADVANCE_DELAY);
      break;

    case 2:
      if (value === 'Under 21') {
        updateUI();
        return;
      }
      setTimeout(advanceStep, AUTO_ADVANCE_DELAY);
      break;

    case 3:
    case 6:
      setTimeout(advanceStep, AUTO_ADVANCE_DELAY);
      break;

    default:
      break;
  }
}

nextBtn.addEventListener('click', advanceStep);

form.querySelectorAll('input[type="radio"]').forEach((input) => {
  input.addEventListener('change', () => {
    const step = Number(input.closest('.step')?.dataset.step);
    if (step === currentStep) {
      handleRadioBranch(step, input.value);
    }
  });
});

document.querySelectorAll('.step-continue').forEach((btn) => {
  btn.addEventListener('click', advanceStep);
});

backBtn.addEventListener('click', () => {
  currentStep--;
  updateUI();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateStep(TOTAL_STEPS)) return;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending…';

  const data = collectFormData();

  try {
    const response = await fetch(SUBMIT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        result.detail ||
        (result.missing
          ? `Server missing config: ${result.missing.join(', ')}`
          : result.error) ||
        'Submission failed';
      throw new Error(message);
    }

    trackCompleteRegistration();

    form.hidden = true;
    document.querySelector('.progress-bar').hidden = true;
    stepIndicator.hidden = true;
    header.hidden = true;
    page.classList.add('page--success');
    successScreen.hidden = false;
  } catch (err) {
    phoneHint.textContent = err.message || 'Something went wrong. Please try again.';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit';
  }
});

function buildCalendarIcs() {
  const { title, location, date, startTime, endTime, timezone } = EVENT_CONFIG;
  const uid = `${date}-${startTime}@amour`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AMOUR//Event Sign Up//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatIcsTimestamp(new Date())}`,
    `DTSTART;TZID=${timezone}:${date}T${startTime}`,
    `DTEND;TZID=${timezone}:${date}T${endTime}`,
    `SUMMARY:${title}`,
    `LOCATION:${location}`,
    'DESCRIPTION:RUN & RAVE — West Hollywood. Details coming via text.',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.join('\r\n');
}

function formatIcsTimestamp(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function downloadCalendarEvent() {
  const ics = buildCalendarIcs();
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'amour-event.ics';
  link.click();
  URL.revokeObjectURL(url);
}

async function shareSignupLink() {
  const url = window.location.href.split('#')[0];
  const text = `${SHARE_MESSAGE} ${url}`;

  if (navigator.share) {
    try {
      await navigator.share({ title: 'AMOUR Event', text: SHARE_MESSAGE, url });
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    shareBtn.textContent = 'Link copied!';
    setTimeout(() => {
      shareBtn.textContent = 'Share with friends';
    }, 2000);
  } catch {
    window.prompt('Copy this message and send it to your friends:', text);
  }
}

calendarBtn.addEventListener('click', downloadCalendarEvent);
shareBtn.addEventListener('click', shareSignupLink);

updateUI();
