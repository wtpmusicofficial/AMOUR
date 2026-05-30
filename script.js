const WEBHOOK_URL = 'https://hook.us2.make.com/nrzkol1mdlabyvtzprotqgvbom56p8f4';
const TOTAL_STEPS = 5;

const form = document.getElementById('signupForm');
const steps = document.querySelectorAll('.step');
const progressFill = document.getElementById('progressFill');
const stepIndicator = document.getElementById('stepIndicator');
const backBtn = document.getElementById('backBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const successScreen = document.getElementById('successScreen');
const phoneInput = document.getElementById('phone');
const phoneHint = document.getElementById('phoneHint');
const genreHint = document.getElementById('genreHint');

let currentStep = 1;

const AUTO_ADVANCE_DELAY = 350;

function updateUI() {
  steps.forEach((step) => {
    step.classList.toggle('active', Number(step.dataset.step) === currentStep);
  });

  progressFill.style.width = `${(currentStep / TOTAL_STEPS) * 100}%`;
  stepIndicator.textContent = `Step ${currentStep} of ${TOTAL_STEPS}`;

  backBtn.hidden = currentStep === 1;
  nextBtn.hidden = currentStep === TOTAL_STEPS;
  submitBtn.hidden = currentStep !== TOTAL_STEPS;
}

function getSelectedRadio(name) {
  return form.querySelector(`input[name="${name}"]:checked`);
}

function validateStep(step) {
  switch (step) {
    case 1:
      if (!getSelectedRadio('raleigh')) {
        shakeOptions(step);
        return false;
      }
      return true;

    case 2:
      if (!getSelectedRadio('age')) {
        shakeOptions(step);
        return false;
      }
      return true;

    case 3:
      if (!getSelectedRadio('gender')) {
        shakeOptions(step);
        return false;
      }
      return true;

    case 4: {
      const checked = form.querySelectorAll('input[name="genres"]:checked');
      if (checked.length === 0) {
        genreHint.textContent = 'Pick at least one genre';
        return false;
      }
      genreHint.textContent = '';
      return true;
    }

    case 5: {
      const nameInput = document.getElementById('fullName');
      const name = nameInput.value.trim();
      if (!name || name.split(/\s+/).length < 2) {
        nameInput.classList.add('invalid');
        phoneHint.textContent = name ? 'Please enter your full name (first & last)' : 'Name is required';
        return false;
      }
      nameInput.classList.remove('invalid');

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
  const cursor = phoneInput.selectionStart;
  const before = phoneInput.value;
  phoneInput.value = formatPhoneDisplay(before);
  phoneInput.classList.remove('invalid');
  phoneHint.textContent = '';
});

function collectFormData() {
  const genres = [...form.querySelectorAll('input[name="genres"]:checked')].map(
    (el) => el.value
  );
  const phoneResult = validatePhone(phoneInput.value);

  return {
    raleigh: getSelectedRadio('raleigh').value,
    age: getSelectedRadio('age').value,
    gender: getSelectedRadio('gender').value,
    genres: genres.join(', '),
    fullName: document.getElementById('fullName').value.trim(),
    phone: phoneResult.formatted,
    phoneDigits: phoneResult.digits,
    submittedAt: new Date().toISOString(),
  };
}

function advanceStep() {
  if (!validateStep(currentStep)) return;
  if (currentStep < TOTAL_STEPS) {
    currentStep++;
    updateUI();
  }
}

nextBtn.addEventListener('click', advanceStep);

form.querySelectorAll('input[type="radio"]').forEach((input) => {
  input.addEventListener('change', () => {
    const step = Number(input.closest('.step')?.dataset.step);
    if (step === currentStep) {
      setTimeout(advanceStep, AUTO_ADVANCE_DELAY);
    }
  });
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
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Submission failed');
    }

    form.hidden = true;
    document.querySelector('.progress-bar').hidden = true;
    stepIndicator.hidden = true;
    successScreen.hidden = false;
  } catch {
    phoneHint.textContent = 'Something went wrong. Please try again.';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit';
  }
});

updateUI();
