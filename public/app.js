let allSkills = [];
let favorites = [];
let currentTag = '全部';
let showFavoritesOnly = false;
let searchQuery = '';
let focusedCardIndex = -1;
let allCards = [];

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

// 防抖
function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

async function loadSkills() {
  const res = await fetch('/api/skills');
  allSkills = await res.json();
}

async function loadFavorites() {
  const res = await fetch('/api/favorites');
  favorites = await res.json();
}

async function toggleFavorite(name) {
  const isFav = favorites.includes(name);
  const method = isFav ? 'DELETE' : 'POST';
  const url = isFav ? `/api/favorites/${encodeURIComponent(name)}` : '/api/favorites';

  await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: isFav ? null : JSON.stringify({ name }),
  });

  await loadFavorites();
  render();
}

async function copyCommand(name) {
  const cmd = `/${name}`;
  try {
    await navigator.clipboard.writeText(cmd);
    showToast('已复制 ' + cmd);
  } catch {
    showToast('复制失败');
  }
}

function showToast(msg) {
  const toast = $('#toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1500);
}

// 高亮搜索匹配文字
function highlight(text, query) {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
}

function getTagCounts() {
  const counts = { '全部': allSkills.length };
  for (const skill of allSkills) {
    for (const tag of skill.tags) {
      counts[tag] = (counts[tag] || 0) + 1;
    }
  }
  return counts;
}

function filteredSkills() {
  let skills = allSkills;
  if (showFavoritesOnly) {
    skills = skills.filter(s => favorites.includes(s.name));
  } else if (currentTag !== '全部') {
    skills = skills.filter(s => s.tags.includes(currentTag));
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    skills = skills.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q)
    );
  }
  return skills;
}

function renderStats() {
  const invocableCount = allSkills.filter(s => s.invocable).length;
  const favCount = favorites.length;
  $('#headerStats').innerHTML = `
    <span class="stat-item">共 <strong>${allSkills.length}</strong> 个</span>
    <span class="stat-sep">·</span>
    <span class="stat-item"><span class="invocable-dot"></span><strong>${invocableCount}</strong> 可调用</span>
    <span class="stat-sep">·</span>
    <span class="stat-item"><span class="fav-dot"></span><strong>${favCount}</strong> 收藏</span>
  `;
}

function renderTagBar() {
  const counts = getTagCounts();
  const favCount = favorites.length;
  const tags = Object.keys(counts).sort((a, b) => {
    if (a === '全部') return -1;
    if (b === '全部') return 1;
    return counts[b] - counts[a];
  });

  const allTags = [{ name: '收藏', count: favCount, isFav: true }, ...tags.map(t => ({ name: t, count: counts[t], isFav: false }))];

  $('#tagList').innerHTML = allTags.map(t => `
    <button class="tag-btn${t.isFav ? ' fav-tag' : ''}${!t.isFav && t.name === currentTag ? ' active' : ''}${t.isFav && showFavoritesOnly ? ' active' : ''}" data-tag="${t.name}" data-fav="${t.isFav}">
      ${t.name === '收藏' ? '★ ' : ''}${t.name} ${t.count}
    </button>
  `).join('');

  $$('.tag-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.fav === 'true') {
        showFavoritesOnly = !showFavoritesOnly;
        currentTag = '全部';
      } else {
        showFavoritesOnly = false;
        currentTag = btn.dataset.tag;
      }
      focusedCardIndex = -1;
      renderTagBar();
      renderSkills();
    });
  });
}

function makeCard(skill, index = 0) {
  const isFav = favorites.includes(skill.name);
  const isLong = (skill.description || '').length > 100;
  const delay = Math.min(index * 40, 400);

  return `
    <div class="skill-card" data-name="${skill.name}" role="button" tabindex="0" aria-label="查看 ${skill.name} 详情" style="animation-delay: ${delay}ms">
      <div class="card-header">
        <span class="card-name">${highlight(skill.name, searchQuery)}</span>
        <button class="fav-btn${isFav ? ' active' : ''}" data-name="${skill.name}" aria-label="${isFav ? '取消收藏' : '添加收藏'}" title="${isFav ? '取消收藏' : '添加收藏'}">${isFav ? '★' : '☆'}</button>
      </div>
      <div class="card-meta">
        <span class="version">v${skill.version}</span>
        ${skill.invocable ? '<span class="invocable-badge">/调用</span>' : ''}
      </div>
      <div class="tags">${skill.tags.map(t => `<span class="tag tag-${t.toLowerCase()}">${t}</span>`).join('')}</div>
      <div class="card-desc${isLong ? ' expandable' : ''}">${highlight(skill.description || '暂无描述', searchQuery)}</div>
      <div class="card-actions">
        <button class="copy-btn" data-name="${skill.name}">复制 /${skill.name}</button>
        ${isLong ? `<button class="expand-btn" data-name="${skill.name}">展开</button>` : ''}
        <button class="detail-btn" data-name="${skill.name}">详情</button>
      </div>
    </div>
  `;
}

function renderSkills() {
  const skills = filteredSkills();
  const favSkills = skills.filter(s => favorites.includes(s.name));

  $('#totalCount').textContent = skills.length;
  $('#favCount').textContent = favorites.length;

  const favSection = $('#favoritesSection');
  if (showFavoritesOnly) {
    favSection.style.display = 'none';
    if (skills.length > 0) {
      $('#skillsGrid').innerHTML = skills.map((s, i) => makeCard(s, i)).join('');
    } else {
      $('#skillsGrid').innerHTML = '<div class="empty-state">还没有收藏任何技能</div>';
    }
  } else {
    if (favSkills.length > 0) {
      favSection.style.display = '';
      $('#favoritesGrid').innerHTML = favSkills.map((s, i) => makeCard(s, i)).join('');
    } else {
      favSection.style.display = 'none';
    }

    const nonFav = skills.filter(s => !favorites.includes(s.name));
    if (nonFav.length > 0) {
      $('#skillsGrid').innerHTML = nonFav.map((s, i) => makeCard(s, i)).join('');
    } else if (favSkills.length === 0) {
      $('#skillsGrid').innerHTML = '<div class="empty-state">没有找到匹配的技能</div>';
    }
  }

  allCards = $$('.skill-card');
  attachCardEvents();
}

function attachCardEvents() {
  // favorite buttons
  $$('.fav-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      toggleFavorite(btn.dataset.name);
    });
  });

  // copy buttons（排除 modal 里的 copy 按钮，避免重复绑定）
  $$('.copy-btn').forEach(btn => {
    if (btn.id === 'modalCopy') return; // modal 按钮由独立 handler 处理
    btn.addEventListener('click', e => {
      e.stopPropagation();
      copyCommand(btn.dataset.name);
      btn.textContent = '已复制 ✓';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = `复制 /${btn.dataset.name}`;
        btn.classList.remove('copied');
      }, 1200);
    });
  });

  // expand buttons
  $$('.expand-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const card = btn.closest('.skill-card');
      const desc = card.querySelector('.card-desc');
      const isExp = desc.classList.toggle('expanded');
      btn.textContent = isExp ? '收起' : '展开';
    });
  });

  // detail buttons — open modal
  $$('.detail-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openModal(btn.dataset.name);
    });
  });

  // card click — open modal
  allCards.forEach(card => {
    card.addEventListener('click', () => openModal(card.dataset.name));
    // Keyboard activation for div[role="button"]
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(card.dataset.name);
      }
    });
  });
}

// --- 详情弹窗 ---
let currentSkillName = '';

function openModal(name) {
  currentSkillName = name;
  const skill = allSkills.find(s => s.name === name);
  if (!skill) return;

  $('#modalName').textContent = skill.name;
  $('#modalVersion').textContent = `v${skill.version}`;
  $('#modalInvocable').style.display = skill.invocable ? '' : 'none';
  $('#modalCopy').dataset.skill = skill.name;
  $('#modalCopy').textContent = `复制 /${skill.name}`;

  let meta = skill.tags.map(t => `<span class="tag tag-${t.toLowerCase()}">${t}</span>`).join('');
  $('#modalMeta').innerHTML = meta;

  $('#modalDesc').innerHTML = skill.description || '暂无描述';
  $('#modalRaw').style.display = 'none';
  $('#modalRawBtn').textContent = '查看源码';

  $('#modalOverlay').classList.add('show');
  document.body.style.overflow = 'hidden';

  // 加载 raw content
  fetch(`/api/skills/${encodeURIComponent(name)}`)
    .then(r => r.json())
    .then(data => {
      if (data.rawContent) {
        $('#modalRawContent').textContent = data.rawContent;
      }
    });

}

function closeModal() {
  $('#modalOverlay').classList.remove('show');
  document.body.style.overflow = '';
  currentSkillName = '';
  if (document.activeElement && document.activeElement.blur) {
    document.activeElement.blur();
  }
}

// Modal events
$('#modalClose').addEventListener('click', closeModal);
// use capture phase so clicking inside (e.g. copy button) doesn't trigger closeModal
// before the inner button's handler reads currentSkillName
$('#modalOverlay').addEventListener('click', e => {
  if (e.target === $('#modalOverlay')) closeModal();
}, { capture: true });

// Focus trap
$('#modalOverlay').addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  const modal = $('#skillModal');
  const focusable = modal.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey) {
    if (document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

$('#modalCopy').addEventListener('click', () => {
  const btn = $('#modalCopy');
  const name = btn.dataset.skill || '';
  if (!name) return;
  copyCommand(name);
  btn.setAttribute('aria-label', '已复制 ✓');
  btn.classList.add('copied');
  btn.textContent = '已复制 ✓';
  setTimeout(() => {
    btn.classList.remove('copied');
    btn.textContent = `复制 /${name}`;
    btn.setAttribute('aria-label', `复制 /${name}`);
  }, 1200);
});

$('#modalRawBtn').addEventListener('click', () => {
  const raw = $('#modalRaw');
  if (raw.style.display === 'none') {
    raw.style.display = 'block';
    $('#modalRawBtn').textContent = '收起源码';
  } else {
    raw.style.display = 'none';
    $('#modalRawBtn').textContent = '查看源码';
  }
});

// --- 键盘导航 ---
document.addEventListener('keydown', e => {
  const modal = $('#modalOverlay');

  if (e.key === 'Escape') {
    if (modal.classList.contains('show')) {
      closeModal();
    } else if (searchQuery) {
      searchQuery = '';
      $('#searchInput').value = '';
      focusedCardIndex = -1;
      renderSkills();
    } else if (showFavoritesOnly || currentTag !== '全部') {
      showFavoritesOnly = false;
      currentTag = '全部';
      focusedCardIndex = -1;
      renderTagBar();
      renderSkills();
    }
    return;
  }

  if (e.key === '/' && !modal.classList.contains('show')) {
    e.preventDefault();
    $('#searchInput').focus();
    return;
  }

  if (document.activeElement !== $('#searchInput')) {
    const skills = filteredSkills();
    if (!skills.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusedCardIndex = Math.min(focusedCardIndex + 1, allCards.length - 1);
      allCards[focusedCardIndex]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (focusedCardIndex <= 0) {
        // 已到顶部，跳回搜索框
        focusedCardIndex = -1;
        $('#searchInput').focus();
        return;
      }
      focusedCardIndex = Math.max(focusedCardIndex - 1, 0);
      allCards[focusedCardIndex]?.focus();
    } else if (e.key === 'Enter' && focusedCardIndex >= 0) {
      const name = allCards[focusedCardIndex]?.dataset.name;
      if (name) openModal(name);
    }
  }
});

function render() {
  renderStats();
  renderTagBar();
  renderSkills();
}

const debouncedSearch = debounce(() => {
  focusedCardIndex = -1;
  renderSkills();
}, 200);

$('#searchInput').addEventListener('input', e => {
  searchQuery = e.target.value;
  debouncedSearch();
});

(async () => {
  try {
    await Promise.all([loadSkills(), loadFavorites()]);
  } catch (err) {
    showToast('加载失败，请刷新重试');
  }
  $('#loadingScreen').classList.add('hidden');
  render();
})();
