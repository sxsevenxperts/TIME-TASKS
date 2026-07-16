import { supabase } from './supabase.js';
import { getCurrentUser } from './auth.js';
import { showToast } from './modal.js';

let seeds = [];
let initialized = false;

function mapSeed(row) {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    dueAt: row.due_at,
    reminderAt: row.reminder_at,
    completed: row.completed,
    notifiedAt: row.notified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toLocalInput(value) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatDate(value) {
  if (!value) return 'Sem prazo';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

export function getSeeds() {
  return seeds;
}

export async function loadSeeds() {
  const user = getCurrentUser();
  if (!user || !supabase) {
    seeds = [];
    renderSeeds();
    return seeds;
  }
  const { data, error } = await supabase
    .from('time_tasks_seeds')
    .select('*')
    .eq('user_id', user.id)
    .order('completed', { ascending: true })
    .order('due_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Erro ao carregar tarefas:', error);
    showToast('Não foi possível carregar as tarefas', 'error');
    return [];
  }
  seeds = data.map(mapSeed);
  renderSeeds();
  document.dispatchEvent(new Event('timetasks:data'));
  return seeds;
}

export async function createSeed(seedData) {
  const user = getCurrentUser();
  if (!user || !supabase) return null;
  const title = String(seedData.title || '').trim();
  if (!title) return null;
  const payload = {
    user_id: user.id,
    title,
    notes: String(seedData.notes || '').trim(),
    due_at: seedData.dueAt || null,
    reminder_at: seedData.reminderAt || seedData.dueAt || null,
    completed: false,
    notified_at: null,
    updated_at: new Date().toISOString()
  };
  const { data, error } = await supabase.from('time_tasks_seeds').insert(payload).select().single();
  if (error) {
    console.error('Erro ao criar tarefa:', error);
    return null;
  }
  const saved = mapSeed(data);
  seeds.unshift(saved);
  renderSeeds();
  document.dispatchEvent(new Event('timetasks:data'));
  return saved;
}

async function updateSeed(id, patch) {
  const payload = {
    ...(patch.title !== undefined ? { title: String(patch.title).trim() } : {}),
    ...(patch.notes !== undefined ? { notes: String(patch.notes).trim() } : {}),
    ...(patch.dueAt !== undefined ? { due_at: patch.dueAt || null } : {}),
    ...(patch.reminderAt !== undefined ? { reminder_at: patch.reminderAt || null } : {}),
    ...(patch.completed !== undefined ? { completed: patch.completed } : {}),
    notified_at: null,
    updated_at: new Date().toISOString()
  };
  const { data, error } = await supabase.from('time_tasks_seeds').update(payload).eq('id', id).select().single();
  if (error) {
    console.error('Erro ao atualizar tarefa:', error);
    return null;
  }
  const index = seeds.findIndex(seed => seed.id === id);
  if (index >= 0) seeds[index] = mapSeed(data);
  renderSeeds();
  document.dispatchEvent(new Event('timetasks:data'));
  return index >= 0 ? seeds[index] : null;
}

async function deleteSeed(id) {
  const { error } = await supabase.from('time_tasks_seeds').delete().eq('id', id);
  if (error) return false;
  seeds = seeds.filter(seed => seed.id !== id);
  renderSeeds();
  document.dispatchEvent(new Event('timetasks:data'));
  return true;
}

export async function markSeedNotified(id) {
  const notifiedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('time_tasks_seeds')
    .update({ notified_at: notifiedAt, updated_at: notifiedAt })
    .eq('id', id)
    .is('notified_at', null)
    .select('id');
  if (error || !data?.length) return false;
  const seed = seeds.find(item => item.id === id);
  if (seed) seed.notifiedAt = notifiedAt;
  return true;
}

function createSeedCard(seed, compact = false) {
  if (compact) {
    const label = document.createElement('label');
    label.className = `seed-item ${seed.completed ? 'seed-completed' : ''}`;
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = seed.completed;
    check.addEventListener('change', () => updateSeed(seed.id, { completed: check.checked }));
    const content = document.createElement('span');
    content.className = 'seed-item__content';
    const title = document.createElement('span');
    title.className = 'seed-item__title';
    title.textContent = seed.title;
    const date = document.createElement('span');
    date.className = 'seed-item__date';
    date.textContent = formatDate(seed.dueAt);
    content.append(title, date);
    label.append(check, content);
    content.addEventListener('click', event => {
      event.preventDefault();
      openSeedModal(seed.id);
    });
    return label;
  }

  const card = document.createElement('article');
  card.className = `feature-card ${seed.completed ? 'seed-completed' : ''}`;
  const main = document.createElement('div');
  main.className = 'feature-card__main';
  const title = document.createElement('h3');
  title.className = 'feature-card__title';
  title.textContent = seed.title;
  const meta = document.createElement('p');
  meta.className = 'feature-card__meta';
  meta.textContent = `${formatDate(seed.dueAt)}${seed.reminderAt ? ` · lembrete ${formatDate(seed.reminderAt)}` : ''}`;
  main.append(title, meta);
  if (seed.notes) {
    const notes = document.createElement('p');
    notes.className = 'muted';
    notes.textContent = seed.notes;
    main.appendChild(notes);
  }
  const actions = document.createElement('div');
  actions.className = 'feature-card__actions';
  const complete = document.createElement('button');
  complete.className = 'btn-secondary';
  complete.type = 'button';
  complete.textContent = seed.completed ? 'Reabrir' : 'Concluir';
  complete.addEventListener('click', () => updateSeed(seed.id, { completed: !seed.completed }));
  const edit = document.createElement('button');
  edit.className = 'btn-secondary';
  edit.type = 'button';
  edit.textContent = 'Editar';
  edit.addEventListener('click', () => openSeedModal(seed.id));
  actions.append(complete, edit);
  card.append(main, actions);
  return card;
}

export function renderSeeds() {
  const sidebar = document.getElementById('seeds-sidebar-list');
  const main = document.getElementById('seeds-main-list');
  const empty = document.getElementById('seeds-empty');
  if (sidebar) {
    sidebar.innerHTML = '';
    seeds.filter(seed => !seed.completed).slice(0, 8).forEach(seed => sidebar.appendChild(createSeedCard(seed, true)));
    if (!sidebar.children.length) {
      const text = document.createElement('p');
      text.className = 'sidebar__empty-text';
      text.textContent = 'Nenhuma tarefa pendente.';
      sidebar.appendChild(text);
    }
  }
  if (main) {
    main.innerHTML = '';
    seeds.forEach(seed => main.appendChild(createSeedCard(seed)));
  }
  if (empty) empty.hidden = seeds.length > 0;
}

export function openSeedModal(seedId = null, prefill = {}) {
  const overlay = document.getElementById('seed-modal');
  const seed = seedId ? seeds.find(item => item.id === seedId) : null;
  document.getElementById('seed-modal-title').textContent = seed ? 'Editar tarefa' : 'Nova tarefa';
  document.getElementById('seed-id').value = seed?.id || '';
  document.getElementById('seed-title').value = seed?.title || prefill.title || '';
  document.getElementById('seed-due').value = toLocalInput(seed?.dueAt || prefill.dueAt);
  document.getElementById('seed-reminder').value = toLocalInput(seed?.reminderAt || prefill.reminderAt || prefill.dueAt);
  document.getElementById('seed-notes').value = seed?.notes || prefill.notes || '';
  document.getElementById('btn-delete-seed').hidden = !seed;
  overlay.classList.add('modal-overlay--visible');
  overlay.setAttribute('aria-hidden', 'false');
  setTimeout(() => document.getElementById('seed-title').focus(), 50);
}

function closeSeedModal() {
  const overlay = document.getElementById('seed-modal');
  overlay.classList.remove('modal-overlay--visible');
  overlay.setAttribute('aria-hidden', 'true');
}

export function initSeeds() {
  if (initialized) return;
  initialized = true;
  ['btn-new-seed', 'btn-new-seed-sidebar'].forEach(id => document.getElementById(id)?.addEventListener('click', () => openSeedModal()));
  document.getElementById('seed-modal-close')?.addEventListener('click', closeSeedModal);
  document.getElementById('seed-cancel')?.addEventListener('click', closeSeedModal);
  document.getElementById('seed-modal')?.addEventListener('click', event => {
    if (event.target.id === 'seed-modal') closeSeedModal();
  });
  document.getElementById('seed-due')?.addEventListener('change', event => {
    if (!document.getElementById('seed-reminder').value) document.getElementById('seed-reminder').value = event.target.value;
  });
  document.getElementById('seed-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const id = document.getElementById('seed-id').value;
    const dueValue = document.getElementById('seed-due').value;
    const reminderValue = document.getElementById('seed-reminder').value;
    const data = {
      title: document.getElementById('seed-title').value,
      notes: document.getElementById('seed-notes').value,
      dueAt: dueValue ? new Date(dueValue).toISOString() : null,
      reminderAt: reminderValue ? new Date(reminderValue).toISOString() : null
    };
    const saved = id ? await updateSeed(id, data) : await createSeed(data);
    if (!saved) return showToast('Não foi possível salvar a tarefa', 'error');
    closeSeedModal();
    showToast(id ? 'Tarefa atualizada' : 'Tarefa criada', 'success');
  });
  document.getElementById('btn-delete-seed')?.addEventListener('click', async () => {
    const id = document.getElementById('seed-id').value;
    if (id && await deleteSeed(id)) {
      closeSeedModal();
      showToast('Tarefa excluída', 'success');
    }
  });
  document.addEventListener('timetasks:session', event => {
    if (event.detail?.user) void loadSeeds();
    else {
      seeds = [];
      renderSeeds();
    }
  });
}
