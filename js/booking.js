import { supabase } from './supabase.js';
import { getCurrentUser } from './auth.js';
import { getSettings } from './settings.js';
import { showToast } from './modal.js';

let pages = [];
let bookings = [];
let initialized = false;

function mapPage(row) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    ownerName: row.owner_name,
    duration: Number(row.duration_minutes),
    timezone: row.timezone,
    availability: row.availability || { weekdays: [1, 2, 3, 4, 5], start: '09:00', end: '17:00' },
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapBooking(row) {
  return {
    id: row.id,
    pageId: row.booking_page_id,
    guestName: row.guest_name,
    guestEmail: row.guest_email,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    notes: row.notes,
    status: row.status
  };
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function publicUrl(slug) {
  const url = new URL(window.location.origin);
  url.searchParams.set('book', slug);
  return url.toString();
}

function formatDateTime(value, timezone = getSettings().timezone) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: timezone
  }).format(new Date(value));
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const input = document.createElement('input');
    input.value = value;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand('copy');
    input.remove();
    return copied;
  }
}

export function isPublicBookingRoute() {
  return Boolean(new URLSearchParams(window.location.search).get('book'));
}

export async function loadBookingData() {
  const user = getCurrentUser();
  if (!user || !supabase) {
    pages = [];
    bookings = [];
    renderBookingData();
    return;
  }

  const { data: pageRows, error: pageError } = await supabase
    .from('time_tasks_booking_pages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (pageError) {
    console.error('Erro ao carregar páginas de agendamento:', pageError);
    showToast('Não foi possível carregar as páginas de agendamento', 'error');
    return;
  }

  pages = pageRows.map(mapPage);
  if (pages.length) {
    const { data: bookingRows, error: bookingError } = await supabase
      .from('time_tasks_bookings')
      .select('*')
      .in('booking_page_id', pages.map(page => page.id))
      .order('starts_at', { ascending: true });
    if (bookingError) {
      console.error('Erro ao carregar reservas:', bookingError);
      bookings = [];
    } else {
      bookings = bookingRows.map(mapBooking);
    }
  } else {
    bookings = [];
  }
  renderBookingData();
}

function pageCard(page, compact = false) {
  const card = document.createElement(compact ? 'button' : 'article');
  card.className = compact ? 'booking-sidebar-item' : 'feature-card';
  if (compact) card.type = 'button';

  const main = document.createElement('div');
  main.className = 'feature-card__main';
  const title = document.createElement(compact ? 'strong' : 'h3');
  title.className = compact ? '' : 'feature-card__title';
  title.textContent = page.title;
  const meta = document.createElement('p');
  meta.className = 'feature-card__meta';
  meta.textContent = `${page.duration} min · ${page.active ? 'Ativa' : 'Pausada'}`;
  main.append(title, meta);

  if (compact) {
    card.appendChild(main);
    card.addEventListener('click', () => openBookingModal(page.id));
    return card;
  }

  const actions = document.createElement('div');
  actions.className = 'feature-card__actions';
  const copy = document.createElement('button');
  copy.className = 'btn-secondary';
  copy.type = 'button';
  copy.textContent = 'Copiar link';
  copy.addEventListener('click', async () => {
    const copied = await copyText(publicUrl(page.slug));
    showToast(copied ? 'Link copiado' : 'Não foi possível copiar o link', copied ? 'success' : 'error');
  });
  const toggle = document.createElement('button');
  toggle.className = 'btn-secondary';
  toggle.type = 'button';
  toggle.textContent = page.active ? 'Pausar' : 'Ativar';
  toggle.addEventListener('click', () => void updatePage(page.id, { active: !page.active }));
  const edit = document.createElement('button');
  edit.className = 'btn-secondary';
  edit.type = 'button';
  edit.textContent = 'Editar';
  edit.addEventListener('click', () => openBookingModal(page.id));
  actions.append(copy, toggle, edit);
  card.append(main, actions);
  return card;
}

function bookingCard(booking) {
  const page = pages.find(item => item.id === booking.pageId);
  const card = document.createElement('article');
  card.className = 'feature-card';
  const main = document.createElement('div');
  main.className = 'feature-card__main';
  const title = document.createElement('h3');
  title.className = 'feature-card__title';
  title.textContent = booking.guestName;
  const meta = document.createElement('p');
  meta.className = 'feature-card__meta';
  meta.textContent = `${formatDateTime(booking.startsAt, page?.timezone)} · ${page?.title || 'Agendamento'} · ${booking.guestEmail}`;
  main.append(title, meta);
  if (booking.notes) {
    const notes = document.createElement('p');
    notes.className = 'muted';
    notes.textContent = booking.notes;
    main.appendChild(notes);
  }
  const actions = document.createElement('div');
  actions.className = 'feature-card__actions';
  const status = document.createElement('span');
  status.className = booking.status === 'confirmed' ? 'connected-status' : 'unavailable-status';
  status.textContent = booking.status === 'confirmed' ? 'CONFIRMADA' : 'CANCELADA';
  actions.appendChild(status);
  if (booking.status === 'confirmed') {
    const cancel = document.createElement('button');
    cancel.className = 'btn-secondary';
    cancel.type = 'button';
    cancel.textContent = 'Cancelar';
    cancel.addEventListener('click', () => void cancelBooking(booking.id));
    actions.appendChild(cancel);
  }
  card.append(main, actions);
  return card;
}

export function renderBookingData() {
  const sidebar = document.getElementById('booking-sidebar-list');
  const pageList = document.getElementById('booking-pages-list');
  const bookingList = document.getElementById('bookings-list');
  if (sidebar) {
    sidebar.innerHTML = '';
    pages.forEach(page => sidebar.appendChild(pageCard(page, true)));
    if (!pages.length) {
      const empty = document.createElement('p');
      empty.className = 'sidebar__empty-text';
      empty.textContent = 'Nenhuma página criada.';
      sidebar.appendChild(empty);
    }
  }
  if (pageList) {
    pageList.innerHTML = '';
    pages.forEach(page => pageList.appendChild(pageCard(page)));
  }
  if (bookingList) {
    bookingList.innerHTML = '';
    bookings.forEach(booking => bookingList.appendChild(bookingCard(booking)));
  }
  const pagesEmpty = document.getElementById('booking-pages-empty');
  const bookingsEmpty = document.getElementById('bookings-empty');
  if (pagesEmpty) pagesEmpty.hidden = pages.length > 0;
  if (bookingsEmpty) bookingsEmpty.hidden = bookings.length > 0;
}

function openBookingModal(pageId = null) {
  const page = pageId ? pages.find(item => item.id === pageId) : null;
  const overlay = document.getElementById('booking-modal');
  document.getElementById('booking-modal-title').textContent = page ? 'Editar página de agendamento' : 'Nova página de agendamento';
  document.getElementById('booking-id').value = page?.id || '';
  document.getElementById('booking-title').value = page?.title || '';
  document.getElementById('booking-slug').value = page?.slug || '';
  document.getElementById('booking-duration').value = String(page?.duration || 30);
  document.getElementById('booking-start').value = page?.availability?.start || '09:00';
  document.getElementById('booking-end').value = page?.availability?.end || '17:00';
  document.getElementById('booking-description').value = page?.description || '';
  document.querySelectorAll('[name="booking-weekday"]').forEach(input => {
    input.checked = (page?.availability?.weekdays || [1, 2, 3, 4, 5]).includes(Number(input.value));
  });
  document.getElementById('btn-delete-booking-page').hidden = !page;
  overlay.classList.add('modal-overlay--visible');
  overlay.setAttribute('aria-hidden', 'false');
  setTimeout(() => document.getElementById('booking-title')?.focus(), 50);
}

function closeBookingModal() {
  const overlay = document.getElementById('booking-modal');
  overlay.classList.remove('modal-overlay--visible');
  overlay.setAttribute('aria-hidden', 'true');
}

async function savePage(formData, id = null) {
  const user = getCurrentUser();
  if (!user || !supabase) return null;
  const settings = getSettings();
  const payload = {
    user_id: user.id,
    title: formData.title,
    slug: formData.slug,
    description: formData.description,
    owner_name: settings.displayName || user.email?.split('@')[0] || 'Time Tasks',
    duration_minutes: formData.duration,
    timezone: settings.timezone,
    availability: formData.availability,
    updated_at: new Date().toISOString()
  };
  const query = id
    ? supabase.from('time_tasks_booking_pages').update(payload).eq('id', id)
    : supabase.from('time_tasks_booking_pages').insert(payload);
  const { data, error } = await query.select().single();
  if (error) {
    console.error('Erro ao salvar página:', error);
    showToast(error.code === '23505' ? 'Este identificador de link já está em uso' : 'Não foi possível salvar a página', 'error');
    return null;
  }
  await loadBookingData();
  return mapPage(data);
}

async function updatePage(id, patch) {
  const { error } = await supabase
    .from('time_tasks_booking_pages')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return showToast('Não foi possível atualizar a página', 'error');
  await loadBookingData();
  showToast('Página atualizada', 'success');
}

async function deletePage(id) {
  const { error } = await supabase.from('time_tasks_booking_pages').delete().eq('id', id);
  if (error) return false;
  await loadBookingData();
  return true;
}

async function cancelBooking(id) {
  const { error } = await supabase
    .from('time_tasks_bookings')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return showToast('Não foi possível cancelar a reserva', 'error');
  await loadBookingData();
  showToast('Reserva cancelada', 'success');
}

function dateKeyInZone(timezone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function zonedDateTimeToIso(dateKey, time, timezone) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const assumed = Date.UTC(year, month - 1, day, hour, minute);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  });
  const parts = Object.fromEntries(formatter.formatToParts(new Date(assumed))
    .filter(part => part.type !== 'literal')
    .map(part => [part.type, part.value]));
  const represented = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour), Number(parts.minute), Number(parts.second)
  );
  return new Date(assumed - (represented - assumed)).toISOString();
}

function publicDates(page) {
  const startKey = dateKeyInZone(page.timezone);
  const [year, month, day] = startKey.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1, day));
  const weekdays = page.availability.weekdays.map(Number);
  const dates = [];
  for (let index = 0; index < 45 && dates.length < 20; index += 1) {
    const date = new Date(start.getTime() + index * 86_400_000);
    if (!weekdays.includes(date.getUTCDay())) continue;
    const key = date.toISOString().slice(0, 10);
    dates.push({
      key,
      label: new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeZone: 'UTC' }).format(date)
    });
  }
  return dates;
}

function publicTimes(page) {
  const [startHour, startMinute] = page.availability.start.split(':').map(Number);
  const [endHour, endMinute] = page.availability.end.split(':').map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  const times = [];
  for (let value = start; value + page.duration <= end; value += page.duration) {
    times.push(`${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`);
  }
  return times;
}

async function loadPublicBooking() {
  const slug = new URLSearchParams(window.location.search).get('book');
  const overlay = document.getElementById('public-booking-overlay');
  const loading = document.getElementById('public-booking-loading');
  const content = document.getElementById('public-booking-content');
  document.body.classList.add('public-booking-mode');
  document.getElementById('auth-overlay').style.display = 'none';
  document.querySelector('.app-layout').style.display = 'none';
  document.getElementById('loading-overlay')?.remove();
  overlay.hidden = false;

  if (!supabase) {
    loading.textContent = 'Serviço de agendamento indisponível.';
    return;
  }
  const { data, error } = await supabase
    .from('time_tasks_booking_pages')
    .select('id,title,slug,description,owner_name,duration_minutes,timezone,availability,active')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle();
  if (error || !data) {
    loading.textContent = 'Esta página não existe ou está pausada.';
    return;
  }
  const page = mapPage(data);
  document.getElementById('public-booking-title').textContent = page.title;
  document.getElementById('public-booking-description').textContent = page.description || `Agende um horário com ${page.ownerName}.`;
  document.getElementById('public-booking-meta').textContent = `${page.duration} minutos · ${page.timezone}`;
  const dateSelect = document.getElementById('guest-date');
  const timeSelect = document.getElementById('guest-time');
  dateSelect.innerHTML = publicDates(page).map(date => `<option value="${date.key}">${date.label}</option>`).join('');
  timeSelect.innerHTML = publicTimes(page).map(time => `<option value="${time}">${time}</option>`).join('');
  loading.hidden = true;
  content.hidden = false;

  document.getElementById('public-booking-form').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const feedback = document.getElementById('public-booking-feedback');
    const submit = form.querySelector('button[type="submit"]');
    feedback.textContent = '';
    submit.disabled = true;
    const startsAt = zonedDateTimeToIso(dateSelect.value, timeSelect.value, page.timezone);
    const endsAt = new Date(new Date(startsAt).getTime() + page.duration * 60_000).toISOString();
    const payload = {
      booking_page_id: page.id,
      guest_name: document.getElementById('guest-name').value.trim(),
      guest_email: document.getElementById('guest-email').value.trim().toLowerCase(),
      starts_at: startsAt,
      ends_at: endsAt,
      notes: document.getElementById('guest-notes').value.trim()
    };
    const { error: insertError } = await supabase.from('time_tasks_bookings').insert(payload);
    submit.disabled = false;
    if (insertError) {
      feedback.textContent = insertError.code === '23505'
        ? 'Este horário acabou de ser reservado. Escolha outro horário.'
        : 'Não foi possível confirmar. Revise os dados e tente novamente.';
      feedback.className = 'form-feedback form-feedback--error';
      return;
    }
    form.reset();
    dateSelect.innerHTML = publicDates(page).map(date => `<option value="${date.key}">${date.label}</option>`).join('');
    timeSelect.innerHTML = publicTimes(page).map(time => `<option value="${time}">${time}</option>`).join('');
    feedback.textContent = 'Agendamento confirmado. Você já pode fechar esta página.';
    feedback.className = 'form-feedback form-feedback--success';
  });
}

export function initBooking() {
  if (initialized) return;
  initialized = true;
  if (isPublicBookingRoute()) {
    void loadPublicBooking();
    return;
  }
  ['btn-new-booking', 'btn-new-booking-sidebar'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => openBookingModal());
  });
  document.getElementById('booking-modal-close')?.addEventListener('click', closeBookingModal);
  document.getElementById('booking-cancel')?.addEventListener('click', closeBookingModal);
  document.getElementById('booking-modal')?.addEventListener('click', event => {
    if (event.target.id === 'booking-modal') closeBookingModal();
  });
  document.getElementById('booking-title')?.addEventListener('input', event => {
    const slugInput = document.getElementById('booking-slug');
    if (!document.getElementById('booking-id').value && !slugInput.dataset.edited) {
      slugInput.value = slugify(event.target.value);
    }
  });
  document.getElementById('booking-slug')?.addEventListener('input', event => {
    event.target.dataset.edited = event.target.value ? 'true' : '';
    event.target.value = slugify(event.target.value);
  });
  document.getElementById('booking-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const id = document.getElementById('booking-id').value || null;
    const weekdays = [...document.querySelectorAll('[name="booking-weekday"]:checked')].map(input => Number(input.value));
    const start = document.getElementById('booking-start').value;
    const end = document.getElementById('booking-end').value;
    if (!weekdays.length || end <= start) return showToast('Revise os dias e o intervalo de disponibilidade', 'error');
    const saved = await savePage({
      title: document.getElementById('booking-title').value.trim(),
      slug: slugify(document.getElementById('booking-slug').value),
      duration: Number(document.getElementById('booking-duration').value),
      description: document.getElementById('booking-description').value.trim(),
      availability: { weekdays, start, end }
    }, id);
    if (!saved) return;
    closeBookingModal();
    showToast(id ? 'Página atualizada' : 'Página criada', 'success');
  });
  document.getElementById('btn-delete-booking-page')?.addEventListener('click', async () => {
    const id = document.getElementById('booking-id').value;
    if (id && await deletePage(id)) {
      closeBookingModal();
      showToast('Página excluída', 'success');
    }
  });
  document.addEventListener('timetasks:session', event => {
    if (event.detail?.user) void loadBookingData();
    else {
      pages = [];
      bookings = [];
      renderBookingData();
    }
  });
}
