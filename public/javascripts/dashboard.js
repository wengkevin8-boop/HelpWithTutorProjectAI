let currentUser = null;
let currentType = 'plan';
let currentLevel = 'Intermediate';
let lastResult = null;

document.addEventListener('DOMContentLoaded', init);

async function init() {
  lucide.createIcons();
  setupTypeButtons();
  setupLevelButtons();
  setupForm();
  setupUserMenu();
  await checkAuth();
}

function updateUserUI() {
  if (!currentUser) return;
  const initial = (currentUser.username || 'U').charAt(0).toUpperCase();
  const avatarEl = document.getElementById('user-avatar');
  const nameEl = document.getElementById('user-name');
  const dropNameEl = document.getElementById('dropdown-name');
  const dropEmailEl = document.getElementById('dropdown-email');

  if (avatarEl) avatarEl.textContent = initial;
  if (nameEl) nameEl.textContent = currentUser.username;
  if (dropNameEl) dropNameEl.textContent = currentUser.username;
  if (dropEmailEl) dropEmailEl.textContent = currentUser.email;
}

function setupTypeButtons() {
  const btns = document.querySelectorAll('.type-btn');
  btns.forEach((btn) => {
    btn.addEventListener('click', () => {
      btns.forEach((b) => b.classList.remove('active-type'));
      btn.classList.add('active-type');
      currentType = btn.dataset.type;
      document.getElementById('gen-type').value = currentType;

      // Hide goals for quiz (not relevant)
      const goalsField = document.getElementById('goals-field');
      if (currentType === 'quiz') {
        goalsField.style.display = 'none';
      } else {
        goalsField.style.display = 'block';
      }
    });
  });
}

function setupLevelButtons() {
  const btns = document.querySelectorAll('.level-btn');
  btns.forEach((btn) => {
    btn.addEventListener('click', () => {
      btns.forEach((b) => {
        b.classList.remove('active-level');
        // Reset inline styles
        b.style.borderColor = '';
        b.style.background = '';
        b.style.color = '';
        b.classList.add('text-gray-500');
        b.classList.remove('text-[#E30613]');
      });
      btn.classList.add('active-level');
      btn.classList.remove('text-gray-500');
      currentLevel = btn.dataset.level;
      document.getElementById('gen-level').value = currentLevel;
    });
  });
}

function setupForm() {
  document.getElementById('gen-form').addEventListener('submit', handleGenerate);
}

async function handleGenerate(e) {
  e.preventDefault();

  const errorEl = document.getElementById('gen-error');
  const btn = document.getElementById('gen-btn');
  const btnText = document.getElementById('gen-btn-text');
  const spinner = document.getElementById('gen-spinner');
  const icon = document.getElementById('gen-icon');

  // Hide previous error
  errorEl.classList.add('hidden');

  const subject = document.getElementById('gen-subject').value.trim();
  const topic = document.getElementById('gen-topic').value.trim();
  const goals = document.getElementById('gen-goals').value.trim();

  if (!subject || !topic) {
    errorEl.textContent = 'Subject and topic are required.';
    errorEl.classList.remove('hidden');
    return;
  }

  // Loading state
  btn.disabled = true;
  btnText.textContent = 'Generating...';
  spinner.classList.remove('hidden');
  icon.classList.add('hidden');

  try {
    const body = {
      subject,
      topic,
      level: currentLevel,
      type: currentType,
    };
    if (goals && currentType !== 'quiz') {
      body.goals = goals;
    }

  const res = await fetch('/api/plans', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
});

if (!res.ok) {
  throw new Error(`HTTP error! Status: ${res.status}`);
}

const data = await res.json();

console.log(data);

    if (!data.success) {
      errorEl.textContent = data.message;
      errorEl.classList.remove('hidden');
      return;
    }

    lastResult = data.plan.content;
    renderResult(data.plan.content, data.plan.type);
    showToast('Generated successfully!', 'success');
  } catch (err) {
    errorEl.textContent = 'Failed to generate. Please try again.';
    errorEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btnText.textContent = 'Generate with AI';
    spinner.classList.add('hidden');
    icon.classList.remove('hidden');
  }
}

function renderResult(content, type) {
  const area = document.getElementById('result-area');
  const container = document.getElementById('result-content');
  const titleEl = document.getElementById('result-title');

  area.classList.remove('hidden');

  if (type === 'quiz') {
    titleEl.textContent = content.title || 'Your Quiz';
    container.innerHTML = renderQuiz(content);
  } else if (type === 'explanation') {
    titleEl.textContent = content.title || 'Explanation';
    container.innerHTML = renderExplanation(content);
  } else {
    titleEl.textContent = content.title || 'Your Tutoring Plan';
    container.innerHTML = renderPlan(content);
  }

  // Re-init lucide icons for any new elements
  if (window.lucide) lucide.createIcons();

  // Scroll to result
  area.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderPlan(content) {
  let html = '';

  if (content.summary) {
    html +=
      '<div class="result-section"><h3>Summary</h3><p>' +
      escapeHtml(content.summary) +
      '</p></div>';
  }

  if (content.estimated_hours || content.duration_weeks) {
    html += '<div class="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">';
    if (content.estimated_hours) {
      html +=
        '<span class="flex items-center gap-1.5"><i data-lucide="clock" class="w-4 h-4"></i> ' +
        content.estimated_hours +
        ' hours estimated</span>';
    }
    if (content.duration_weeks) {
      html +=
        '<span class="flex items-center gap-1.5"><i data-lucide="calendar" class="w-4 h-4"></i> ' +
        content.duration_weeks +
        ' weeks</span>';
    }
    html += '</div>';
  }

  if (content.sections && content.sections.length) {
    content.sections.forEach(function (section, i) {
      html += '<div class="result-section">';
      html +=
        '<div class="flex items-center gap-3 mb-4">' +
        '<div class="w-8 h-8 rounded-lg bg-[#E30613]/10 flex items-center justify-center text-[#E30613] text-sm font-medium shrink-0">' +
        (section.week || i + 1) +
        '</div>' +
        '<h3 style="margin-bottom:0">' +
        escapeHtml(section.title) +
        '</h3>' +
        '</div>';

      if (section.objectives && section.objectives.length) {
        html +=
          '<div class="mb-4"><p class="text-xs font-medium tracking-widest uppercase text-gray-500 mb-2">Objectives</p><ul>' +
          section.objectives.map(function (o) { return '<li>' + escapeHtml(o) + '</li>'; }).join('') +
          '</ul></div>';
      }

      if (section.activities && section.activities.length) {
        html +=
          '<div class="mb-4"><p class="text-xs font-medium tracking-widest uppercase text-gray-500 mb-2">Activities</p><ul>' +
          section.activities.map(function (a) { return '<li>' + escapeHtml(a) + '</li>'; }).join('') +
          '</ul></div>';
      }

      if (section.resources && section.resources.length) {
        html +=
          '<div class="mb-4"><p class="text-xs font-medium tracking-widest uppercase text-gray-500 mb-2">Resources</p><ul>' +
          section.resources.map(function (r) { return '<li>' + escapeHtml(r) + '</li>'; }).join('') +
          '</ul></div>';
      }

      if (section.assessment) {
        html +=
          '<div><p class="text-xs font-medium tracking-widest uppercase text-gray-500 mb-2">Assessment</p><p>' +
          escapeHtml(section.assessment) +
          '</p></div>';
      }

      html += '</div>';
    });
  }

  if (content.tips && content.tips.length) {
    html +=
      '<div class="result-section"><h3>Study Tips</h3><ul>' +
      content.tips.map(function (t) { return '<li>' + escapeHtml(t) + '</li>'; }).join('') +
      '</ul></div>';
  }

  return html;
}

function renderQuiz(content) {
  let html = '';

  if (content.questions && content.questions.length) {
    content.questions.forEach(function (q, i) {
      html += '<div class="result-section">';
      html +=
        '<p class="text-sm font-medium text-white mb-3">Question ' +
        (i + 1) +
        '</p>';
      html += '<p class="mb-3">' + escapeHtml(q.question) + '</p>';
      html += '<div class="space-y-2 mb-3">';

      if (q.options) {
        q.options.forEach(function (opt) {
          var isCorrect = opt === q.correct_answer;
          html +=
            '<div class="quiz-option ' +
            (isCorrect ? 'correct' : '') +
            '">' +
            escapeHtml(opt) +
            '</div>';
        });
      }

      html += '</div>';

      if (q.explanation) {
        html +=
          '<div class="quiz-explanation">' +
          escapeHtml(q.explanation) +
          '</div>';
      }

      html += '</div>';
    });
  }

  return html;
}

function renderExplanation(content) {
  let html = '';

  if (content.introduction) {
    html +=
      '<div class="result-section"><h3>Introduction</h3><p>' +
      escapeHtml(content.introduction) +
      '</p></div>';
  }

  if (content.key_points && content.key_points.length) {
    html += '<div class="result-section"><h3>Key Points</h3><div class="space-y-3">';
    content.key_points.forEach(function (kp) {
      html +=
        '<div class="key-point"><p class="point-title">' +
        escapeHtml(kp.point) +
        '</p><p class="point-detail">' +
        escapeHtml(kp.detail) +
        '</p></div>';
    });
    html += '</div></div>';
  }

  if (content.analogy) {
    html +=
      '<div class="result-section"><h3>Analogy</h3><p>' +
      escapeHtml(content.analogy) +
      '</p></div>';
  }

  if (content.common_misconceptions && content.common_misconceptions.length) {
    html +=
      '<div class="result-section"><h3>Common Misconceptions</h3><ul>' +
      content.common_misconceptions
        .map(function (m) { return '<li>' + escapeHtml(m) + '</li>'; })
        .join('') +
      '</ul></div>';
  }

  if (content.next_steps && content.next_steps.length) {
    html +=
      '<div class="result-section"><h3>Next Steps</h3><ul>' +
      content.next_steps
        .map(function (s) { return '<li>' + escapeHtml(s) + '</li>'; })
        .join('') +
      '</ul></div>';
  }

  return html;
}

function copyResult() {
  if (!lastResult) return;
  navigator.clipboard
    .writeText(JSON.stringify(lastResult, null, 2))
    .then(function () {
      showToast('Copied to clipboard!', 'success');
    })
    .catch(function () {
      showToast('Failed to copy.', 'error');
    });
}

function setupUserMenu() {
  var btn = document.getElementById('user-btn');
  var dropdown = document.getElementById('user-dropdown');
  if (!btn || !dropdown) return;

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', function () {
    dropdown.classList.add('hidden');
  });
}

async function handleLogout() {
  try {
    await fetch('/api/logout', { method: 'POST' });
  } catch {
    // Continue redirect regardless
  }
  window.location.href = '/signin';
}

function showToast(message, type) {
  type = type || 'info';
  var container = document.getElementById('toast-container');
  if (!container) return;

  var toast = document.createElement('div');
  var bgColor =
    type === 'success'
      ? 'background:#16a34a'
      : type === 'error'
        ? 'background:#E30613'
        : 'background:#374151';

  toast.setAttribute('style', bgColor + '; color:#fff; font-size:0.875rem; padding:0.625rem 1rem; border-radius:0.5rem; box-shadow:0 10px 15px -3px rgba(0,0,0,0.3); transform:translateX(120%); transition:transform 0.3s ease; white-space:nowrap;');
  toast.textContent = message;
  container.appendChild(toast);

  // Slide in
  requestAnimationFrame(function () {
    toast.style.transform = 'translateX(0)';
  });

  // Slide out and remove
  setTimeout(function () {
    toast.style.transform = 'translateX(120%)';
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3000);
}

function escapeHtml(text) {
  if (!text) return '';
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}