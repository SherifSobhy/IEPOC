/*
 * Incoming Exchange nomination UI draft (feature 17570).
 * This file deliberately has no Dataverse calls. Replace the storage functions
 * with a Power Pages API adapter only after the nomination table exists.
 */

const STORAGE_KEY = "qub-nomination-ui-draft-v1";
const STEP_NAMES = ["Institution", "Student", "Nominator", "Review information", "Submission"];
const COUNTRY_INSTITUTIONS = {
  France: ["Université de Lyon", "Université de Strasbourg"],
  Germany: ["Universität Hamburg", "Universität Heidelberg"],
  Spain: ["Universidad de Barcelona", "Universidad de Granada"]
};

const DEMO_NOMINATOR = {
  firstName: "Alex",
  lastName: "Morgan",
  email: "alex.morgan@example.edu"
};

// The real form's complete field list and option values must come from story
// 19124's data dictionary. These fields are enough to demonstrate the journey.
const FIELD_GROUPS = [
  [
    { key: "country", label: "Country / Region", type: "country", required: true },
    { key: "institution", label: "University / Higher Education Institution", type: "institution", required: true }
  ],
  [
    { key: "studentFirstName", label: "Student first name", required: true },
    { key: "studentMiddleName", label: "Student middle name" },
    { key: "studentLastName", label: "Student last name", required: true },
    { key: "studentEmail", label: "Student email address", type: "email", required: true, hint: "Please use the student's personal email address." },
    { key: "majorSubject", label: "Major subject", required: true },
    { key: "degree", label: "Current degree programme", type: "select", options: ["Undergraduate", "Postgraduate"], required: true },
    { key: "year", label: "Current year of study", type: "select", options: ["Year 1", "Year 2", "Year 3", "Year 4"], required: true },
    { key: "period", label: "Period of study", type: "select", options: ["One semester", "Full academic year"], required: true }
  ],
  [
    { key: "nominatorFirstName", label: "First name", locked: true, required: true },
    { key: "nominatorLastName", label: "Last name", locked: true, required: true },
    { key: "nominatorEmail", label: "Email address", locked: true, required: true },
    { key: "transcriptEmail", label: "Transcript email address", type: "email", required: true, hint: "We will use this address for transcript correspondence." }
  ]
];

const app = document.querySelector("#app");
let records = loadRecords();
let page = "list";
let currentId = null;
let currentStep = 0;
let errors = {};
let filterStatus = "All nominations";
let searchText = "";

function loadRecords() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) return saved;
  } catch (error) {
    console.warn("Demo data could not be loaded; starting fresh.", error);
  }

  const seed = [
   
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function currentRecord() {
  return records.find(record => record.id === currentId);
}

// Escaping makes sample values safe to display in HTML templates. The same
// rule applies to values returned from Dataverse in a later implementation.
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function fullName(record) {
  return [record.studentFirstName, record.studentLastName].filter(Boolean).join(" ") || "Student details pending";
}

function makeId() {
  const numbers = records.map(record => Number(record.id.split("-").at(-1)) || 0);
  return `EXC-DEMO-${Math.max(1000, ...numbers) + 1}`;
}

function startNomination() {
  const record = {
    id: makeId(), status: "Draft", lastStep: 0,
    created: new Date().toISOString().slice(0, 10),
    nominatorFirstName: DEMO_NOMINATOR.firstName,
    nominatorLastName: DEMO_NOMINATOR.lastName,
    nominatorEmail: DEMO_NOMINATOR.email
  };
  records.unshift(record);
  saveRecords();
  openNomination(record.id);
}

function openNomination(id) {
  const record = records.find(item => item.id === id);
  if (!record) return;
  currentId = id;
  currentStep = record.status === "Draft" ? record.lastStep : 3;
  page = "form";
  errors = {};
  render();
}

function render() {
  if (page === "list") app.innerHTML = renderList();
  if (page === "form") app.innerHTML = renderForm();
  if (page === "confirmation") app.innerHTML = renderConfirmation();
}

function renderList() {
  const query = searchText.toLowerCase();
  const visible = records.filter(record => {
    const matchesStatus = filterStatus === "All nominations" || record.status === filterStatus;
    const matchesSearch = `${record.id} ${fullName(record)} ${record.institution || ""}`.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  return `
    <div class="page-heading">
      <div><p class="eyebrow">Incoming Exchange</p><h1>Exchange Nominations</h1>
        <p class="lead">Create a nomination, continue a draft, or review a submitted nomination.</p></div>
      <div class="page-heading__actions"><button class="button" data-action="new">+ Start a new Nomination</button></div>
    </div>
    <section class="panel" aria-labelledby="list-title">
      <h2 id="list-title">My Exchange Nominations</h2>
      <div class="toolbar">
        <div class="field field--short"><label for="status-filter">Status</label>
          <select id="status-filter"><option>All nominations</option><option ${filterStatus === "Draft" ? "selected" : ""}>Draft</option><option ${filterStatus === "Submitted" ? "selected" : ""}>Submitted</option></select></div>
        <div class="field"><label for="search-nominations">Search nominations</label>
          <input id="search-nominations" type="search" value="${escapeHtml(searchText)}" placeholder="Nomination ID, student or institution"></div>
      </div>
      ${visible.length ? `<div class="table-wrap"><table><thead><tr><th>Nomination ID</th><th>Student</th><th>Institution</th><th>Created</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>${visible.map(record => `<tr><td><strong>${escapeHtml(record.id)}</strong></td><td>${escapeHtml(fullName(record))}</td>
          <td>${escapeHtml(record.institution || "Not selected")}</td><td>${escapeHtml(record.created)}</td>
          <td><span class="status status--${record.status.toLowerCase()}">${record.status}</span></td>
          <td><button class="text-button" data-action="open" data-id="${escapeHtml(record.id)}">${record.status === "Draft" ? "Continue draft" : "View details"}</button></td></tr>`).join("")}</tbody></table></div>`
        : `<div class="empty-state">No nominations match your search.</div>`}
    </section>`;
}

function renderForm() {
  const record = currentRecord();
  const readOnly = record.status !== "Draft";
  const title = readOnly ? `Nomination ${record.id}` : `Nomination ${record.id}`;

  return `
    <div class="page-heading"><div><p class="eyebrow">Incoming Exchange / ${readOnly ? "Submitted nomination" : "Draft nomination"}</p>
      <h1>${escapeHtml(title)}</h1><p class="lead">${readOnly ? "This nomination has been submitted and is read only." : "Complete each section and save your progress as you go."}</p></div>
      <button class="button button--quiet" data-action="list">Back to My Nominations</button></div>
    <div class="wizard">
      <nav class="step-nav" aria-label="Nomination sections"><p class="step-nav__title">Your progress</p>
        ${STEP_NAMES.map((name, index) => `<button class="step-nav__item" type="button" data-action="step" data-step="${index}"
          ${index === currentStep ? 'aria-current="step"' : ""} ${!readOnly && index > currentStep ? "disabled" : ""}>
          <span class="step-nav__number">${index + 1}</span>${escapeHtml(name)}</button>`).join("")}
      </nav>
      <section class="panel" aria-labelledby="section-title">
        <p class="section-count">Section ${currentStep + 1} of ${STEP_NAMES.length}</p>
        <h2 id="section-title">${escapeHtml(STEP_NAMES[currentStep])}</h2>
        ${Object.keys(errors).length ? '<div class="alert" role="alert">Please correct the highlighted fields before continuing.</div>' : ""}
        ${currentStep < 3 ? (readOnly ? renderReadOnlyGroup(record, currentStep) : renderFieldGroup(record, currentStep)) : ""}
        ${currentStep === 3 ? renderReview(record, readOnly) : ""}
        ${currentStep === 4 ? (readOnly ? renderReadOnlySubmission(record) : renderSubmission(record)) : ""}
        <div class="form-actions">
          ${currentStep > 0 ? '<button class="button button--quiet" data-action="previous">Previous</button>' : ""}
          <div class="form-actions__right">${readOnly ? (currentStep < 4 ? '<button class="button button--secondary" data-action="next-readonly">Next section</button>' : "")
            : (currentStep === 4 ? '<button class="button" data-action="submit">Submit nomination</button>' : '<button class="button" data-action="next">Save and Next</button>')}</div>
        </div>
      </section>
    </div>`;
}

function renderFieldGroup(record, groupIndex) {
  const intro = [
    "Choose the exchange partner institution. The institution list changes with the country selected.",
    "Enter the student's details exactly as they should appear on the nomination.",
    "Your profile details are filled in automatically. Add the transcript correspondence address."
  ][groupIndex];
  return `<p class="section-intro">${intro}</p><div class="field-grid">${FIELD_GROUPS[groupIndex].map(field => renderField(record, field)).join("")}</div>`;
}

function renderField(record, field) {
  const value = record[field.key] || "";
  const error = errors[field.key];
  const label = `${escapeHtml(field.label)}${field.required ? ' <span class="required" aria-hidden="true">*</span>' : ""}`;
  let control;

  if (["select", "country", "institution"].includes(field.type)) {
    const options = field.type === "country" ? Object.keys(COUNTRY_INSTITUTIONS)
      : field.type === "institution" ? COUNTRY_INSTITUTIONS[record.country] || [] : field.options;
    control = `<select id="${field.key}" name="${field.key}" ${error ? 'aria-invalid="true"' : ""}>
      <option value="">Please select</option>${options.map(option => `<option value="${escapeHtml(option)}" ${value === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}</select>`;
  } else {
    control = `<input id="${field.key}" name="${field.key}" type="${field.type === "email" ? "email" : "text"}"
      value="${escapeHtml(value)}" ${field.locked ? "disabled" : ""} ${error ? 'aria-invalid="true"' : ""}>`;
  }

  return `<div class="field ${field.key === "majorSubject" ? "field--full" : ""}">
    <label for="${field.key}">${label}</label>${control}
    ${field.hint ? `<span class="hint">${escapeHtml(field.hint)}</span>` : ""}
    ${error ? `<span class="field-error">${escapeHtml(error)}</span>` : ""}</div>`;
}

function renderReadOnlyGroup(record, groupIndex) {
  return `<p class="section-intro">Submitted details</p>${renderReviewBlock(record, groupIndex, false)}`;
}

function renderReview(record, readOnly) {
  return `<p class="section-intro">Check the saved information below. Unanswered optional fields are hidden.</p>
    ${FIELD_GROUPS.map((_, index) => renderReviewBlock(record, index, !readOnly)).join("")}`;
}

function renderReviewBlock(record, index, allowEdit) {
  const rows = FIELD_GROUPS[index].filter(field => record[field.key]).map(field =>
    `<dt>${escapeHtml(field.label)}</dt><dd>${escapeHtml(record[field.key])}</dd>`).join("");
  return `<div class="review-block"><div class="review-block__heading"><h3>${escapeHtml(STEP_NAMES[index])}</h3>
    ${allowEdit ? `<button class="text-button" data-action="edit-section" data-step="${index}">Edit section</button>` : ""}</div>
    <dl class="review-list">${rows || "<dt>No details saved</dt>"}</dl></div>`;
}

function renderSubmission(record) {
  return `<p class="section-intro">Confirm the declaration before sending this nomination to Queen's University Belfast.</p>
    <div class="review-block"><h3>Data protection and privacy</h3>
      <p>Read the <a href="https://www.qub.ac.uk/privacynotice" target="_blank" rel="noopener noreferrer">Queen's University Belfast privacy notice</a>.</p>
      <p>I confirm that the student named in this nomination has agreed to be nominated.</p></div>
    <div class="field-grid">
      <div class="field"><label for="declaration">I have read and agree to the above statement <span class="required">*</span></label>
        <select id="declaration" name="declaration" ${errors.declaration ? 'aria-invalid="true"' : ""}>
          <option value="">Please select</option><option ${record.declaration === "Yes" ? "selected" : ""}>Yes</option><option ${record.declaration === "No" ? "selected" : ""}>No</option></select>
        ${errors.declaration ? `<span class="field-error">${escapeHtml(errors.declaration)}</span>` : ""}</div>
      <div class="field"><label for="signedBy">Declaration Signed By <span class="required">*</span></label>
        <input id="signedBy" name="signedBy" value="${escapeHtml(record.signedBy || "")}" ${errors.signedBy ? 'aria-invalid="true"' : ""}>
        ${errors.signedBy ? `<span class="field-error">${escapeHtml(errors.signedBy)}</span>` : ""}</div>
    </div><p class="hint">We will confirm receipt of your nomination by email.</p>`;
}

function renderReadOnlySubmission(record) {
  return `<p class="section-intro">This declaration was submitted with the nomination.</p>
    <dl class="review-list"><dt>Declaration agreed</dt><dd>${escapeHtml(record.declaration || "Not recorded")}</dd>
      <dt>Declaration Signed By</dt><dd>${escapeHtml(record.signedBy || "Not recorded")}</dd></dl>`;
}

function renderConfirmation() {
  const record = currentRecord();
  return `<section class="panel confirmation"><div class="confirmation__icon" aria-hidden="true">✓</div>
    <h1>Thank you, ${escapeHtml(record.nominatorFirstName)} ${escapeHtml(record.nominatorLastName)}</h1>
    <p>Your nomination has been submitted. Your Nomination ID is</p>
    <span class="confirmation__id">${escapeHtml(record.id)}</span>
    <p>Queen's University Belfast will contact you at <strong>${escapeHtml(record.nominatorEmail)}</strong> if we require further information.</p>
    <button class="button" data-action="list">My Nominations</button></section>`;
}

function validateSection(record, index) {
  errors = {};
  if (index < 3) {
    for (const field of FIELD_GROUPS[index]) {
      const value = String(record[field.key] || "").trim();
      if (field.required && !value) errors[field.key] = `${field.label} is required.`;
      if (field.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors[field.key] = "Enter a valid email address.";
      }
    }
  }
  if (index === 4) {
    if (record.declaration !== "Yes") errors.declaration = "Select Yes to submit.";
    if (!String(record.signedBy || "").trim()) errors.signedBy = "Enter the name of the person signing.";
  }
  return Object.keys(errors).length === 0;
}

function saveAndAdvance() {
  const record = currentRecord();
  if (!validateSection(record, currentStep)) {
    render();
    app.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }
  record.lastStep = Math.min(currentStep + 1, 4);
  saveRecords();
  currentStep = record.lastStep;
  render();
}

function submitNomination() {
  const record = currentRecord();
  if (!validateSection(record, 4)) {
    render();
    app.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }
  // In the real portal, this transition needs server-side validation and an
  // immutable Submitted state. Browser code alone cannot secure a record.
  record.status = "Submitted";
  saveRecords();
  page = "confirmation";
  render();
}

app.addEventListener("input", event => {
  if (event.target.id === "search-nominations") {
    searchText = event.target.value;
    const position = event.target.selectionStart;
    render();
    const search = app.querySelector("#search-nominations");
    search.focus();
    search.setSelectionRange(position, position);
    return;
  }
  if (!currentId || page !== "form" || currentRecord().status !== "Draft") return;
  if (event.target.name) currentRecord()[event.target.name] = event.target.value;
});

app.addEventListener("change", event => {
  if (event.target.id === "status-filter") {
    filterStatus = event.target.value;
    render();
    return;
  }
  if (!currentId || page !== "form" || currentRecord().status !== "Draft") return;
  if (event.target.name) currentRecord()[event.target.name] = event.target.value;
  if (event.target.name === "country") {
    currentRecord().institution = "";
    render();
  }
});

app.addEventListener("click", event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const record = currentRecord();

  if (action === "new") startNomination();
  if (action === "open") openNomination(button.dataset.id);
  if (action === "list") { page = "list"; currentId = null; render(); }
  if (action === "previous") { currentStep--; errors = {}; render(); }
  if (action === "next") saveAndAdvance();
  if (action === "submit") submitNomination();
  if (action === "next-readonly") { currentStep++; render(); }
  if (action === "edit-section") { currentStep = Number(button.dataset.step); errors = {}; render(); }
  if (action === "step" && record) {
    const target = Number(button.dataset.step);
    if (record.status !== "Draft" || target <= currentStep) {
      currentStep = target;
      errors = {};
      render();
    }
  }
});

render();
