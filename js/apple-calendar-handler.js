// Apple Calendar CalDAV Integration Handler

import { parseString } from 'xml2js';

export function buildAppleCalDAVUrl(email, domain = 'caldav.icloud.com') {
  return `https://${domain}/`;
}

export async function discoverAppleCalDAV(email, password) {
  const auth = Buffer.from(`${email}:${password}`).toString('base64');
  
  const propfind = `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:" xmlns:CS="http://calendarserver.org/ns/">
  <D:prop>
    <D:resourcetype/>
    <D:displayname/>
    <D:principal-URL/>
  </D:prop>
</D:propfind>`;

  try {
    const response = await fetch('https://caldav.icloud.com/', {
      method: 'PROPFIND',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/xml; charset="utf-8"',
        'Depth': '0'
      },
      body: propfind,
      signal: AbortSignal.timeout(10_000)
    });

    if (!response.ok) throw new Error(`CALDAV_DISCOVERY_FAILED: ${response.status}`);

    const xmlText = await response.text();
    const parsed = await new Promise((resolve, reject) => {
      parseString(xmlText, (err, result) => err ? reject(err) : resolve(result));
    });

    return { discovered: true, email, calendars: [] };
  } catch (error) {
    throw new Error(`APPLE_CALDAV_DISCOVERY_ERROR: ${error.message}`);
  }
}

export async function fetchAppleCalendars(email, password) {
  const auth = Buffer.from(`${email}:${password}`).toString('base64');

  const propfind = `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:" xmlns:CS="http://calendarserver.org/ns/">
  <D:prop>
    <D:resourcetype/>
    <D:displayname/>
    <CS:getctag/>
  </D:prop>
</D:propfind>`;

  try {
    const response = await fetch('https://caldav.icloud.com/calendars.ics/', {
      method: 'PROPFIND',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/xml; charset="utf-8"',
        'Depth': '1'
      },
      body: propfind,
      signal: AbortSignal.timeout(10_000)
    });

    if (!response.ok) throw new Error('CALDAV_CALENDARS_FETCH_FAILED');

    const xmlText = await response.text();
    const parsed = await new Promise((resolve, reject) => {
      parseString(xmlText, (err, result) => err ? reject(err) : resolve(result));
    });

    const calendars = [];
    if (parsed['D:multistatus']?.['D:response']) {
      const responses = Array.isArray(parsed['D:multistatus']['D:response'])
        ? parsed['D:multistatus']['D:response']
        : [parsed['D:multistatus']['D:response']];

      responses.forEach(r => {
        const propstat = r['D:propstat']?.[0];
        if (propstat?.['D:prop']?.[0]) {
          const prop = propstat['D:prop'][0];
          const isCalendar = prop['D:resourcetype']?.[0]?.['C:calendar'] !== undefined;
          
          if (isCalendar) {
            calendars.push({
              url: r['D:href']?.[0] || '',
              name: prop['D:displayname']?.[0] || 'Calendar',
              ctag: prop['CS:getctag']?.[0] || ''
            });
          }
        }
      });
    }

    return calendars;
  } catch (error) {
    throw new Error(`APPLE_CALENDARS_FETCH_ERROR: ${error.message}`);
  }
}

export async function fetchAppleEvents(calendarUrl, email, password, timeMin, timeMax) {
  const auth = Buffer.from(`${email}:${password}`).toString('base64');

  const report = `<?xml version="1.0" encoding="utf-8"?>
<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:getetag/>
    <C:calendar-data/>
  </D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT">
        <C:time-range start="${new Date(timeMin).toISOString().replace(/[-:]/g, '').slice(0, 15)}Z" end="${new Date(timeMax).toISOString().replace(/[-:]/g, '').slice(0, 15)}Z"/>
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`;

  try {
    const response = await fetch(calendarUrl, {
      method: 'REPORT',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/xml; charset="utf-8"',
        'Depth': '1'
      },
      body: report,
      signal: AbortSignal.timeout(15_000)
    });

    if (!response.ok) throw new Error('CALDAV_EVENTS_FETCH_FAILED');

    const xmlText = await response.text();
    const parsed = await new Promise((resolve, reject) => {
      parseString(xmlText, (err, result) => err ? reject(err) : resolve(result));
    });

    const events = [];
    if (parsed['D:multistatus']?.['D:response']) {
      const responses = Array.isArray(parsed['D:multistatus']['D:response'])
        ? parsed['D:multistatus']['D:response']
        : [parsed['D:multistatus']['D:response']];

      responses.forEach(r => {
        const icsData = r['D:propstat']?.[0]?.['D:prop']?.[0]?.['C:calendar-data']?.[0];
        if (icsData) {
          events.push({
            uid: r['D:href']?.[0]?.split('/').pop() || '',
            etag: r['D:propstat']?.[0]?.['D:prop']?.[0]?.['D:getetag']?.[0] || '',
            icsData
          });
        }
      });
    }

    return events;
  } catch (error) {
    throw new Error(`APPLE_EVENTS_FETCH_ERROR: ${error.message}`);
  }
}

export function parseICS(icsData) {
  try {
    const lines = icsData.split('\n');
    const event = {};
    let inEvent = false;

    lines.forEach(line => {
      line = line.trim();
      if (line === 'BEGIN:VEVENT') inEvent = true;
      if (line === 'END:VEVENT') inEvent = false;

      if (inEvent && line.includes(':')) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':');

        if (key === 'SUMMARY') event.title = value;
        if (key === 'DTSTART') event.startTime = new Date(value);
        if (key === 'DTEND') event.endTime = new Date(value);
        if (key === 'DESCRIPTION') event.description = value;
        if (key === 'UID') event.externalId = value;
      }
    });

    return event;
  } catch (error) {
    throw new Error(`ICS_PARSE_ERROR: ${error.message}`);
  }
}
