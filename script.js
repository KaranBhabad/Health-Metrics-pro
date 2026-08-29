/**
 * ================================================================
 *  HealthMetrics Pro — script.js
 *  BMI + Body Fat Calculator with Personalized Health Report
 *  Author: HealthMetrics Pro
 * ================================================================
 */

'use strict';

// ─── DOM REFERENCES ──────────────────────────────────────────────
const bmiForm         = document.getElementById('bmiForm');
const fullNameInput   = document.getElementById('fullName');
const ageInput        = document.getElementById('age');
const genderInput     = document.getElementById('gender');        // hidden
const heightInput     = document.getElementById('height');
const weightInput     = document.getElementById('weight');

const genderMaleBtn   = document.getElementById('genderMale');
const genderFemaleBtn = document.getElementById('genderFemale');

const resultsSection  = document.getElementById('resultsSection');
const calcSection     = document.getElementById('calculator-section');

// Gauge needle
const gaugeNeedle     = document.getElementById('gaugeNeedle');

// Score display
const bmiValueDisplay  = document.getElementById('bmiValueDisplay');
const bmiCategoryBadge = document.getElementById('bmiCategoryBadge');

// Stat cards
const statBMIValue       = document.getElementById('statBMIValue');
const statBodyFatValue   = document.getElementById('statBodyFatValue');
const statIdealWeightVal = document.getElementById('statIdealWeightValue');
const statBMRValue       = document.getElementById('statBMRValue');

// Marker on scale bar
const bmiMarker = document.getElementById('bmiMarker');

// Report fields
const rName        = document.getElementById('rName');
const rAge         = document.getElementById('rAge');
const rGender      = document.getElementById('rGender');
const rHeight      = document.getElementById('rHeight');
const rWeight      = document.getElementById('rWeight');
const rBMI         = document.getElementById('rBMI');
const rCategory    = document.getElementById('rCategory');
const rBodyFat     = document.getElementById('rBodyFat');
const rFatMass     = document.getElementById('rFatMass');
const rLeanMass    = document.getElementById('rLeanMass');
const rBMR         = document.getElementById('rBMR');
const rTDEE        = document.getElementById('rTDEE');
const rIdealRange  = document.getElementById('rIdealRange');
const rWeightDiff  = document.getElementById('rWeightDiff');
const rHealthStatus= document.getElementById('rHealthStatus');
const recText      = document.getElementById('recommendationText');

// Buttons
const resetBtn     = document.getElementById('resetBtn');
const recalcBtn    = document.getElementById('recalcBtn');
const printBtn     = document.getElementById('printBtn');


// ─── GENDER TOGGLE ───────────────────────────────────────────────
/**
 * Handle gender button toggle behaviour.
 * Updates the hidden input value and aria-pressed states.
 */
[genderMaleBtn, genderFemaleBtn].forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove active from both
    genderMaleBtn.classList.remove('active');
    genderFemaleBtn.classList.remove('active');
    genderMaleBtn.setAttribute('aria-pressed', 'false');
    genderFemaleBtn.setAttribute('aria-pressed', 'false');

    // Activate clicked button
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    genderInput.value = btn.dataset.gender;
  });
});


// ─── VALIDATION HELPERS ──────────────────────────────────────────
/**
 * Show an error message beneath an input field.
 * @param {HTMLInputElement} input  – The input element to mark as errored.
 * @param {string}           msg   – Error message to display.
 */
function showError(input, msg) {
  const errorEl = document.getElementById(input.id + 'Error');
  if (errorEl) errorEl.textContent = msg;
  input.classList.add('error-input');
}

/**
 * Clear the error state from an input field.
 * @param {HTMLInputElement} input
 */
function clearError(input) {
  const errorEl = document.getElementById(input.id + 'Error');
  if (errorEl) errorEl.textContent = '';
  input.classList.remove('error-input');
}

/**
 * Validate all form fields and return true if valid.
 * @returns {boolean}
 */
function validateForm() {
  let isValid = true;

  // Full Name
  const name = fullNameInput.value.trim();
  if (!name) {
    showError(fullNameInput, 'Full name is required.');
    isValid = false;
  } else if (name.length < 2) {
    showError(fullNameInput, 'Name must be at least 2 characters.');
    isValid = false;
  } else {
    clearError(fullNameInput);
  }

  // Age
  const age = parseFloat(ageInput.value);
  if (!ageInput.value.trim()) {
    showError(ageInput, 'Age is required.');
    isValid = false;
  } else if (isNaN(age) || age < 1 || age > 120 || !Number.isInteger(age)) {
    showError(ageInput, 'Please enter a valid age between 1 and 120.');
    isValid = false;
  } else {
    clearError(ageInput);
  }

  // Height
  const height = parseFloat(heightInput.value);
  if (!heightInput.value.trim()) {
    showError(heightInput, 'Height is required.');
    isValid = false;
  } else if (isNaN(height) || height < 50 || height > 300) {
    showError(heightInput, 'Please enter a valid height (50–300 cm).');
    isValid = false;
  } else {
    clearError(heightInput);
  }

  // Weight
  const weight = parseFloat(weightInput.value);
  if (!weightInput.value.trim()) {
    showError(weightInput, 'Weight is required.');
    isValid = false;
  } else if (isNaN(weight) || weight < 1 || weight > 500) {
    showError(weightInput, 'Please enter a valid weight (1–500 kg).');
    isValid = false;
  } else {
    clearError(weightInput);
  }

  return isValid;
}

// Clear error on input change for real-time feedback
[fullNameInput, ageInput, heightInput, weightInput].forEach(input => {
  input.addEventListener('input', () => clearError(input));
});


// ─── BMI CALCULATION ─────────────────────────────────────────────
/**
 * Calculate BMI.
 * Formula: BMI = weight(kg) / (height(m))²
 * @param {number} weightKg
 * @param {number} heightCm
 * @returns {number}
 */
function calcBMI(weightKg, heightCm) {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/**
 * Determine BMI category and category key.
 * @param {number} bmi
 * @returns {{ label: string, key: string }}
 */
function getBMICategory(bmi) {
  if (bmi < 18.5) return { label: 'Underweight', key: 'underweight' };
  if (bmi < 25)   return { label: 'Normal Weight', key: 'normal' };
  if (bmi < 30)   return { label: 'Overweight', key: 'overweight' };
  return             { label: 'Obese', key: 'obese' };
}


// ─── BODY FAT CALCULATION (Deurenberg Formula) ───────────────────
/**
 * Estimate body fat percentage using the Deurenberg et al. (1991) formula.
 * BF% = (1.20 × BMI) + (0.23 × Age) − (10.8 × genderFactor) − 5.4
 * genderFactor: 1 = Male, 0 = Female
 * @param {number} bmi
 * @param {number} age
 * @param {string} gender  – 'Male' | 'Female'
 * @returns {number}
 */
function calcBodyFat(bmi, age, gender) {
  const genderFactor = gender === 'Male' ? 1 : 0;
  const bf = (1.20 * bmi) + (0.23 * age) - (10.8 * genderFactor) - 5.4;
  return Math.max(0, bf); // clamp to 0 minimum
}

/**
 * Describe body fat category for the report.
 * @param {number} bf    – Body fat percentage
 * @param {string} gender
 * @returns {string}
 */
function getBodyFatCategory(bf, gender) {
  if (gender === 'Male') {
    if (bf < 6)  return 'Essential Fat';
    if (bf < 14) return 'Athletic';
    if (bf < 18) return 'Fitness';
    if (bf < 25) return 'Average';
    return 'Obese';
  } else {
    if (bf < 10) return 'Essential Fat';
    if (bf < 21) return 'Athletic';
    if (bf < 25) return 'Fitness';
    if (bf < 32) return 'Average';
    return 'Obese';
  }
}


// ─── BMR (Mifflin–St Jeor) ───────────────────────────────────────
/**
 * Calculate Basal Metabolic Rate using the Mifflin–St Jeor equation.
 * Male:   BMR = (10 × weight) + (6.25 × height) − (5 × age) + 5
 * Female: BMR = (10 × weight) + (6.25 × height) − (5 × age) − 161
 * @param {number} weightKg
 * @param {number} heightCm
 * @param {number} age
 * @param {string} gender
 * @returns {number}
 */
function calcBMR(weightKg, heightCm, age, gender) {
  const base = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  return gender === 'Male' ? base + 5 : base - 161;
}


// ─── IDEAL WEIGHT (Devine Formula) ───────────────────────────────
/**
 * Calculate ideal body weight range.
 * Devine formula (approximate):
 *   Male:   52 kg + 1.9 kg per inch above 5 feet
 *   Female: 49 kg + 1.7 kg per inch above 5 feet
 * Converted for centimetres.
 * @param {number} heightCm
 * @param {string} gender
 * @returns {{ low: number, high: number }}
 */
function calcIdealWeightRange(heightCm) {
  // Use the BMI 18.5–24.9 range for the given height
  const heightM = heightCm / 100;
  const low  = 18.5 * (heightM * heightM);
  const high = 24.9 * (heightM * heightM);
  return { low, high };
}


// ─── RECOMMENDATIONS ─────────────────────────────────────────────
/**
 * Return a personalised recommendation based on BMI category.
 * @param {string} key   – Category key
 * @returns {string}
 */
function getRecommendation(key) {
  const recs = {
    underweight:
      'Your BMI indicates you are underweight. Consider increasing your daily calorie intake with nutrient-dense foods such as lean proteins, whole grains, healthy fats, and dairy. Incorporate strength training exercises to build muscle mass. Regular check-ups with a dietitian can help you reach a healthy weight safely.',
    normal:
      'Great work! Your BMI is in the healthy range. Keep up your balanced diet rich in fruits, vegetables, lean proteins, and whole grains. Aim for at least 150 minutes of moderate aerobic exercise per week combined with strength training twice a week to maintain your fitness.',
    overweight:
      'Your BMI suggests you are overweight. Consider adopting a moderate calorie deficit (approximately 300–500 kcal/day below TDEE), increasing physical activity with cardio and strength training, and reducing processed food and added sugar intake. Small, sustainable lifestyle changes yield the best long-term results.',
    obese:
      'Your BMI indicates obesity. It is strongly recommended to consult a qualified healthcare professional or registered dietitian for a personalised plan. Begin with low-impact activities (walking, swimming), adopt a whole-food diet, monitor calorie intake, and address any underlying health conditions. Gradual, consistent progress is key.',
  };
  return recs[key] || '';
}

/**
 * Health status string for report.
 * @param {string} key
 * @returns {string}
 */
function getHealthStatus(key) {
  const statuses = {
    underweight: '⚠️ Below Healthy Range',
    normal:      '✅ Healthy',
    overweight:  '⚠️ Above Healthy Range',
    obese:       '🔴 High Health Risk',
  };
  return statuses[key] || '--';
}


// ─── GAUGE NEEDLE ANIMATION ──────────────────────────────────────
/**
 * Rotate the SVG gauge needle based on the BMI value.
 * BMI range mapped to −90° (left = 10) → +90° (right = 40+)
 * @param {number} bmi
 */
function animateGauge(bmi) {
  // Clamp BMI between 10 and 40 for display purposes
  const clampedBMI = Math.min(Math.max(bmi, 10), 40);
  // Map 10–40 → −90° to +90° (total 180° sweep)
  const angle = ((clampedBMI - 10) / 30) * 180 - 90;
  gaugeNeedle.style.transform = `rotate(${angle}deg)`;
}


// ─── BMI MARKER ON SCALE BAR ─────────────────────────────────────
/**
 * Move the arrow marker on the scale bar to the correct position.
 * Scale: 0–100% maps to BMI 10–40.
 * @param {number} bmi
 */
function moveBMIMarker(bmi) {
  // Define scale boundaries in %
  // Under: 0–30% | Normal: 30–58% | Over: 58–80% | Obese: 80–100%
  let pct;
  if (bmi < 18.5) {
    // Underweight zone: 0–30%
    pct = ((bmi - 10) / (18.5 - 10)) * 30;
  } else if (bmi < 25) {
    // Normal zone: 30–57%
    pct = 30 + ((bmi - 18.5) / (25 - 18.5)) * 27;
  } else if (bmi < 30) {
    // Overweight zone: 57–79%
    pct = 57 + ((bmi - 25) / (30 - 25)) * 22;
  } else {
    // Obese zone: 79–100%
    pct = 79 + Math.min(((bmi - 30) / 15) * 21, 21);
  }
  bmiMarker.style.left = pct.toFixed(1) + '%';
}


// ─── POPULATE REPORT ─────────────────────────────────────────────
/**
 * Fill all report fields with computed data.
 */
function populateReport(data) {
  const {
    name, age, gender, heightCm, weightKg,
    bmi, category, bodyFat, fatMass, leanMass,
    bmr, tdee, idealLow, idealHigh, weightDiff,
    recommendation
  } = data;

  // Personal
  rName.textContent   = name;
  rAge.textContent    = `${age} years`;
  rGender.textContent = gender;
  rHeight.textContent = `${heightCm} cm`;
  rWeight.textContent = `${weightKg} kg`;

  // Composition
  rBMI.textContent      = `${bmi.toFixed(2)} kg/m²`;
  rCategory.textContent = category.label;
  rBodyFat.textContent  = `${bodyFat.toFixed(1)}% (${getBodyFatCategory(bodyFat, gender)})`;
  rFatMass.textContent  = `${fatMass.toFixed(1)} kg`;
  rLeanMass.textContent = `${leanMass.toFixed(1)} kg`;

  // Metabolic
  rBMR.textContent      = `${Math.round(bmr)} kcal/day`;
  rTDEE.textContent     = `${Math.round(tdee)} kcal/day`;
  rIdealRange.textContent = `${idealLow.toFixed(1)} – ${idealHigh.toFixed(1)} kg`;
  rWeightDiff.textContent = weightDiff;
  rHealthStatus.textContent = getHealthStatus(category.key);

  // Recommendation
  recText.textContent   = recommendation;
}


// ─── FORM SUBMIT — MAIN CALCULATION ─────────────────────────────
bmiForm.addEventListener('submit', (e) => {
  e.preventDefault();

  // Validate first
  if (!validateForm()) return;

  // Read values
  const name     = fullNameInput.value.trim();
  const age      = parseInt(ageInput.value, 10);
  const gender   = genderInput.value;          // 'Male' | 'Female'
  const heightCm = parseFloat(heightInput.value);
  const weightKg = parseFloat(weightInput.value);

  // ── Calculations ──
  const bmi      = calcBMI(weightKg, heightCm);
  const category = getBMICategory(bmi);
  const bodyFat  = calcBodyFat(bmi, age, gender);
  const fatMass  = (bodyFat / 100) * weightKg;
  const leanMass = weightKg - fatMass;
  const bmr      = calcBMR(weightKg, heightCm, age, gender);
  const tdee     = bmr * 1.2;   // Sedentary activity multiplier
  const { low: idealLow, high: idealHigh } = calcIdealWeightRange(heightCm);

  // Weight difference from ideal range
  let weightDiff;
  if (weightKg < idealLow) {
    weightDiff = `Gain ${(idealLow - weightKg).toFixed(1)} kg`;
  } else if (weightKg > idealHigh) {
    weightDiff = `Lose ${(weightKg - idealHigh).toFixed(1)} kg`;
  } else {
    weightDiff = 'You are within the ideal range ✅';
  }

  const recommendation = getRecommendation(category.key);

  // ── Update UI ──
  // Score display
  bmiValueDisplay.textContent  = bmi.toFixed(2);
  bmiCategoryBadge.textContent = category.label;

  // Stat cards
  statBMIValue.textContent       = bmi.toFixed(2);
  statBodyFatValue.textContent   = bodyFat.toFixed(1) + '%';
  statIdealWeightVal.textContent = idealLow.toFixed(0) + '–' + idealHigh.toFixed(0) + ' kg';
  statBMRValue.textContent       = Math.round(bmr);

  // Category colour theming (via data attribute on results section)
  resultsSection.dataset.cat = category.key;

  // Animate gauge needle
  animateGauge(bmi);

  // Move scale bar marker
  moveBMIMarker(bmi);

  // Populate report fields
  populateReport({
    name, age, gender, heightCm, weightKg,
    bmi, category, bodyFat, fatMass, leanMass,
    bmr, tdee, idealLow, idealHigh, weightDiff,
    recommendation,
  });

  // Show results, hide calculator (on small screens, scroll into view)
  resultsSection.classList.remove('hidden');

  // Smooth scroll to results
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
});


// ─── RESET BUTTON ────────────────────────────────────────────────
/**
 * Reset the form and hide the results section.
 */
function resetAll() {
  bmiForm.reset();

  // Reset gender toggle
  genderMaleBtn.classList.add('active');
  genderFemaleBtn.classList.remove('active');
  genderMaleBtn.setAttribute('aria-pressed', 'true');
  genderFemaleBtn.setAttribute('aria-pressed', 'false');
  genderInput.value = 'Male';

  // Clear all error states
  [fullNameInput, ageInput, heightInput, weightInput].forEach(clearError);

  // Hide results
  resultsSection.classList.add('hidden');

  // Reset gauge needle to 0°
  gaugeNeedle.style.transform = 'rotate(-90deg)';

  // Scroll back to top
  calcSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

resetBtn.addEventListener('click', resetAll);
recalcBtn.addEventListener('click', () => {
  resultsSection.classList.add('hidden');
  calcSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
});


// ─── PRINT REPORT ────────────────────────────────────────────────
/**
 * Trigger the browser's native print dialog.
 * Print styles in style.css handle visual formatting.
 */
printBtn.addEventListener('click', () => {
  window.print();
});


// ─── INITIAL GAUGE POSITION ──────────────────────────────────────
// Start needle pointing fully left (underweight side)
gaugeNeedle.style.transform = 'rotate(-90deg)';
