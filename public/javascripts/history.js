var currentUser = null;
var plans = [];
var currentFilter = 'all';

document.addEventListener('DOMContentLoaded', init);

async function init() {
  lucide.createIcons();
  setupFilters();
  setupUserMenu();
  setupModalClose();
  await checkAuth();
  await loadPlans();
}

async function checkAuth() {
  try {
    var res = await fetch('/api/me');
    var data = await res.json();
    if (data.success) {
      currentUser = data.user;
      updateUserUI();
    } else {
      window.location.href = '/signin';
    }
  } catch {
    window.location.href = '/signin';
  }
}

function updateUserUI() {
  if (!currentUser) return;
  var initial = (currentUser.username || 'U').charAt(0).toUpperCase();
  var avatarEl = document.getElementById('user-avatar');
  var nameEl = document.getElementById('user-name');
  var dropNameEl = document.getElementById('dropdown-name');
  var dropEmailEl = document.getElementById('dropdown-email');

  if (avatarEl) avatarEl.textContent = initial;
  if (nameEl) nameEl.textContent = currentUser.username;
  if (dropNameEl) dropNameEl.textContent = currentUser.username;
  if (dropEmailEl) dropEmailEl.textContent = currentUser.email;
}

function setupFilters() {
  var btns = document.querySelectorAll('.filter-btn');
  btns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      btns.forEach(function (b) {
        b.classList.remove('active-filter');
        b.style.borderColor = '';
        b.style.background = '';
        b.style.color = '';
      });
      btn.classList.add('active-filter');
      currentFilter = btn.dataset.filter;
      renderPlans();
    });
  });
}

async function loadPlans() {
  try {
    var res = await fetch('/api/plans');
    var data = await res.json();
    if (data.success) {
      plans = data.plans;
      renderPlans();
    } else {
      showToast('Failed to load plans.', 'error');
    }
  } catch {
    showToast('Network error.', 'error');
  }
}

function renderPlans() {
  var container = document.getElementById('plans-list');
  var emptyState = document.getElementById('empty-state');
  if (!container || !emptyState) return;

  var filtered =
    currentFilter === 'all'
      ? plans
      : plans.filter(function (p) {
          return p.type === currentFilter;
        });

  if (filtered.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  container.innerHTML = filtered
    .map(function (plan) {
      return (
        '<div class="plan-card" onclick="viewPlan(\'' +
        plan._id +
        '\')">' +
        '<div class="flex items-start justify-between mb-3">' +
        '<div><span class="type-badge ' +
        plan.type +
        '">' +
        plan.type +
        '</span></div>' +
        '<div class="flex items-center gap-3">' +
        '<span class="text-xs text-gray-600">' +
        formatDate(plan.createdAt) +
        '</span>' +
        '<button onclick="event.stopPropagation(); deletePlan(\'' +
        plan._id +
        '\')" class="p-1.5 rounded-md hover:bg-white/5 text-gray-600 hover:text-[#E30613] transition-colors" title="Delete">' +
        '<i data-lucide="trash-2" class="w-3.5 h-3.5"></i>' +
        '</button>' +
        '</div>' +
        '</div>' +
        '<h3 class="text-sm font-medium text-white mb-1">' +
        escapeHtml(plan.topic) +
        '</h3>' +
        '<p class="text-xs text-gray-500">' +
        escapeHtml(plan.subject) +
        ' &middot; ' +
        escapeHtml(plan.level) +
        '</p>' +
        '</div>'
      );
    })
    .join('');

  if (window.lucide) lucide.createIcons();
}

async function viewPlan(id) {
  var modal = document.getElementById('plan-modal');
  var modalContent = document.getElementById('modal-content');
  var modalTitle = document.getElementById('modal-title');
  if (!modal || !modalContent) return;

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  modalContent.innerHTML =
    '<div class="flex items-center justify-center py-20">' +
    '<svg class="animate-spin h-6 w-6 text-[#E30613]" viewBox="0 0 24 24">' +
    '<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>' +
    '<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>' +
    '</svg></div>';

  try {
    var res = await fetch('/api/plans/' + id);
    var data = await res.json();

    if (data.success) {
      var plan = data.plan;
      var typeLabels = { plan: 'Tutoring Plan', quiz: 'Quiz', explanation: 'Explanation' };
      if (modalTitle) modalTitle.textContent = typeLabels[plan.type] || 'Plan Details';
      modalContent.innerHTML = renderModalContent(plan.content, plan.type);
      if (window.lucide) lucide.createIcons();
    } else {
      modalContent.innerHTML =
        '<p class="text-gray-400 text-center py-10">Failed to load plan.</p>';
    }
  } catch {
    modalContent.innerHTML =
      '<p class="text-gray-400 text-center py-10">Network error.</p>';
  }
}

function renderModalContent(content, type) {
  if (type === 'quiz') return renderQuiz(content);
  if (type === 'explanation') return renderExplanation(content);
  return renderPlan(content);
}

function renderPlan(content) {
  var html = '';
  if (content.title) {
    html += '<h2 class="font-[Oswald] text-xl font-medium mb-4">' + escapeHtml(content.title) + '</h2>';
  }
  if (content.summary) {
    html += '<div class="result-section mb-4"><h3>Summary</h3><p>' + escapeHtml(content.summary) + '</p></div>';
  }
  if (content.sections && content.sections.length) {
    content.sections.forEach(function (s, i) {
      html += '<div class="result-section mb-4">';
      html += '<div class="flex items-center gap-3 mb-3">';
      html += '<div class="w-7 h-7 rounded-lg bg-[#E30613]/10 flex items-center justify-center text-[#E30613] text-xs font-medium shrink-0">' + (s.week || i + 1) + '</div>';
      html += '<h3 style="margin-bottom:0;font-size:0.9rem">' + escapeHtml(s.title) + '</h3>';
      html += '</div>';
      if (s.objectives && s.objectives.length) {
        html += '<ul class="mb-3">' + s.objectives.map(function (o) { return '<li>' + escapeHtml(o) + '</li>'; }).join('') + '</ul>';
      }
      if (s.activities && s.activities.length) {
        html += '<ul class="mb-3">' + s.activities.map(function (a) { return '<li>' + escapeHtml(a) + '</li>'; }).join('') + '</ul>';
      }
      if (s.resources && s.resources.length) {
        html += '<ul class="mb-3">' + s.resources.map(function (r) { return '<li>' + escapeHtml(r) + '</li>'; }).join('') + '</ul>';
      }
      if (s.assessment) {
        html += '<p class="text-sm">' + escapeHtml(s.assessment) + '</p>';
      }
      html += '</div>';
    });
  }
  if (content.tips && content.tips.length) {
    html += '<div class="result-section"><h3>Study Tips</h3><ul>' + content.tips.map(function (t) { return '<li>' + escapeHtml(t) + '</li>'; }).join('') + '</ul></div>';
  }
  return html;
}

function renderQuiz(content) {
  var html = '';
  if (content.title) {
    html += '<h2 class="font-[Oswald] text-xl font-medium mb-4">' + escapeHtml(content.title) + '</h2>';
  }
  if (content.questions && content.questions.length) {
    content.questions.forEach(function (q, i) {
      html += '<div class="result-section mb-4">';
      html += '<p class="text-sm font-medium text-white mb-3">Question ' + (i + 1) + '</p>';
      html += '<p class="mb-3">' + escapeHtml(q.question) + '</p>';
      html += '<div class="space-y-2 mb-3">';
      if (q.options) {
        q.options.forEach(function (opt) {
          html += '<div class="quiz-option ' + (opt === q.correct_answer ? 'correct' : '') + '">' + escapeHtml(opt) + '</div>';
        });
      }
      html += '</div>';
      if (q.explanation) {
        html += '<div class="quiz-explanation">' + escapeHtml(q.explanation) + '</div>';
      }
      html += '</div>';
    });
  }
  return html;
}

function renderExplanation(content) {
  var html = '';
  if (content.title) {
    html += '<h2 class="font-[Oswald] text-xl font-medium mb-4">' + escapeHtml(content.title) + '</h2>';
  }
  if (content.introduction) {
    html += '<div class="result-section mb-4"><h3>Introduction</h3><p>' + escapeHtml(content.introduction) + '</p></div>';
  }
  if (content.key_points && content.key_points.length) {
    html += '<div class="result-section mb-4"><h3>Key Points</h3><div class="space-y-3">';
    content.key_points.forEach(function (kp) {
      html += '<div class="key-point"><p class="point-title">' + escapeHtml(kp.point) + '</p><p class="point-detail">' + escapeHtml(kp.detail) + '</p></div>';
    });
    html += '</div></div>';
  }
  if (content.analogy) {
    html += '<div class="result-section mb-4"><h3>Analogy</h3><p>' + escapeHtml(content.analogy) + '</p></div>';
  }
  if (content.common_misconceptions && content.common_misconceptions.length) {
    html += '<div class="result-section mb-4"><h3>Common Misconceptions</h3><ul>' + content.common_misconceptions.map(function (m) { return '<li>' + escapeHtml(m) + '</li>'; }).join('') + '</ul></div>';
  }
  if (content.next_steps && content.next_steps.length) {
    html += '<div class="result-section"><h3>Next Steps</h3><ul>' + content.next_steps.map(function (s) { return '<li>' + escapeHtml(s) + '</li>'; }).join('') + '</ul></div>';
  }
  return html;
}

function closeModal() {
  var modal = document.getElementById('plan-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

function setupModalClose() {
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });
}

async function deletePlan(id) {
  if (!confirm('Delete this plan? This cannot be undone.')) return;

  try {
    var res = await fetch('/api/plans/' + id, { method: 'DELETE' });
    var data = await res.json();

    if (data.success) {
      plans = plans.filter(function (p) {
        return p._id !== id;
      });
      renderPlans();
      showToast('Plan deleted.', 'success');
    } else {
      showToast(data.message || 'Failed to delete.', 'error');
    }
  } catch {
    showToast('Network error.', 'error');
  }
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

  requestAnimationFrame(function () {
    toast.style.transform = 'translateX(0)';
  });

  setTimeout(function () {
    toast.style.transform = 'translateX(120%)';
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3000);
}

function formatDate(dateStr) {
  var d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function escapeHtml(text) {
  if (!text) return '';
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}