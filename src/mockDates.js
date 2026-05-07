export const MOCK_TX_YEAR = 2025;
export const MOCK_TX_MONTH_INDEX = 3; // April
export const MOCK_TX_NOW = new Date(MOCK_TX_YEAR, MOCK_TX_MONTH_INDEX, 24);

const MONTH_INDEX = {
  ene: 0,
  feb: 1,
  mar: 2,
  abr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  ago: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dic: 11,
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const addDays = (date, days) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

export const getMockTxDate = (label) => {
  const value = String(label || '').trim().toLowerCase();
  if (value === 'hoy') return startOfDay(MOCK_TX_NOW);
  if (value === 'ayer') return addDays(MOCK_TX_NOW, -1);

  const match = value.match(/^(\d{1,2})\s+([a-z]{3})/);
  if (!match) return startOfDay(MOCK_TX_NOW);

  const day = Number(match[1]);
  const month = MONTH_INDEX[match[2]] ?? MOCK_TX_MONTH_INDEX;
  return new Date(MOCK_TX_YEAR, month, day);
};

export const txMatchesMonth = (tx, monthIdx = MOCK_TX_MONTH_INDEX) => {
  const date = getMockTxDate(tx.date);
  return date.getFullYear() === MOCK_TX_YEAR && date.getMonth() === monthIdx;
};

export const txMatchesDateRange = (tx, range = 'all', dateFrom = '', dateTo = '') => {
  const date = getMockTxDate(tx.date);
  const today = startOfDay(MOCK_TX_NOW);

  if (range === 'today') return date.getTime() === today.getTime();
  if (range === 'week') return date >= addDays(today, -6) && date <= today;
  if (range === 'month') return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
  if (range === '3months') return date >= new Date(today.getFullYear(), today.getMonth() - 2, 1) && date <= today;
  if (range === 'year') return date.getFullYear() === today.getFullYear() && date <= today;
  if (range === 'custom') {
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
  }

  return true;
};
