function escapeText(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function toIcsDateTime(day, time) {
  return `${day.replace(/-/g, '')}T${time.replace(':', '')}00`;
}

// CRLF line endings are required by RFC 5545 — Gmail/Outlook/Apple Calendar
// silently reject bare-LF .ics files instead of erroring, which is easy to miss.
function buildSessionInvite({
  id,
  talkTitle,
  talkDescription,
  sessionDay,
  sessionRoom,
  sessionStart,
  sessionEnd,
  attendeeEmail,
  attendeeName,
  organizerEmail,
}) {
  const uid = `${id}@sessionboard-clone`;
  const dtStart = toIcsDateTime(sessionDay, sessionStart);
  const dtEnd = toIcsDateTime(sessionDay, sessionEnd);
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sessionboard Clone//Speaker Scheduling//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeText(talkTitle)}`,
    `DESCRIPTION:${escapeText(talkDescription || '')}`,
    `LOCATION:${escapeText(sessionRoom)}`,
    `ORGANIZER;CN=Conference Organizers:mailto:${organizerEmail}`,
    `ATTENDEE;CN=${escapeText(attendeeName)};ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:${attendeeEmail}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.join('\r\n');
}

module.exports = { buildSessionInvite };
