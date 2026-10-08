/**
 * financialWisdomEngine.js
 * Behavioral Financial Wisdom & Contextual Micro-Advice Generator for AuraFinance.
 * Delivers actionable psychological principles, rules of thumb, and daily financial wisdom
 * contextualized to the user's spending habits and wealth profile.
 * Zero-Knowledge local processing.
 */

export const WISDOM_CATEGORIES = {
  SAVINGS: 'SAVINGS',
  INVESTING: 'INVESTING',
  PSYCHOLOGY: 'PSYCHOLOGY',
  BUDGETING: 'BUDGETING',
  DEBT: 'DEBT',
  MINIMALISM: 'MINIMALISM',
};

export const WISDOM_NUGGETS = [
  {
    id: 'WISDOM-01',
    category: WISDOM_CATEGORIES.SAVINGS,
    title: 'La Regla de las 24 Horas para Compras Imprevistas',
    principle: 'Antes de realizar una compra no planificada superior a $50, espera 24 horas completas. El 70% de los impulsos de compra desaparecen cuando el pico de dopamina inicial se disipa.',
    author: 'Psicología Financiera',
    tag: 'Control de Impulsos',
  },
  {
    id: 'WISDOM-02',
    category: WISDOM_CATEGORIES.SAVINGS,
    title: 'Págate a Ti Mismo Primero (Pay Yourself First)',
    principle: 'No ahorres lo que te queda después de gastar; gasta lo que te queda después de separar tu ahorro e inversión automática al inicio del mes.',
    author: 'George S. Clason (El Hombre Más Rico de Babilonia)',
    tag: 'Hábito Fundamental',
  },
  {
    id: 'WISDOM-03',
    category: WISDOM_CATEGORIES.INVESTING,
    title: 'El Tiempo en el Mercado Vence al Timing del Mercado',
    principle: 'Intentar predecir el momento exacto para invertir suele restar rentabilidad. La constancia mensual mediante aportes periódicos (Dollar-Cost Averaging) reduce la volatilidad y maximiza el interés compuesto.',
    author: 'John Bogle (Fundador de Vanguard)',
    tag: 'Inversión Pasiva',
  },
  {
    id: 'WISDOM-04',
    category: WISDOM_CATEGORIES.PSYCHOLOGY,
    title: 'La Inflación del Estilo de Vida (Lifestyle Creep)',
    principle: 'Cuando tus ingresos aumenten, ahorra al menos el 50% de cada aumento salarial antes de elevar tu estándar de vida. La verdadera riqueza no es lo que ganas, sino lo que logras retener.',
    author: 'Morgan Housel (La Psicología del Dinero)',
    tag: 'Libertad Financiera',
  },
  {
    id: 'WISDOM-05',
    category: WISDOM_CATEGORIES.BUDGETING,
    title: 'Auditoría Trimestral de Suscripciones Fantasma',
    principle: 'Las pequeñas suscripciones de $10 a $20 mensuales parecen inofensivas, pero sumadas representan una fuga silenciosa de miles de dólares al año. Cancela todo servicio no utilizado en los últimos 30 días.',
    author: 'Higiene Financiera Aura',
    tag: 'Optimización de Flujo',
  },
  {
    id: 'WISDOM-06',
    category: WISDOM_CATEGORIES.DEBT,
    title: 'La Ilusión del Pago Mínimo en Tarjetas de Crédito',
    principle: 'Abonar solo el pago mínimo en tarjetas de crédito maximiza el cobro de intereses compuestos a favor del banco, multiplicando el coste original del producto hasta por 3 veces en el tiempo.',
    author: 'Educación Financiera',
    tag: 'Eliminación de Pasivos',
  },
  {
    id: 'WISDOM-07',
    category: WISDOM_CATEGORIES.MINIMALISM,
    title: 'El Costo Real en Horas de Vida',
    principle: 'El dinero que gastas no son solo billetes, son horas de tu tiempo de vida y energía laboral invertidas para conseguirlo. Pregúntate: ¿vale este objeto las 8 horas de trabajo que cuesta?',
    author: 'Vicki Robin (La Bolsa o la Vida)',
    tag: 'Conciencia de Consumo',
  },
  {
    id: 'WISDOM-08',
    category: WISDOM_CATEGORIES.INVESTING,
    title: 'El Impuesto Silencioso de la Inflación',
    principle: 'Tener todo tu dinero en una cuenta al 0% de interés no es seguro: la inflación erosiona silenciosamente entre un 3% y un 5% de tu poder adquisitivo cada año.',
    author: 'Economía Personal',
    tag: 'Preservación de Capital',
  },
];

/**
 * Returns a deterministic daily wisdom nugget based on calendar date.
 * @param {string|Date} [date=new Date()]
 * @returns {Object} Wisdom nugget
 */
export function getDailyFinancialWisdom(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const index = Math.abs(dayOfYear) % WISDOM_NUGGETS.length;
  return WISDOM_NUGGETS[index];
}

/**
 * Generates tailored wisdom recommendations based on user financial diagnostics.
 * @param {Object} profile - { savingsRatePct, emergencyMonths, subscriptionCount, debtRatioPct, netSavings }
 * @returns {Array<Object>} Relevant wisdom nuggets matching user context
 */
export function getContextualWisdom(profile = {}) {
  const {
    savingsRatePct = 15,
    emergencyMonths = 3,
    subscriptionCount = 2,
    debtRatioPct = 0,
    netSavings = 500,
  } = profile;

  const results = [];

  if (netSavings < 0 || savingsRatePct < 10) {
    results.push(WISDOM_NUGGETS.find((w) => w.id === 'WISDOM-02')); // Pay yourself first
    results.push(WISDOM_NUGGETS.find((w) => w.id === 'WISDOM-01')); // 24-hour rule
  }

  if (subscriptionCount >= 4) {
    results.push(WISDOM_NUGGETS.find((w) => w.id === 'WISDOM-05')); // Subscription audit
  }

  if (debtRatioPct > 20) {
    results.push(WISDOM_NUGGETS.find((w) => w.id === 'WISDOM-06')); // Minimum payment illusion
  }

  if (emergencyMonths >= 6 && savingsRatePct >= 20) {
    results.push(WISDOM_NUGGETS.find((w) => w.id === 'WISDOM-03')); // Time in market
    results.push(WISDOM_NUGGETS.find((w) => w.id === 'WISDOM-04')); // Lifestyle creep
  }

  if (results.length === 0) {
    results.push(getDailyFinancialWisdom());
  }

  // Deduplicate
  const unique = [];
  const seen = new Set();
  results.forEach((item) => {
    if (item && !seen.has(item.id)) {
      seen.add(item.id);
      unique.push(item);
    }
  });

  return unique;
}

/**
 * Filters wisdom nuggets by category.
 * @param {string} category
 * @returns {Array<Object>}
 */
export function getWisdomByCategory(category) {
  if (!category || category === 'ALL') return WISDOM_NUGGETS;
  return WISDOM_NUGGETS.filter((w) => w.category === category);
}
