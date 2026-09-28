import { FINANCIAL_CATEGORIES } from './categoriesData';

/**
 * Diccionario canónico de comercios y patrones de texto frecuentes
 */
export const MERCHANT_PATTERNS = [
  // Supermercado & Alimentación
  {
    pattern: /(supermercado|walmart|carrefour|mercadona|costco|oxxo|dia|lidl|alcampo|exito|jumbo|coto|chango|panaderia|fruteria|carniceria|abarrotes|grocery|market)/i,
    category: 'Alimentación',
    subCategory: 'Supermercado',
    confidence: 0.95,
  },
  // Restaurantes & Delivery
  {
    pattern: /(restaurante|mcdonald|burger king|starbucks|pizzeria|kfc|subway|sushi|cafeteria|bar|tacos|uber\s*eats|rappi|pedidosya|glovo|just\s*eat|dominos|wendys|bistro|taqueria)/i,
    category: 'Alimentación',
    subCategory: 'Restaurantes & Cenas',
    confidence: 0.95,
  },
  // Transporte & Combustible
  {
    pattern: /(gasolinera|repsol|cepsa|shell|bp|pemex|ypf|combustible|gasolina|diesel|peaje|parking|estacionamiento|estacion\s*de\s*servicio)/i,
    category: 'Transporte & Movilidad',
    subCategory: 'Combustible',
    confidence: 0.95,
  },
  {
    pattern: /(uber(?!(\s*eats))|cabify|didi|bolt|taxi|metro|subte|autobus|tren|renfe|transmilenio|bip|sube)/i,
    category: 'Transporte & Movilidad',
    subCategory: 'Transporte Público',
    confidence: 0.90,
  },
  // Vivienda & Suministros
  {
    pattern: /(alquiler|arriendo|hipoteca|renta|comunidad\s*de\s*propietarios|inmobiliaria)/i,
    category: 'Vivienda & Servicios',
    subCategory: 'Alquiler / Hipoteca',
    confidence: 0.95,
  },
  {
    pattern: /(electricidad|luz|gas\s*natural|agua|enel|iberdrola|naturgy|endesa|cfe|concesionaria|aqualia|sedapal)/i,
    category: 'Vivienda & Servicios',
    subCategory: 'Electricidad & Gas',
    confidence: 0.95,
  },
  {
    pattern: /(internet|fibra|movistar|vodafone|orange|claro|tigo|telmex|at&t|telefonia)/i,
    category: 'Vivienda & Servicios',
    subCategory: 'Internet & Fibra',
    confidence: 0.90,
  },
  // Software & Cloud (SaaS)
  {
    pattern: /(aws|amazon\s*web\s*services|google\s*cloud|gcp|azure|digitalocean|vercel|heroku|github|openai|chatgpt|anthropic|jetbrains|cursor|docker|cloudflare|datadog|figma|notion|slack|zoom|jira|atlassian)/i,
    category: 'Software & Cloud',
    subCategory: 'Servidores & Cloud',
    confidence: 0.95,
  },
  // Salud & Bienestar
  {
    pattern: /(farmacia|cruz\s*verde|san\s*pablo|benavides|botica|medicamento|doctor|hospital|clinica|medico|dentista|odontolog|optica|gym|gimnasio|smart\s*fit|crossfit|sanitas|bupa|mapfre|seguro\s*medico)/i,
    category: 'Salud & Bienestar',
    subCategory: 'Farmacia & Medicamentos',
    confidence: 0.90,
  },
  // Streaming, Ocio & Compras
  {
    pattern: /(netflix|spotify|disney\+|hbo|max|prime\s*video|youtube\s*premium|apple\s*music|steam|playstation|psn|nintendo|xbox|cinema|cine|cinemark|cinepolis|concierto|ticketmaster)/i,
    category: 'Ocio & Cultura',
    subCategory: 'Streaming & Entretenimiento',
    confidence: 0.95,
  },
  {
    pattern: /(zara|h&m|mango|pull&bear|nike|adidas|bershka|stradivarius|shein|asos|amazon\s*es|amazon\s*com)/i,
    category: 'Ocio & Cultura',
    subCategory: 'Ropa & Estilo',
    confidence: 0.85,
  },
  // Ingresos
  {
    pattern: /(nomina|sueldo|salario|payroll|honorarios|factura\s*cliente|pago\s*consultoria|freelance|remuneracion|deposito\s*nomina)/i,
    category: 'Ingresos Profesionales',
    subCategory: 'Nómina / Salario',
    confidence: 0.95,
  },
  // Inversión & Ahorro
  {
    pattern: /(vanguard|blackrock|etf|fondos\s*indexados|s&p\s*500|sp500|interactive\s*brokers|degiro|trade\s*republic|binance|coinbase|kraken|bitso|aportacion\s*ahorro|fondo\s*de\s*emergencia)/i,
    category: 'Inversión & Ahorro',
    subCategory: 'Fondos Indexados',
    confidence: 0.95,
  },
];

/**
 * Sugiere de forma inteligente la categoría y subcategoría para un concepto de transacción dado
 * @param {string} concept - Texto del concepto o nombre del comercio
 * @param {Array} [customRules] - Reglas personalizadas configuradas por el usuario [{ pattern, category, subCategory }]
 * @returns {Object|null} Sugerencia con categoría, subcategoría, confianza y metadatos
 */
export function suggestCategory(concept, customRules = []) {
  if (!concept || typeof concept !== 'string') return null;

  const normalizedText = concept
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar tildes para búsqueda flexible
    .trim();

  if (!normalizedText) return null;

  // 1. Evaluar primero reglas personalizadas del usuario (prioridad alta)
  for (const rule of customRules) {
    let regex = rule.pattern;
    if (typeof regex === 'string') {
      try {
        regex = new RegExp(rule.pattern, 'i');
      } catch {
        regex = null;
      }
    }
    if (regex && regex.test(normalizedText)) {
      const categoryObj = FINANCIAL_CATEGORIES.find((c) => c.name.toLowerCase() === (rule.category || '').toLowerCase());
      return {
        category: rule.category,
        subCategory: rule.subCategory || null,
        confidence: 1.0,
        icon: categoryObj ? categoryObj.icon : '💡',
        color: categoryObj ? categoryObj.color : '#10b981',
        source: 'CUSTOM_RULE',
      };
    }
  }

  // 2. Evaluar diccionario estándar de comercios
  for (const item of MERCHANT_PATTERNS) {
    if (item.pattern.test(normalizedText)) {
      const categoryObj = FINANCIAL_CATEGORIES.find((c) => c.name.toLowerCase() === item.category.toLowerCase());
      return {
        category: item.category,
        subCategory: item.subCategory,
        confidence: item.confidence,
        icon: categoryObj ? categoryObj.icon : '🏷️',
        color: categoryObj ? categoryObj.color : '#10b981',
        source: 'MERCHANT_DICTIONARY',
      };
    }
  }

  return null;
}
