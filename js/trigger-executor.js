// Trigger Executor — Fase 12.2
// Worker Node.js para executar triggers em cronograma
// Tipos: weather, summary, reminder
// Usa o fetch global do Node 22 — sem dependência externa.
// Fase 12.8: também varre lembretes de eventos/tarefas devidos e envia
// Web Push, para os avisos chegarem com o app fechado.

import { sendPushToUser } from './push-sender.js';

const DB_NOTIFICATION_TYPES = new Set(['trigger', 'reminder', 'verse', 'system']);
const DEFAULT_TIMEZONE = 'America/Fortaleza';

/**
 * Interpreta 'YYYY-MM-DD' + 'HH:MM' como horário de parede no fuso IANA dado
 * e devolve o instante UTC correspondente (mesma semântica do
 * zonedDateTimeToDate usado pelo cliente em reminders.js).
 */
function zonedDateTimeToUtc(dateStr, timeStr, timeZone) {
  const naive = new Date(`${dateStr}T${String(timeStr).slice(0, 5)}:00Z`);
  const offsetAt = (utcDate) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).formatToParts(utcDate);
    const get = (type) => Number(parts.find(part => part.type === type).value);
    return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second')) - utcDate.getTime();
  };
  // Duas iterações convergem inclusive perto de trocas de offset.
  let ts = naive.getTime() - offsetAt(naive);
  ts = naive.getTime() - offsetAt(new Date(ts));
  return new Date(ts);
}

export class TriggerExecutor {
  constructor(supabaseUrl, supabaseAnonKey, serviceRoleKey) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseAnonKey = supabaseAnonKey;
    this.serviceRoleKey = serviceRoleKey;
    this.isRunning = false;
    this.interval = null;
  }

  start(intervalMs = 60000) {
    // Executar a cada 1 minuto (verifcar se há triggers para executar)
    if (this.isRunning) return;
    this.isRunning = true;

    console.log('🎯 Trigger Executor iniciado (intervalo: ' + intervalMs + 'ms)');

    this.interval = setInterval(() => this.tick(), intervalMs);

    // Executar imediatamente na primeira vez
    this.tick();
  }

  tick() {
    this.checkAndExecuteTriggers();
    this.checkDueReminders();
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('⏹️  Trigger Executor parado');
  }

  async checkAndExecuteTriggers() {
    try {
      // Buscar triggers ativos que precisam rodar agora
      const triggers = await this.fetchActiveTriggers();

      for (const trigger of triggers) {
        const shouldExecute = this.shouldExecuteNow(trigger);
        if (!shouldExecute) continue;

        console.log(`⚡ Executando trigger: ${trigger.name} (${trigger.type})`);

        let result;
        switch (trigger.type) {
          case 'weather':
            result = await this.executeWeatherTrigger(trigger);
            break;
          case 'summary':
            result = await this.executeSummaryTrigger(trigger);
            break;
          case 'reminder':
            result = await this.executeReminderTrigger(trigger);
            break;
          default:
            console.warn(`Tipo de trigger desconhecido: ${trigger.type}`);
            continue;
        }

        if (result) {
          await this.updateTriggerNextRun(trigger.id);
        }
      }
    } catch (error) {
      console.error('Erro ao executar triggers:', error);
    }
  }

  async fetchActiveTriggers() {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/time_tasks_triggers?enabled=eq.true&select=*`,
        {
          headers: {
            'Authorization': `Bearer ${this.serviceRoleKey}`,
            'apikey': this.serviceRoleKey,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar triggers:', error);
      return [];
    }
  }

  shouldExecuteNow(trigger) {
    if (!trigger.next_run_at) return true;

    const nextRun = new Date(trigger.next_run_at);
    const now = new Date();

    return now >= nextRun;
  }

  async executeWeatherTrigger(trigger) {
    // Trigger de clima: buscar previsão e criar notificação
    try {
      const condition = trigger.condition || {};
      const { city = 'São Paulo', temperature_threshold = 30 } = condition;

      const weatherData = await this.fetchWeather(city);
      if (!weatherData) return false;

      const shouldNotify = weatherData.temperature > temperature_threshold;

      if (shouldNotify) {
        await this.createNotification(
          trigger.user_id,
          trigger.id,
          `🌡️ Clima em ${city}`,
          `Temperatura: ${weatherData.temperature}°C - ${weatherData.description}`,
          'weather'
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro em weather trigger:', error);
      return false;
    }
  }

  async executeSummaryTrigger(trigger) {
    // Trigger de resumo: criar notificação com resumo da agenda
    try {
      const condition = trigger.condition || {};
      const { day_of_week = 0, time = '08:00' } = condition; // 0 = domingo

      const now = new Date();
      const dayOfWeek = now.getDay();

      // Verificar se é o dia e hora corretos
      const [hour, minute] = time.split(':').map(Number);
      if (dayOfWeek !== day_of_week || now.getHours() !== hour || now.getMinutes() !== minute) {
        return false;
      }

      // Buscar eventos do usuário para hoje
      const events = await this.fetchUserEvents(trigger.user_id);

      if (events.length === 0) {
        await this.createNotification(
          trigger.user_id,
          trigger.id,
          '📅 Resumo da Agenda',
          'Nenhum evento agendado para hoje',
          'summary'
        );
      } else {
        const summary = events
          .slice(0, 3)
          .map(e => `• ${e.title} às ${e.start_time}`)
          .join('\n');

        await this.createNotification(
          trigger.user_id,
          trigger.id,
          '📅 Resumo da Agenda',
          `Seus eventos de hoje:\n${summary}`,
          'summary'
        );
      }

      return true;
    } catch (error) {
      console.error('Erro em summary trigger:', error);
      return false;
    }
  }

  async executeReminderTrigger(trigger) {
    // Trigger de lembrete customizado: notificação com mensagem
    try {
      const condition = trigger.condition || {};
      const { message = 'Lembrete', frequency = 'once' } = condition;

      await this.createNotification(
        trigger.user_id,
        trigger.id,
        '⏰ Lembrete',
        message,
        'reminder'
      );

      return true;
    } catch (error) {
      console.error('Erro em reminder trigger:', error);
      return false;
    }
  }

  async fetchWeather(city) {
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
      );
      const geoData = await response.json();

      if (!geoData.results || geoData.results.length === 0) return null;

      const { latitude, longitude } = geoData.results[0];

      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`
      );
      const weatherData = await weatherResponse.json();

      if (!weatherData.current) return null;

      return {
        temperature: weatherData.current.temperature_2m,
        weatherCode: weatherData.current.weather_code,
        description: this.getWeatherDescription(weatherData.current.weather_code)
      };
    } catch (error) {
      console.error('Erro ao buscar clima:', error);
      return null;
    }
  }

  getWeatherDescription(code) {
    const descriptions = {
      0: 'Céu limpo',
      1: 'Principalmente claro',
      2: 'Parcialmente nublado',
      3: 'Nublado',
      45: 'Nevoeiro',
      48: 'Nevoeiro com geada',
      51: 'Garoa leve',
      61: 'Chuva',
      71: 'Neve',
      80: 'Pancadas de chuva',
      95: 'Trovoada'
    };
    return descriptions[code] || 'Clima desconhecido';
  }

  async fetchUserEvents(userId) {
    try {
      const today = new Date().toISOString().split('T')[0];

      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/time_tasks_events?user_id=eq.${userId}&date=eq.${today}&select=id,title,start_time`,
        {
          headers: {
            'Authorization': `Bearer ${this.serviceRoleKey}`,
            'apikey': this.serviceRoleKey
          }
        }
      );

      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      return [];
    }
  }

  sbHeaders(extra = {}) {
    return {
      'Authorization': `Bearer ${this.serviceRoleKey}`,
      'apikey': this.serviceRoleKey,
      ...extra
    };
  }

  async createNotification(userId, triggerId, title, message, type, data = {}) {
    // A tabela só aceita trigger|reminder|verse|system — os tipos de trigger
    // (weather/summary/...) entram como 'trigger' para o insert não ser
    // rejeitado pelo CHECK.
    const dbType = DB_NOTIFICATION_TYPES.has(type) ? type : 'trigger';
    let created = false;
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/time_tasks_notifications`,
        {
          method: 'POST',
          headers: this.sbHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            user_id: userId,
            trigger_id: triggerId,
            type: dbType,
            title: title,
            message: message,
            read: false,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
        }
      );

      if (response.ok) {
        created = true;
        console.log(`✅ Notificação criada: ${title}`);
      } else {
        console.error('Erro ao criar notificação:', await response.text());
      }
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
    }

    // Web Push para os aparelhos inscritos — mesmo se o insert falhar, o
    // aviso ainda chega ao aparelho.
    try {
      await sendPushToUser(this.supabaseUrl, this.serviceRoleKey, userId, {
        title,
        body: message,
        tag: dbType,
        data
      });
    } catch (error) {
      console.error('Erro no envio de push:', error);
    }

    return created;
  }

  /**
   * Varredura de lembretes devidos (eventos e tarefas), com a mesma
   * semântica do cliente (reminders.js): devido há menos de 24h e ainda não
   * notificado. O claim de notified_at é atômico — quem marca primeiro
   * (app aberto ou este worker) é quem avisa; nunca há duplicata.
   */
  async checkDueReminders() {
    try {
      const now = new Date();
      await this.checkEventReminders(now);
      await this.checkSeedReminders(now);
    } catch (error) {
      console.error('Erro na varredura de lembretes:', error);
    }
  }

  async checkEventReminders(now) {
    const iso = (d) => d.toISOString().split('T')[0];
    const from = iso(new Date(now.getTime() - 86_400_000));
    const to = iso(new Date(now.getTime() + 86_400_000));
    const response = await fetch(
      `${this.supabaseUrl}/rest/v1/time_tasks_events?notified_at=is.null&completed=eq.false&all_day=eq.false&start_time=not.is.null&date=gte.${from}&date=lte.${to}&select=id,user_id,title,date,start_time,reminder_minutes`,
      { headers: this.sbHeaders() }
    );
    if (!response.ok) return;
    const events = await response.json();
    if (!events.length) return;

    const timezones = await this.fetchUserTimezones([...new Set(events.map(e => e.user_id))]);

    for (const event of events) {
      const timeZone = timezones.get(event.user_id) || DEFAULT_TIMEZONE;
      const occurrence = zonedDateTimeToUtc(event.date, event.start_time, timeZone);
      const target = new Date(occurrence.getTime() - Number(event.reminder_minutes || 0) * 60_000);
      if (now < target || now.getTime() - occurrence.getTime() >= 86_400_000) continue;
      if (!(await this.claimNotified('time_tasks_events', event.id))) continue;
      await this.createNotification(
        event.user_id,
        null,
        '⏰ Lembrete de evento',
        `${event.title} às ${String(event.start_time).slice(0, 5)}`,
        'reminder',
        { eventId: event.id }
      );
    }
  }

  async checkSeedReminders(now) {
    const response = await fetch(
      `${this.supabaseUrl}/rest/v1/time_tasks_seeds?notified_at=is.null&completed=eq.false&select=id,user_id,title,due_at,reminder_at`,
      { headers: this.sbHeaders() }
    );
    if (!response.ok) return;
    const seeds = await response.json();

    for (const seed of seeds) {
      const targetValue = seed.reminder_at || seed.due_at;
      if (!targetValue) continue;
      const target = new Date(targetValue);
      if (now < target || now.getTime() - target.getTime() >= 86_400_000) continue;
      if (!(await this.claimNotified('time_tasks_seeds', seed.id))) continue;
      await this.createNotification(
        seed.user_id,
        null,
        '⏰ Lembrete de tarefa',
        seed.title,
        'reminder',
        { taskId: seed.id }
      );
    }
  }

  async claimNotified(table, id) {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/${table}?id=eq.${id}&notified_at=is.null`,
        {
          method: 'PATCH',
          headers: this.sbHeaders({ 'Content-Type': 'application/json', 'Prefer': 'return=representation' }),
          body: JSON.stringify({ notified_at: new Date().toISOString() })
        }
      );
      if (!response.ok) return false;
      const rows = await response.json();
      return rows.length > 0;
    } catch (error) {
      console.error('Erro ao reivindicar lembrete:', error);
      return false;
    }
  }

  async fetchUserTimezones(userIds) {
    const map = new Map();
    if (!userIds.length) return map;
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/time_tasks_settings?user_id=in.(${userIds.join(',')})&select=user_id,timezone`,
        { headers: this.sbHeaders() }
      );
      if (response.ok) {
        for (const row of await response.json()) {
          if (row.timezone) map.set(row.user_id, row.timezone);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar fusos dos usuários:', error);
    }
    return map;
  }

  async updateTriggerNextRun(triggerId) {
    try {
      const nextRun = new Date(Date.now() + 60 * 60 * 1000); // 1 hora depois

      await fetch(
        `${this.supabaseUrl}/rest/v1/time_tasks_triggers?id=eq.${triggerId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.serviceRoleKey}`,
            'apikey': this.serviceRoleKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            next_run_at: nextRun.toISOString()
          })
        }
      );
    } catch (error) {
      console.error('Erro ao atualizar trigger:', error);
    }
  }
}

// Exportar singleton
export default TriggerExecutor;
