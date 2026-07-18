// Trigger Executor — Fase 12.2
// Worker Node.js para executar triggers em cronograma
// Tipos: weather, summary, reminder
// Usa o fetch global do Node 22 — sem dependência externa.

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

    this.interval = setInterval(() => this.checkAndExecuteTriggers(), intervalMs);

    // Executar imediatamente na primeira vez
    this.checkAndExecuteTriggers();
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

  async createNotification(userId, triggerId, title, message, type) {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/time_tasks_notifications`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.serviceRoleKey}`,
            'apikey': this.serviceRoleKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: userId,
            trigger_id: triggerId,
            type: type,
            title: title,
            message: message,
            read: false,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
        }
      );

      if (!response.ok) {
        console.error('Erro ao criar notificação:', await response.text());
        return false;
      }

      console.log(`✅ Notificação criada: ${title}`);
      return true;
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      return false;
    }
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
