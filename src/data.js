export const PELAS_USER = {
  name: 'Marta Bayón',
  initials: 'MB',
  email: 'marta.bayon@correo.es',
  phone: '+34 612 408 192',
  iban: 'ES76 0049 1500 05 2810374562',
};

export const PELAS_BALANCE = {
  total: 4287.42,
  income: 3120.00,
  expenses: 1842.58,
  saved: 612.30,
};

export const PELAS_CARDS = [
  { id: 'c1', bank: 'Pelas Black', last4: '7852', expiry: '08/29', holder: 'Marta Bayón', type: 'visa', balance: 4287.42, color: 'mesh-blue' },
  { id: 'c2', bank: 'Pelas Plus',  last4: '4129', expiry: '11/27', holder: 'Marta Bayón', type: 'mc',   balance: 1240.10, color: 'mesh-night' },
];

export const PELAS_CATEGORIES = [
  { id: 'food',     label: 'Alimentación',  icon: 'cart',    color: '#0066FF', spent: 412.30, budget: 600 },
  { id: 'transport',label: 'Transporte',    icon: 'car',     color: '#5B8DEF', spent: 128.40, budget: 200 },
  { id: 'home',     label: 'Hogar',         icon: 'home',    color: '#7C5CFF', spent: 720.00, budget: 800 },
  { id: 'leisure',  label: 'Ocio',          icon: 'play',    color: '#FF8A4C', spent: 215.88, budget: 250 },
  { id: 'health',   label: 'Salud',         icon: 'heart',   color: '#E16364', spent:  64.00, budget: 150 },
  { id: 'subs',     label: 'Suscripciones', icon: 'refresh', color: '#3FB984', spent:  47.95, budget: 60  },
  { id: 'shopping', label: 'Compras',       icon: 'bag',     color: '#FFC234', spent: 184.05, budget: 200 },
  { id: 'edu',      label: 'Educación',     icon: 'book',    color: '#A2A2A7', spent:  70.00, budget: 100 },
];

export const PELAS_TRANSACTIONS = [
  { id: 't1',  cat: 'food',     name: 'Mercadona',       sub: 'Alimentación',  amount:  -64.32, date: 'Hoy',    time: '13:42', card: 'Pelas Black', account: 'a2', location: 'Madrid · Chamberí' },
  { id: 't2',  cat: 'subs',     name: 'Spotify Premium', sub: 'Suscripción',   amount:  -10.99, date: 'Hoy',    time: '09:00', card: 'Pelas Black', account: 'a2', location: 'Online' },
  { id: 't3',  cat: 'income',   name: 'Nómina Acme',     sub: 'Ingreso',       amount: 2480.00, date: 'Ayer',   time: '08:00', card: 'Pelas Black', account: 'a2', location: 'Transferencia' },
  { id: 't4',  cat: 'transport',name: 'Cabify',          sub: 'Transporte',    amount:  -12.40, date: 'Ayer',   time: '22:15', card: 'Pelas Plus',  account: 'a4', location: 'Madrid · Sol' },
  { id: 't5',  cat: 'leisure',  name: 'Filmoteca',       sub: 'Cine',          amount:   -8.50, date: 'Ayer',   time: '20:30', card: 'Pelas Plus',  account: 'a4', location: 'Madrid · Lavapiés' },
  { id: 't6',  cat: 'food',     name: 'Bar Lúa',         sub: 'Restaurante',   amount:  -28.40, date: '23 abr', time: '14:50', card: 'Pelas Black', account: 'a2', location: 'Madrid · Malasaña' },
  { id: 't7',  cat: 'home',     name: 'Endesa',          sub: 'Electricidad',  amount:  -78.10, date: '22 abr', time: '11:00', card: 'Pelas Black', account: 'a3', location: 'Domiciliación' },
  { id: 't8',  cat: 'shopping', name: 'Decathlon',       sub: 'Compras',       amount:  -49.95, date: '21 abr', time: '18:24', card: 'Pelas Plus',  account: 'a4', location: 'Madrid · Méndez Álvaro' },
  { id: 't9',  cat: 'transport',name: 'Renfe',           sub: 'AVE Madrid',    amount:  -67.50, date: '20 abr', time: '07:10', card: 'Pelas Black', account: 'a2', location: 'Atocha' },
  { id: 't10', cat: 'food',     name: 'Lidl',            sub: 'Alimentación',  amount:  -42.18, date: '19 abr', time: '19:35', card: 'Pelas Black', account: 'a2', location: 'Madrid · Cuatro Caminos' },
  { id: 't11', cat: 'health',   name: 'Farmacia Sanz',   sub: 'Farmacia',      amount:  -14.20, date: '18 abr', time: '17:02', card: 'Pelas Plus',  account: 'a4', location: 'Madrid · Chamberí' },
  { id: 't12', cat: 'subs',     name: 'iCloud+ 2TB',     sub: 'Suscripción',   amount:   -9.99, date: '15 abr', time: '00:00', card: 'Pelas Black', account: 'a2', location: 'Online' },
  // Nacional – otras ciudades
  { id: 'nb1', cat: 'food',     name: 'El Nacional',       sub: 'Restaurante',   amount:  -64.80, date: '15 mar', time: '21:00', card: 'Pelas Black', account: 'a2', location: 'Barcelona · Eixample' },
  { id: 'nb2', cat: 'transport',name: 'Renfe AVE BCN',     sub: 'Tren',          amount:  -79.50, date: '14 mar', time: '07:30', card: 'Pelas Black', account: 'a2', location: 'Barcelona · Sants' },
  { id: 'nb3', cat: 'leisure',  name: 'Sagrada Família',   sub: 'Cultura',       amount:  -26.00, date: '15 mar', time: '10:00', card: 'Pelas Plus',  account: 'a4', location: 'Barcelona · Gràcia' },
  { id: 'ns1', cat: 'food',     name: 'Casa Robles',       sub: 'Restaurante',   amount:  -52.40, date: '8 feb',  time: '14:00', card: 'Pelas Black', account: 'a2', location: 'Sevilla · Triana' },
  { id: 'ns2', cat: 'transport',name: 'Vueling Sevilla',   sub: 'Vuelo',         amount:  -89.90, date: '6 feb',  time: '08:00', card: 'Pelas Black', account: 'a2', location: 'Sevilla · Aeropuerto' },
  { id: 'nbi1',cat: 'leisure',  name: 'Museo Guggenheim',  sub: 'Cultura',       amount:  -16.00, date: '20 ene', time: '11:00', card: 'Pelas Plus',  account: 'a4', location: 'Bilbao · Abando' },
  { id: 'nbi2',cat: 'food',     name: 'Sirimiri Pintxos',  sub: 'Restaurante',   amount:  -38.10, date: '20 ene', time: '20:00', card: 'Pelas Black', account: 'a2', location: 'Bilbao · Casco Viejo' },
  { id: 'nm1', cat: 'food',     name: 'El Pimpi',          sub: 'Restaurante',   amount:  -44.20, date: '5 ene',  time: '14:30', card: 'Pelas Black', account: 'a2', location: 'Málaga · Centro' },
  // Internacional
  { id: 'it1', cat: 'food',     name: 'Taberna de Lisboa', sub: 'Restaurante',   amount:  -48.50, date: '12 mar', time: '20:30', card: 'Pelas Black', account: 'a2', location: 'Lisboa · Portugal' },
  { id: 'it2', cat: 'transport',name: 'Vueling Lisboa',    sub: 'Vuelo',         amount: -120.00, date: '10 mar', time: '09:00', card: 'Pelas Black', account: 'a2', location: 'Lisboa · Portugal' },
  { id: 'it3', cat: 'leisure',  name: 'Museu do Azulejo',  sub: 'Cultura',       amount:  -12.00, date: '11 mar', time: '15:00', card: 'Pelas Black', account: 'a2', location: 'Lisboa · Portugal' },
  { id: 'it4', cat: 'food',     name: 'Brasserie Parisien',sub: 'Restaurante',   amount:  -85.20, date: '5 feb',  time: '21:00', card: 'Pelas Black', account: 'a2', location: 'París · Francia' },
  { id: 'it5', cat: 'transport',name: 'SNCF TGV',          sub: 'Tren',          amount:  -95.00, date: '4 feb',  time: '08:00', card: 'Pelas Plus',  account: 'a4', location: 'París · Francia' },
  { id: 'it6', cat: 'food',     name: 'Trattoria Roma',    sub: 'Restaurante',   amount:  -72.40, date: '18 ene', time: '20:00', card: 'Pelas Black', account: 'a2', location: 'Roma · Italia' },
  { id: 'it7', cat: 'leisure',  name: 'Colosseum',         sub: 'Turismo',       amount:  -16.00, date: '18 ene', time: '11:00', card: 'Pelas Black', account: 'a2', location: 'Roma · Italia' },
  { id: 'it8', cat: 'shopping', name: 'Médina Marrakech',  sub: 'Compras',       amount: -120.00, date: '2 dic',  time: '12:00', card: 'Pelas Plus',  account: 'a4', location: 'Marrakech · Marruecos' },
  { id: 'it9', cat: 'transport',name: 'Air Arabia',        sub: 'Vuelo',         amount: -180.00, date: '29 nov', time: '07:00', card: 'Pelas Black', account: 'a2', location: 'Marrakech · Marruecos' },
  { id: 'it10',cat: 'food',     name: 'Izakaya Shinjuku',  sub: 'Restaurante',   amount:  -95.80, date: '8 sep',  time: '19:30', card: 'Pelas Black', account: 'a2', location: 'Tokio · Japón' },
  { id: 'it11',cat: 'shopping', name: 'Shibuya 109',       sub: 'Compras',       amount: -380.00, date: '9 sep',  time: '14:00', card: 'Pelas Black', account: 'a2', location: 'Tokio · Japón' },
  { id: 'it12',cat: 'transport',name: 'JAL Tokio-Madrid',  sub: 'Vuelo',         amount: -820.00, date: '7 sep',  time: '23:00', card: 'Pelas Black', account: 'a2', location: 'Tokio · Japón' },
];

export const PELAS_BUDGETS = [
  { id: 'b1', label: 'Comida y restaurantes', spent: 412, budget: 600, color: '#0066FF' },
  { id: 'b2', label: 'Hogar y facturas',      spent: 720, budget: 800, color: '#7C5CFF' },
  { id: 'b3', label: 'Ocio y cultura',        spent: 215, budget: 250, color: '#FF8A4C' },
  { id: 'b4', label: 'Transporte',            spent: 128, budget: 200, color: '#5B8DEF' },
];

export const PELAS_GOALS = [
  { id: 'g1', label: 'Viaje a Japón',   saved: 1240, target: 4000, due: 'Octubre 2026',    color: '#0066FF', icon: 'plane' },
  { id: 'g2', label: 'Fondo emergencia',saved: 2800, target: 6000, due: 'Diciembre 2026',  color: '#3FB984', icon: 'shield' },
  { id: 'g3', label: 'MacBook Pro 14"', saved:  410, target: 2200, due: 'Junio 2026',      color: '#7C5CFF', icon: 'laptop' },
];

export const PELAS_SERIES_30D = [
  42,18,67,23,88,31,12,54,76,29,
  44,91,22,38,64,49,18,71,33,55,
  82,27,41,16,69,34,52,78,24,47,
];

export const PELAS_MONTHLY = [
  { m: 'Nov', v: 1620, i: 2480 },
  { m: 'Dic', v: 2840, i: 2480 },
  { m: 'Ene', v: 1480, i: 2480 },
  { m: 'Feb', v: 1720, i: 2480 },
  { m: 'Mar', v: 1980, i: 2640 },
  { m: 'Abr', v: 1842, i: 3120 },
];

export const PELAS_NOTIFICATIONS = [
  { id: 'n1', icon: 'bell', title: 'Has gastado el 75% de tu presupuesto de Ocio', time: 'Hace 2h',  type: 'warning' },
  { id: 'n2', icon: 'down', title: 'Cargo de Spotify: 10,99 €',                    time: 'Hoy 09:00',type: 'info' },
  { id: 'n3', icon: 'up',   title: 'Nómina recibida: +2.480,00 €',                 time: 'Ayer',     type: 'success' },
  { id: 'n4', icon: 'goal', title: 'Meta "Viaje a Japón" al 31%',                  time: '3 abr',    type: 'info' },
];

export const PELAS_ACCOUNTS = [
  { id: 'a1', name: 'Efectivo', bank: 'Cartera',          balance:   180.00, color: '#3FB984', icon: 'wallet', type: 'cash', currency: 'EUR' },
  { id: 'a2', name: 'BBVA',    bank: 'Cuenta Online',    balance: 2860.42,  color: '#0066FF', icon: 'card',   type: 'bank', currency: 'EUR' },
  { id: 'a3', name: 'Sabadell',bank: 'Cuenta Expansión', balance: 1107.00,  color: '#1B3A8C', icon: 'card',   type: 'bank', currency: 'USD' },
  { id: 'a4', name: 'Revolut', bank: 'Personal',         balance:   140.00, color: '#7C5CFF', icon: 'card',   type: 'bank', currency: 'GBP' },
];

export const PELAS_INCOME_CATEGORIES = [
  { id: 'salary',    label: 'Nómina',      icon: 'card',    color: '#3FB984', amount: 2480 },
  { id: 'freelance', label: 'Freelance',   icon: 'send',    color: '#0066FF', amount: 480  },
  { id: 'dividends', label: 'Dividendos',  icon: 'trending',color: '#7C5CFF', amount: 120  },
  { id: 'other_in',  label: 'Otros',       icon: 'plus',    color: '#A2A2A7', amount: 40   },
];

export const PELAS_HOLDINGS = [
  { id: 'h1', symbol: 'VWCE',  name: 'Vanguard FTSE All-World',  type: 'ETF',    value: 8420.50, change:  142.30, changePct:  1.72, sparkColor: '#3FB984', spark: [40,42,38,44,48,46,52,55,58,57,62,64,68,72] },
  { id: 'h2', symbol: 'AAPL',  name: 'Apple Inc.',               type: 'Acción', value: 1840.20, change:  -28.40, changePct: -1.52, sparkColor: '#E16364', spark: [60,58,62,55,52,49,54,51,47,49,45,42,44,42] },
  { id: 'h3', symbol: 'BTC',   name: 'Bitcoin',                  type: 'Cripto', value: 2160.80, change:  312.50, changePct: 16.91, sparkColor: '#3FB984', spark: [25,28,32,30,38,42,48,55,62,58,68,72,78,82], iconKey: 'btc' },
  { id: 'h4', symbol: 'IWDA',  name: 'iShares Core MSCI World',  type: 'ETF',    value: 3250.10, change:   58.40, changePct:  1.83, sparkColor: '#3FB984', spark: [40,42,44,42,46,48,52,50,54,56,58,60,62,64] },
  { id: 'h5', symbol: 'ETH',   name: 'Ethereum',                 type: 'Cripto', value:  680.40, change:  -42.10, changePct: -5.82, sparkColor: '#E16364', spark: [62,60,64,58,55,52,50,48,46,44,42,40,38,36], iconKey: 'eth' },
  { id: 'h6', symbol: 'BBKCM', name: 'BBVA Bolsa USA Cubierto',  type: 'Fondo',  value: 1420.00, change:   18.20, changePct:  1.30, sparkColor: '#3FB984', spark: [50,48,52,54,52,56,58,56,60,62,60,64,66,68] },
];
