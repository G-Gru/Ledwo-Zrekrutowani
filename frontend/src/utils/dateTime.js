const DEFAULT_LOCALE = 'pl-PL';
const WARSAW_TIME_ZONE = 'Europe/Warsaw';

function toValidDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function formatDateInWarsaw(value, fallback = '-') {
  const date = toValidDate(value);
  if (!date) {
    return value || fallback;
  }

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: WARSAW_TIME_ZONE,
  }).format(date);
}

export function formatDateTimeInWarsaw(value, fallback = '-') {
  const date = toValidDate(value);
  if (!date) {
    return value || fallback;
  }

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: WARSAW_TIME_ZONE,
  }).format(date);
}

export function toDateTimeLocalInWarsaw(value) {
  const date = toValidDate(value);
  if (!date) {
    return '';
  }

  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: WARSAW_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const getPart = (type) => parts.find((part) => part.type === type)?.value || '00';
  return `${getPart('year')}-${getPart('month')}-${getPart('day')}T${getPart('hour')}:${getPart('minute')}`;
}
