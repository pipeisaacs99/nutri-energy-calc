
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

const activityOptions = [
  {
    value: '1.2',
    label: 'Sedentario',
    factor: '1.20',
    range: '1.20',
    description: 'Trabajo principalmente sentado y poco o nada de ejercicio estructurado.'
  },
  {
    value: '1.35',
    label: 'Ligero',
    factor: '1.35',
    range: '1.30–1.49',
    description: 'Movimiento cotidiano y ejercicio ligero entre 1 y 3 días por semana.'
  },
  {
    value: '1.55',
    label: 'Moderado',
    factor: '1.55',
    range: '1.50–1.59',
    description: 'Entrenamiento o actividad moderada alrededor de 3 a 5 días por semana.'
  },
  {
    value: '1.70',
    label: 'Activo · 5 días/semana',
    factor: '1.70',
    range: '1.60–1.79',
    description: 'Entrenamiento frecuente, normalmente 5 días por semana. Puedes moverte dentro del rango según intensidad.'
  },
  {
    value: '1.90',
    label: 'Muy activo',
    factor: '1.90',
    range: '1.80–1.99',
    description: 'Ejercicio intenso 6 a 7 días por semana o trabajo físicamente exigente.'
  },
  {
    value: '2.10',
    label: 'Extra activo',
    factor: '2.10',
    range: '2.00–2.29',
    description: 'Entrenamiento intenso casi diario combinado con bastante movimiento durante el día.'
  },
  {
    value: '2.40',
    label: 'Extremo',
    factor: '2.40',
    range: '2.30–2.40',
    description: 'Nivel excepcional de entrenamiento o trabajo físico sostenido. Úsalo con criterio profesional.'
  }
];

const nutritionGoals = [
  { value: 'maintenance', label: 'Mantenimiento', adjustment: 0, protein: 1.6, fat: 0.30, description: 'Mantener el peso y sostener tu actividad habitual.' },
  { value: 'fat-loss', label: 'Pérdida de grasa', adjustment: -0.20, protein: 2.0, fat: 0.30, description: 'Déficit moderado para reducir grasa preservando masa magra.' },
  { value: 'muscle-gain', label: 'Ganancia muscular', adjustment: 0.10, protein: 1.8, fat: 0.25, description: 'Superávit moderado para acompañar entrenamiento de fuerza.' }
];

const state = {
  lastCalculation: null,
  weightMode: 'actual',
  nutritionGoal: 'maintenance',
  macroPercentages: null
};

const app = document.querySelector('#app');

app.innerHTML = `
  <header class="topbar">
    <a class="brand" href="#top" aria-label="Energía Calc, inicio">
      <span class="brand-mascot-wrap"><img class="brand-mascot" src="./icons/logo.svg" alt="Nutria atleta de Energía Calc" /></span>
      <span>Energía <strong>Calc</strong></span>
    </a>
    <div class="topbar-note"><span class="live-dot"></span> Estimación orientativa · adultos</div>
  </header>

  <main id="top" class="page-shell">
    <section class="hero" aria-labelledby="page-title">
      <div class="eyebrow"><span class="eyebrow-line"></span> Perfil metabólico</div>
      <h1 id="page-title">Convierte tus datos<br /><em>en energía útil.</em></h1>
      <p class="hero-copy">Calcula tu IMC, peso ajustado, metabolismo basal y gasto energético diario con una ruta clara y fórmulas visibles.</p>
      <div class="hero-stats" aria-label="Datos que calcula la herramienta">
        <span><b>01</b> IMC</span><span><b>02</b> Peso ajustado</span><span><b>03</b> Energía diaria</span>
      </div>
    </section>

    <section class="calculator-layout" aria-label="Calculadora de gasto energético">
      <form id="energy-form" class="input-panel" novalidate>
        <div class="panel-heading">
          <div>
            <p class="section-kicker">Tu punto de partida</p>
            <h2>Datos personales</h2>
          </div>
          <span class="step-badge">01 / 02</span>
        </div>

        <div class="field-group">
          <label class="field-label" for="sex">Sexo biológico para la fórmula <span class="required">*</span></label>
          <div class="segmented-control" role="group" aria-label="Sexo biológico">
            <label class="segment-option"><input type="radio" name="sex" value="female" checked /><span class="segment-icon">♀</span> Mujer</label>
            <label class="segment-option"><input type="radio" name="sex" value="male" /><span class="segment-icon">♂</span> Hombre</label>
          </div>
        </div>

        <div class="form-grid three-cols">
          <div class="field-group">
            <label class="field-label" for="age">Edad <span class="required">*</span></label>
            <div class="input-wrap"><input id="age" name="age" type="number" min="18" max="120" step="1" placeholder="28" required /><span>años</span></div>
          </div>
          <div class="field-group">
            <label class="field-label" for="height">Altura <span class="required">*</span></label>
            <div class="input-wrap"><input id="height" name="height" type="number" min="100" max="250" step="0.1" placeholder="170" required /><span>cm</span></div>
          </div>
          <div class="field-group">
            <label class="field-label" for="weight">Peso <span class="required">*</span></label>
            <div class="input-wrap"><input id="weight" name="weight" type="number" min="20" max="400" step="0.1" placeholder="70" required /><span>kg</span></div>
          </div>
        </div>

        <div class="rule"></div>

        <div class="panel-heading activity-heading">
          <div>
            <p class="section-kicker">Movimiento diario</p>
            <h2>Nivel de actividad</h2>
          </div>
          <span class="activity-range">1.20 — 2.40</span>
        </div>
        <div class="field-group">
          <label class="field-label" for="activity">Elige la descripción que más se parece a tu semana <span class="required">*</span></label>
          <div class="select-wrap">
            <select id="activity" name="activity" aria-describedby="activity-description">
              ${activityOptions.map((option) => `<option value="${option.value}">${option.label} · ${option.factor}</option>`).join('')}
            </select>
            <span class="select-chevron" aria-hidden="true">⌄</span>
          </div>
          <div class="activity-description" id="activity-description"></div>
        </div>

        <div class="rule"></div>

        <div class="weight-choice-block">
          <div class="choice-copy">
            <p class="section-kicker">Base del cálculo</p>
            <h2>¿Qué peso quieres utilizar?</h2>
            <p class="muted-copy">Cuando el IMC es mayor a 30, puedes cambiar a peso ajustado para una estimación más conservadora.</p>
          </div>
          <div class="weight-mode-options" role="radiogroup" aria-label="Peso utilizado en la fórmula">
            <label class="mode-option active" id="actual-mode"><input type="radio" name="weight-mode" value="actual" checked /><span class="mode-radio"></span><span><strong>Peso real</strong><small id="actual-weight-label">Se calculará con tu peso ingresado.</small></span></label>
            <label class="mode-option" id="adjusted-mode"><input type="radio" name="weight-mode" value="adjusted" /><span class="mode-radio"></span><span><strong>Peso ajustado</strong><small id="adjusted-weight-label">Disponible cuando IMC &gt; 30.</small></span></label>
          </div>
        </div>

        <div class="rule"></div>

        <div class="nutrition-goal-block">
          <div class="panel-heading">
            <div><p class="section-kicker">Siguiente capa</p><h2>Objetivo nutricional</h2></div>
            <span class="step-badge">02 / 02</span>
          </div>
          <label class="field-label nutrition-label" for="nutrition-goal">Elige qué quieres priorizar <span class="required">*</span></label>
          <div class="select-wrap">
            <select id="nutrition-goal" name="nutrition-goal" aria-describedby="nutrition-goal-description">
              ${nutritionGoals.map((goal) => `<option value="${goal.value}">${goal.label}</option>`).join('')}
            </select>
            <span class="select-chevron" aria-hidden="true">⌄</span>
          </div>
          <div class="nutrition-goal-description" id="nutrition-goal-description"></div>
        </div>

        <div id="form-message" class="form-message" role="alert" aria-live="polite"></div>
        <button class="primary-button" type="submit"><span>Calcular energía y macros</span><span class="button-arrow">↗</span></button>
        <p class="form-footnote"><span class="tiny-lock">◇</span> Tus datos se procesan localmente en esta página.</p>
      </form>

      <section class="results-panel" aria-live="polite" aria-label="Resultados de la calculadora">
        <div class="results-topline"><span>Resultado estimado</span><span class="result-status"><i></i> Listo para calcular</span></div>
        <div id="empty-state" class="empty-state">
          <div class="empty-orbit" aria-hidden="true"><span class="orbit-dot"></span><span class="orbit-ring"></span><span class="orbit-core">✦</span></div>
          <h2>Tu mapa energético<br /><em>aparecerá aquí.</em></h2>
          <p>Completa tus datos y descubre cómo se distribuye tu energía diaria.</p>
          <div class="empty-line"></div>
          <span class="empty-hint">La fórmula siempre quedará a la vista.</span>
        </div>
        <div id="results-content" class="results-content hidden">
          <div class="main-result">
            <div><span class="result-label">Gasto calórico estimado <span class="info-dot" title="Gasto energético diario total estimado">i</span></span><strong id="tdee-result">—</strong><span class="result-unit">kcal / día</span></div>
            <div class="result-factor"><span>Factor elegido</span><strong id="factor-result">—</strong></div>
          </div>
          <div class="metric-grid">
            <article class="metric-card metric-card-accent"><span class="metric-label">Metabolismo basal</span><strong id="bmr-result">—</strong><span>kcal / día en reposo</span></article>
            <article class="metric-card"><span class="metric-label">IMC</span><strong id="bmi-result">—</strong><span id="bmi-category">—</span></article>
            <article class="metric-card"><span class="metric-label">Peso usado</span><strong id="used-weight-result">—</strong><span id="used-weight-type">—</span></article>
          </div>
          <div id="recommendation" class="recommendation hidden"></div>
          <div id="macro-results" class="macro-results hidden">
            <div class="macro-heading"><div><span class="section-kicker">Objetivo nutricional</span><h3 id="goal-result">Mantenimiento</h3></div><div class="target-calories"><span>Calorías objetivo</span><strong id="target-calories-result">—</strong></div></div>
            <p id="goal-summary" class="goal-summary">—</p>
            <div class="macro-cards">
              <article class="macro-card macro-protein"><span class="macro-name">Proteínas</span><strong id="protein-result">—</strong><span id="protein-calories">— kcal · —%</span></article>
              <article class="macro-card macro-fat"><span class="macro-name">Grasas</span><strong id="fat-result">—</strong><span id="fat-calories">— kcal · —%</span></article>
              <article class="macro-card macro-carbs"><span class="macro-name">Carbohidratos</span><strong id="carbs-result">—</strong><span id="carbs-calories">— kcal · —%</span></article>
            </div>
            <div class="macro-interactive">
              <div class="macro-chart-area"><div id="macro-chart" class="macro-chart" role="img" aria-label="Distribución de macronutrientes"><div class="macro-chart-center"><strong id="macro-chart-total">100%</strong><span>del día</span></div></div><div class="macro-legend"><span><i class="legend-protein"></i>Proteínas</span><span><i class="legend-fat"></i>Grasas</span><span><i class="legend-carbs"></i>Carbohidratos</span></div></div>
              <div class="macro-controls"><div class="macro-controls-heading"><span>Ajuste manual</span><button type="button" id="reset-macros-button" class="reset-macros">Restaurar preset</button></div><label class="macro-input-row"><span><i class="legend-protein"></i>Proteínas</span><input id="protein-percent" type="number" min="10" max="60" step="1" aria-label="Porcentaje de proteínas" /><b>%</b></label><label class="macro-input-row"><span><i class="legend-fat"></i>Grasas</span><input id="fat-percent" type="number" min="10" max="60" step="1" aria-label="Porcentaje de grasas" /><b>%</b></label><label class="macro-input-row"><span><i class="legend-carbs"></i>Carbohidratos</span><input id="carbs-percent" type="number" min="10" max="70" step="1" aria-label="Porcentaje de carbohidratos" /><b>%</b></label><div id="macro-sum" class="macro-sum">Suma: 100%</div></div>
            </div>
            <p class="macro-note">Proteína: <span id="protein-rate">—</span> g/kg · Los carbohidratos completan las calorías restantes.</p>
          </div>
          <div class="calculation-breakdown">
            <div class="breakdown-heading"><span class="section-kicker">La cuenta, sin cajas negras</span><div class="export-actions"><button type="button" id="download-button" class="text-button">Descargar resumen ↓</button><button type="button" id="print-button" class="text-button">Guardar como PDF ↗</button></div></div>
            <div class="formula-row"><span>IMC</span><code id="bmi-formula">—</code><strong id="bmi-formula-value">—</strong></div>
            <div class="formula-row"><span>Peso ideal</span><code id="ibw-formula">—</code><strong id="ibw-result">—</strong></div>
            <div class="formula-row"><span>Peso ajustado</span><code id="abw-formula">—</code><strong id="abw-result">—</strong></div>
            <div class="formula-row formula-row-total"><span>Gasto diario</span><code id="tdee-formula">—</code><strong id="tdee-formula-value">—</strong></div>
          </div>
        </div>
      </section>
    </section>

    <section class="method-section" aria-labelledby="method-title">
      <div class="method-intro"><p class="section-kicker">Cómo se construye</p><h2 id="method-title">Una estimación<br /><em>que puedes leer.</em></h2></div>
      <div class="method-cards">
        <article class="method-card"><span class="method-number">01</span><h3>IMC</h3><p>Peso en kilogramos dividido por la altura en metros al cuadrado. Sirve como señal inicial, no como diagnóstico.</p><code>peso ÷ altura²</code></article>
        <article class="method-card"><span class="method-number">02</span><h3>Mifflin–St Jeor</h3><p>Estima las calorías que tu cuerpo necesita en reposo a partir de peso, altura, edad y sexo.</p><code>10×kg + 6.25×cm − 5×edad ± sexo</code></article>
        <article class="method-card"><span class="method-number">03</span><h3>Objetivo</h3><p>Ajustamos las calorías y distribuimos proteínas, grasas y carbohidratos según el objetivo que elijas.</p><code>kcal objetivo − P − G = C</code></article>
      </div>
    </section>

    <section class="activity-guide" aria-labelledby="guide-title">
      <div><p class="section-kicker">Escala de actividad</p><h2 id="guide-title">El factor no es<br /><em>una etiqueta fija.</em></h2></div>
      <div class="guide-scale">
        ${activityOptions.map((option, index) => `<button type="button" class="guide-row ${index === 3 ? 'selected-guide' : ''}" data-activity-value="${option.value}"><span class="guide-dot"></span><span class="guide-name">${option.label}</span><span class="guide-range">${option.range}</span><span class="guide-desc">${option.description}</span><span class="guide-arrow">↗</span></button>`).join('')}
      </div>
    </section>

    <footer class="site-footer">
      <div class="footer-brand"><span class="brand-mascot-wrap small"><img class="brand-mascot" src="./icons/logo.svg" alt="" /></span><strong>Energía Calc</strong></div>
      <p>Estimación educativa para adultos · No sustituye valoración profesional.</p>
      <details><summary>Fuentes y fórmulas</summary><div class="sources"><a href="https://reference.medscape.com/calculator/846/mifflin-st-jeor-equation-calculator" target="_blank" rel="noreferrer">Mifflin–St Jeor · Medscape / QxMD</a><a href="https://impact.chp.gov.hk/calculator_11_1.php" target="_blank" rel="noreferrer">Peso ideal y ajustado · IMPACT / Department of Health</a><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC3636460/" target="_blank" rel="noreferrer">Rango de actividad física · Frontiers in Physiology / NCBI</a><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC2117006/" target="_blank" rel="noreferrer">Proteína 1,4–2,0 g/kg · ISSN / NCBI</a><a href="https://www.ncbi.nlm.nih.gov/books/NBK610333/" target="_blank" rel="noreferrer">Rangos aceptables de macronutrientes · National Academies / NCBI</a></div></details>
    </footer>
  </main>
`;

const form = document.querySelector('#energy-form');
const activitySelect = document.querySelector('#activity');
const activityDescription = document.querySelector('#activity-description');
const nutritionGoalSelect = document.querySelector('#nutrition-goal');
const nutritionGoalDescription = document.querySelector('#nutrition-goal-description');
const adjustedMode = document.querySelector('#adjusted-mode');
const actualMode = document.querySelector('#actual-mode');
const formMessage = document.querySelector('#form-message');
const emptyState = document.querySelector('#empty-state');
const resultsContent = document.querySelector('#results-content');
const resultStatus = document.querySelector('.result-status');
const recommendation = document.querySelector('#recommendation');
const macroResults = document.querySelector('#macro-results');

const formatNumber = (value, maximumFractionDigits = 0) => new Intl.NumberFormat('es-ES', { maximumFractionDigits, minimumFractionDigits: maximumFractionDigits }).format(value);
const formatDecimal = (value) => formatNumber(value, 1);

function getSelectedActivity() {
  return activityOptions.find((option) => option.value === activitySelect.value) || activityOptions[0];
}

function getSelectedGoal() {
  return nutritionGoals.find((goal) => goal.value === nutritionGoalSelect.value) || nutritionGoals[0];
}

function updateActivityDescription() {
  const option = getSelectedActivity();
  activityDescription.innerHTML = `<span class="activity-pill">${option.factor}</span><span>${option.description}</span><span class="activity-range-label">Rango habitual: ${option.range}</span>`;
}

function updateNutritionGoalDescription() {
  const goal = getSelectedGoal();
  const adjustmentLabel = goal.adjustment === 0 ? 'sin ajuste' : `${goal.adjustment > 0 ? '+' : ''}${Math.round(goal.adjustment * 100)}% de calorías`;
  nutritionGoalDescription.innerHTML = `<span class="goal-pill">${adjustmentLabel}</span><span>${goal.description}</span>`;
}

function getSex() {
  return document.querySelector('input[name="sex"]:checked')?.value || 'female';
}

function validateInputs() {
  const age = Number(document.querySelector('#age').value);
  const height = Number(document.querySelector('#height').value);
  const weight = Number(document.querySelector('#weight').value);
  if (!Number.isFinite(age) || age < 18 || age > 120) return 'Introduce una edad entre 18 y 120 años.';
  if (!Number.isFinite(height) || height < 100 || height > 250) return 'Introduce una altura entre 100 y 250 cm.';
  if (!Number.isFinite(weight) || weight < 20 || weight > 400) return 'Introduce un peso entre 20 y 400 kg.';
  return null;
}

function calculateValues() {
  const sex = getSex();
  const age = Number(document.querySelector('#age').value);
  const height = Number(document.querySelector('#height').value);
  const weight = Number(document.querySelector('#weight').value);
  const factor = Number(activitySelect.value);
  const heightM = height / 100;
  const bmi = weight / (heightM ** 2);
  const heightInches = height / 2.54;
  const ibw = (sex === 'male' ? 50 : 45.5) + (2.3 * (heightInches - 60));
  const adjustedRaw = ibw + (0.4 * (weight - ibw));
  const adjustedApplicable = bmi > 30;
  const adjustedWeight = adjustedApplicable ? adjustedRaw : weight;
  const useAdjusted = state.weightMode === 'adjusted' && adjustedApplicable;
  const usedWeight = useAdjusted ? adjustedWeight : weight;
  const sexConstant = sex === 'male' ? 5 : -161;
  const bmr = (10 * usedWeight) + (6.25 * height) - (5 * age) + sexConstant;
  const tdee = bmr * factor;
  const goal = getSelectedGoal();
  const targetCalories = Math.max(1000, tdee * (1 + goal.adjustment));
  const presetProteinCalories = goal.protein * usedWeight * 4;
  const presetFatCalories = targetCalories * goal.fat;
  const presetCarbsCalories = Math.max(0, targetCalories - presetProteinCalories - presetFatCalories);
  const presetPercentages = {
    protein: presetProteinCalories / targetCalories * 100,
    fat: presetFatCalories / targetCalories * 100,
    carbs: presetCarbsCalories / targetCalories * 100
  };
  const percentages = state.macroPercentages || presetPercentages;
  const proteinCalories = targetCalories * percentages.protein / 100;
  const fatCalories = targetCalories * percentages.fat / 100;
  const carbsCalories = targetCalories * percentages.carbs / 100;
  const proteinGrams = proteinCalories / 4;
  const fatGrams = fatCalories / 9;
  const carbsGrams = carbsCalories / 4;
  const category = bmi < 18.5 ? 'Bajo peso' : bmi < 25 ? 'Rango adecuado' : bmi < 30 ? 'Sobrepeso' : bmi < 35 ? 'Obesidad · grado I' : bmi < 40 ? 'Obesidad · grado II' : 'Obesidad · grado III';
  return { sex, age, height, weight, factor, bmi, ibw, adjustedRaw, adjustedWeight, adjustedApplicable, useAdjusted, usedWeight, bmr, tdee, category, heightInches, goal, targetCalories, proteinGrams, proteinCalories, fatGrams, fatCalories, carbsGrams, carbsCalories, percentages };
}

function renderMacroChart(percentages, isValid = true) {
  const chart = document.querySelector('#macro-chart');
  const proteinEnd = percentages.protein;
  const fatEnd = proteinEnd + percentages.fat;
  chart.style.background = `conic-gradient(#b7f2d1 0 ${proteinEnd}%, #f26c53 ${proteinEnd}% ${fatEnd}%, #d9f28e ${fatEnd}% 100%)`;
  document.querySelector('#macro-chart-total').textContent = `${Math.round(percentages.protein + percentages.fat + percentages.carbs)}%`;
  document.querySelector('#macro-chart-total').classList.toggle('invalid', !isValid);
  const sumElement = document.querySelector('#macro-sum');
  sumElement.textContent = `Suma: ${Math.round(percentages.protein + percentages.fat + percentages.carbs)}%${isValid ? '' : ' · debe ser 100%'}`;
  sumElement.classList.toggle('invalid', !isValid);
}

function displayValues(values) {
  emptyState.classList.add('hidden');
  resultsContent.classList.remove('hidden');
  resultStatus.innerHTML = '<i></i> Cálculo actualizado';
  resultStatus.classList.add('ready');
  document.querySelector('#tdee-result').textContent = formatNumber(values.tdee);
  document.querySelector('#factor-result').textContent = values.factor.toFixed(2);
  document.querySelector('#bmr-result').textContent = formatNumber(values.bmr);
  document.querySelector('#bmi-result').textContent = formatDecimal(values.bmi);
  document.querySelector('#bmi-category').textContent = values.category;
  document.querySelector('#used-weight-result').textContent = `${formatDecimal(values.usedWeight)} kg`;
  document.querySelector('#used-weight-type').textContent = values.useAdjusted ? 'Peso ajustado' : 'Peso real';
  document.querySelector('#bmi-formula').textContent = `${formatDecimal(values.weight)} ÷ ${values.heightM?.toFixed(2) || (values.height / 100).toFixed(2)}²`;
  document.querySelector('#bmi-formula-value').textContent = formatDecimal(values.bmi);
  document.querySelector('#ibw-formula').textContent = `${values.sex === 'male' ? '50' : '45,5'} + 2,3 × (${formatDecimal(values.heightInches)} − 60)"`;
  document.querySelector('#ibw-result').textContent = `${formatDecimal(values.ibw)} kg`;
  document.querySelector('#abw-formula').textContent = values.adjustedApplicable ? `${formatDecimal(values.ibw)} + 0,4 × (${formatDecimal(values.weight)} − ${formatDecimal(values.ibw)})` : 'No aplica: se conserva el peso real';
  document.querySelector('#abw-result').textContent = `${formatDecimal(values.adjustedWeight)} kg`;
  document.querySelector('#tdee-formula').textContent = `${formatNumber(values.bmr)} × ${values.factor.toFixed(2)}`;
  document.querySelector('#tdee-formula-value').textContent = `${formatNumber(values.tdee)} kcal`;
  document.querySelector('#actual-weight-label').textContent = `${formatDecimal(values.weight)} kg ingresados`;
  document.querySelector('#adjusted-weight-label').textContent = values.adjustedApplicable ? `${formatDecimal(values.adjustedRaw)} kg calculados · recomendado` : 'Disponible cuando IMC > 30';
  macroResults.classList.remove('hidden');
  document.querySelector('#goal-result').textContent = values.goal.label;
  document.querySelector('#target-calories-result').textContent = `${formatNumber(values.targetCalories)} kcal`;
  document.querySelector('#goal-summary').textContent = `${values.goal.description} Ajuste aplicado: ${values.goal.adjustment === 0 ? 'mantenimiento' : `${values.goal.adjustment > 0 ? '+' : ''}${Math.round(values.goal.adjustment * 100)}% sobre el gasto estimado`}.`;
  document.querySelector('#protein-result').textContent = `${formatNumber(values.proteinGrams)} g`;
  document.querySelector('#fat-result').textContent = `${formatNumber(values.fatGrams)} g`;
  document.querySelector('#carbs-result').textContent = `${formatNumber(values.carbsGrams)} g`;
  document.querySelector('#protein-calories').textContent = `${formatNumber(values.proteinCalories)} kcal · ${Math.round(values.proteinCalories / values.targetCalories * 100)}%`;
  document.querySelector('#fat-calories').textContent = `${formatNumber(values.fatCalories)} kcal · ${Math.round(values.fatCalories / values.targetCalories * 100)}%`;
  document.querySelector('#carbs-calories').textContent = `${formatNumber(values.carbsCalories)} kcal · ${Math.round(values.carbsCalories / values.targetCalories * 100)}%`;
  document.querySelector('#protein-rate').textContent = values.goal.protein.toFixed(1);
  const percentages = values.percentages;
  document.querySelector('#protein-percent').value = Math.round(percentages.protein);
  document.querySelector('#fat-percent').value = Math.round(percentages.fat);
  document.querySelector('#carbs-percent').value = Math.round(percentages.carbs);
  renderMacroChart(percentages);

  if (values.adjustedApplicable && !values.useAdjusted) {
    recommendation.classList.remove('hidden');
    recommendation.innerHTML = `<span class="recommendation-icon">!</span><span><strong>Tu IMC supera 30.</strong> Para esta estimación puedes usar ${formatDecimal(values.adjustedWeight)} kg de peso ajustado. <button type="button" id="use-adjusted-button">Usar peso ajustado</button></span>`;
    document.querySelector('#use-adjusted-button').addEventListener('click', () => {
      state.weightMode = 'adjusted';
      document.querySelector('input[name="weight-mode"][value="adjusted"]').checked = true;
      syncModeStyles();
      const recalculated = calculateValues();
      state.lastCalculation = recalculated;
      displayValues(recalculated);
    });
  } else {
    recommendation.classList.add('hidden');
    recommendation.innerHTML = '';
  }
}

function syncModeStyles() {
  actualMode.classList.toggle('active', state.weightMode === 'actual');
  adjustedMode.classList.toggle('active', state.weightMode === 'adjusted');
}

function enableAdjustedIfNeeded() {
  const error = validateInputs();
  if (error) return;
  const values = calculateValues();
  const adjustedInput = document.querySelector('input[name="weight-mode"][value="adjusted"]');
  adjustedInput.disabled = !values.adjustedApplicable;
  adjustedMode.classList.toggle('disabled', !values.adjustedApplicable);
  if (!values.adjustedApplicable && state.weightMode === 'adjusted') {
    state.weightMode = 'actual';
    document.querySelector('input[name="weight-mode"][value="actual"]').checked = true;
    syncModeStyles();
  }
}

function showMessage(message = '') {
  formMessage.textContent = message;
  formMessage.classList.toggle('visible', Boolean(message));
}

activitySelect.addEventListener('change', () => {
  updateActivityDescription();
  if (state.lastCalculation) {
    state.lastCalculation = calculateValues();
    displayValues(state.lastCalculation);
  }
});

nutritionGoalSelect.addEventListener('change', () => {
  state.nutritionGoal = nutritionGoalSelect.value;
  state.macroPercentages = null;
  updateNutritionGoalDescription();
  if (state.lastCalculation) {
    state.lastCalculation = calculateValues();
    displayValues(state.lastCalculation);
  }
});

const macroPercentageInputs = {
  protein: document.querySelector('#protein-percent'),
  fat: document.querySelector('#fat-percent'),
  carbs: document.querySelector('#carbs-percent')
};

function handleMacroPercentageChange() {
  const percentages = Object.fromEntries(Object.entries(macroPercentageInputs).map(([key, input]) => [key, Number(input.value) || 0]));
  const sum = percentages.protein + percentages.fat + percentages.carbs;
  const isValid = sum === 100;
  renderMacroChart(percentages, isValid);
  if (isValid && state.lastCalculation) {
    state.macroPercentages = percentages;
    state.lastCalculation = calculateValues();
    displayValues(state.lastCalculation);
  }
}

Object.values(macroPercentageInputs).forEach((input) => input.addEventListener('input', handleMacroPercentageChange));
document.querySelector('#reset-macros-button').addEventListener('click', () => {
  state.macroPercentages = null;
  if (state.lastCalculation) {
    state.lastCalculation = calculateValues();
    displayValues(state.lastCalculation);
  }
});

document.querySelectorAll('input[name="weight-mode"]').forEach((input) => {
  input.addEventListener('change', (event) => {
    if (event.target.disabled) return;
    state.weightMode = event.target.value;
    syncModeStyles();
    if (state.lastCalculation) {
      state.lastCalculation = calculateValues();
      displayValues(state.lastCalculation);
    }
  });
});

document.querySelectorAll('input[name="sex"], #age, #height, #weight').forEach((input) => input.addEventListener('input', enableAdjustedIfNeeded));

document.querySelectorAll('.guide-row').forEach((row) => row.addEventListener('click', () => {
  activitySelect.value = row.dataset.activityValue;
  updateActivityDescription();
  document.querySelectorAll('.guide-row').forEach((item) => item.classList.remove('selected-guide'));
  row.classList.add('selected-guide');
  if (state.lastCalculation) {
    state.lastCalculation = calculateValues();
    displayValues(state.lastCalculation);
  }
}));

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const error = validateInputs();
  if (error) {
    showMessage(error);
    form.querySelector(':invalid')?.focus();
    return;
  }
  showMessage('');
  const values = calculateValues();
  state.lastCalculation = values;
  displayValues(values);
  document.querySelector('.results-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.querySelector('#print-button').addEventListener('click', () => window.print());

document.querySelector('#download-button').addEventListener('click', () => {
  if (!state.lastCalculation) return;
  const values = state.lastCalculation;
  const sexLabel = values.sex === 'male' ? 'Hombre' : 'Mujer';
  const lines = [
    'ENERGÍA CALC · RESUMEN DE RESULTADOS',
    `Generado: ${new Intl.DateTimeFormat('es-ES', { dateStyle: 'long', timeStyle: 'short' }).format(new Date())}`,
    '',
    'DATOS DE ENTRADA',
    `Sexo: ${sexLabel}`,
    `Edad: ${values.age} años`,
    `Altura: ${formatDecimal(values.height)} cm`,
    `Peso real: ${formatDecimal(values.weight)} kg`,
    `Actividad: factor ${values.factor.toFixed(2)}`,
    `Objetivo: ${values.goal.label}`,
    `Peso usado: ${formatDecimal(values.usedWeight)} kg (${values.useAdjusted ? 'ajustado' : 'real'})`,
    '',
    'RESULTADOS',
    `IMC: ${formatDecimal(values.bmi)} · ${values.category}`,
    `Peso ideal estimado: ${formatDecimal(values.ibw)} kg`,
    `Peso ajustado estimado: ${formatDecimal(values.adjustedWeight)} kg`,
    `Metabolismo basal: ${formatNumber(values.bmr)} kcal/día`,
    `Gasto energético estimado: ${formatNumber(values.tdee)} kcal/día`,
    `Calorías objetivo: ${formatNumber(values.targetCalories)} kcal/día`,
    '',
    'MACRONUTRIENTES',
    `Proteínas: ${formatNumber(values.proteinGrams)} g · ${formatNumber(values.proteinCalories)} kcal`,
    `Grasas: ${formatNumber(values.fatGrams)} g · ${formatNumber(values.fatCalories)} kcal`,
    `Carbohidratos: ${formatNumber(values.carbsGrams)} g · ${formatNumber(values.carbsCalories)} kcal`,
    '',
    'FÓRMULAS',
    `Mifflin–St Jeor: ${formatNumber(values.bmr)} kcal/día`,
    `Objetivo: ${formatNumber(values.tdee)} × ${1 + values.goal.adjustment} = ${formatNumber(values.targetCalories)} kcal/día`,
    'Los carbohidratos completan las calorías restantes después de proteínas y grasas.',
    '',
    'Nota: son estimaciones educativas y no sustituyen la valoración de un profesional de la salud o nutrición.'
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'energia-calc-resumen.txt';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

updateActivityDescription();
updateNutritionGoalDescription();
enableAdjustedIfNeeded();
