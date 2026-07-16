/**
 * Integração com Open-Meteo API — previsão climática sem chave.
 * Geolocalização automática com fallback manual.
 */

const GEOLOCATION_KEY = 'timetasks_geolocation';
const WEATHER_CACHE_KEY = 'timetasks_weather_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 min

export async function initWeather() {
  const widget = document.getElementById('weather-widget');
  if (!widget) return;

  renderWeather();
}

export async function renderWeather() {
  const widget = document.getElementById('weather-widget');
  if (!widget) return;

  try {
    const cached = getCachedWeather();
    if (cached) {
      displayWeather(cached);
      return;
    }

    const location = await getLocation();
    if (!location) {
      showLocationPrompt();
      return;
    }

    const weather = await fetchWeather(location.lat, location.lon);
    if (weather) {
      cacheWeather(weather);
      displayWeather(weather);
    }
  } catch (err) {
    console.warn('Clima indisponível:', err.message);
    widget.innerHTML = '<p class="weather-error">Clima indisponível</p>';
  }
}

async function getLocation() {
  const stored = localStorage.getItem(GEOLOCATION_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem(GEOLOCATION_KEY);
    }
  }

  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          timestamp: Date.now()
        };
        localStorage.setItem(GEOLOCATION_KEY, JSON.stringify(location));
        resolve(location);
      },
      () => resolve(null),
      { timeout: 5000, maximumAge: 3600000 }
    );
  });
}

async function fetchWeather(lat, lon) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,weather_code');
  url.searchParams.set('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const data = await response.json();
  return {
    temp: Math.round(data.current.temperature_2m),
    humidity: data.current.relative_humidity_2m,
    code: data.current.weather_code,
    timestamp: Date.now()
  };
}

function displayWeather(weather) {
  const widget = document.getElementById('weather-widget');
  if (!widget) return;

  const emoji = getWeatherEmoji(weather.code);
  widget.innerHTML = `
    <div class="weather-content">
      <div class="weather-emoji">${emoji}</div>
      <div class="weather-info">
        <p class="weather-temp">${weather.temp}°</p>
        <p class="weather-description">${getWeatherDescription(weather.code)}</p>
      </div>
    </div>
  `;
}

function showLocationPrompt() {
  const widget = document.getElementById('weather-widget');
  if (!widget) return;

  widget.innerHTML = `
    <div class="weather-prompt">
      <p>Ativar localização para ver o clima?</p>
      <div class="weather-prompt-buttons">
        <button type="button" id="weather-enable-geo" class="btn-small">Sim</button>
        <button type="button" id="weather-manual-city" class="btn-small btn-small--secondary">Manual</button>
      </div>
    </div>
  `;

  document.getElementById('weather-enable-geo')?.addEventListener('click', async () => {
    const location = await getLocation();
    if (location) {
      renderWeather();
    }
  });

  document.getElementById('weather-manual-city')?.addEventListener('click', () => {
    const city = prompt('Digite a cidade (ex: São Paulo):');
    if (city) {
      searchCity(city);
    }
  });
}

async function searchCity(city) {
  try {
    const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
    url.searchParams.set('name', city);
    url.searchParams.set('count', '1');
    url.searchParams.set('language', 'pt');

    const response = await fetch(url);
    if (!response.ok) throw new Error('Cidade não encontrada');

    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      alert('Cidade não encontrada');
      return;
    }

    const result = data.results[0];
    const location = { lat: result.latitude, lon: result.longitude };
    localStorage.setItem(GEOLOCATION_KEY, JSON.stringify(location));

    renderWeather();
  } catch (err) {
    alert('Erro ao buscar cidade: ' + err.message);
  }
}

function getWeatherEmoji(code) {
  // WMO Weather Interpretation Codes
  if (code === 0 || code === 1) return '☀️';
  if (code === 2) return '⛅';
  if (code === 3) return '☁️';
  if (code === 45 || code === 48) return '🌫️';
  if (code === 51 || code === 53 || code === 55 || code === 61 || code === 63 || code === 65) return '🌧️';
  if (code === 71 || code === 73 || code === 75 || code === 77 || code === 80 || code === 81 || code === 82) return '❄️';
  if (code === 80 || code === 81 || code === 82) return '⛈️';
  if (code === 85 || code === 86) return '🌨️';
  return '🌤️';
}

function getWeatherDescription(code) {
  const descriptions = {
    0: 'Limpo',
    1: 'Principalmente claro',
    2: 'Parcialmente nublado',
    3: 'Nublado',
    45: 'Névoa',
    48: 'Neblina',
    51: 'Chuva leve',
    53: 'Chuva moderada',
    55: 'Chuva intensa',
    61: 'Chuva fraca',
    63: 'Chuva moderada',
    65: 'Chuva forte',
    71: 'Neve fraca',
    73: 'Neve moderada',
    75: 'Neve forte',
    77: 'Flocos de neve',
    80: 'Pancadas de chuva fracas',
    81: 'Pancadas de chuva moderadas',
    82: 'Pancadas de chuva violentas',
    85: 'Neve com chuva fraca',
    86: 'Neve com chuva forte'
  };
  return descriptions[code] || 'Desconhecido';
}

function getCachedWeather() {
  const cached = localStorage.getItem(WEATHER_CACHE_KEY);
  if (!cached) return null;

  try {
    const data = JSON.parse(cached);
    if (Date.now() - data.timestamp > CACHE_DURATION) {
      localStorage.removeItem(WEATHER_CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    localStorage.removeItem(WEATHER_CACHE_KEY);
    return null;
  }
}

function cacheWeather(weather) {
  localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(weather));
}
