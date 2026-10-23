// Utility for calculating delivery distance and shipping fees based on store origin and customer address
// Store: Travessa Casca Preciosa, 54 - Cohab Adventista, São Paulo - SP, CEP 05868-140
// Rate: R$ 2,50 por KM

export const STORE_INFO = {
  name: 'Tapioca Delegusty',
  street: 'Travessa Casca Preciosa, 54',
  neighborhood: 'Cohab Adventista',
  city: 'São Paulo',
  state: 'SP',
  address: 'Travessa Casca Preciosa, 54 - Cohab Adventista, São Paulo - SP',
  cep: '05868-140',
  fullAddress: 'Travessa Casca Preciosa, 54 - Cohab Adventista, São Paulo - SP, CEP 05868-140',
  coordinates: {
    lat: -23.6667,
    lng: -46.7770,
  },
  pricePerKm: 2.50, // R$ 2,50 por km estrito solicitado pelo cliente
  maxStandardRadiusKm: 15.0, // Raio padrão de 15 km
};

export interface CepAddressData {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  full: string;
}

export interface DeliveryCalculationResult {
  success: boolean;
  distanceKm: number;
  fee: number;
  feeFormatted: string; // e.g. "7,50" or "10,00"
  explanation: string; // e.g. "3,2 km × R$ 2,50 = R$ 8,00"
  isOverRadius: boolean; // true if distanceKm > 15 km
  resolvedAddress?: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  source: 'driving_route' | 'haversine_estimate' | 'cep_estimate' | 'fallback';
  error?: string;
}

// Haversine formula (straight-line distance between two coordinates in km)
export const calculateHaversineDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Format BRL number to 2 decimals string with comma (e.g. 7.5 -> "7,50")
export const formatDecimalFee = (num: number): string => {
  return num.toFixed(2).replace('.', ',');
};

// Format raw CEP string into 00000-000
export const formatCepString = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

// Known approximate coordinates for main neighborhoods / zones around Capão Redondo & SP
const NEIGHBORHOOD_CACHE: Record<string, { lat: number; lng: number }> = {
  'cohab adventista': { lat: -23.6667, lng: -46.7770 },
  'instituto adventista': { lat: -23.6667, lng: -46.7770 },
  'capao redondo': { lat: -23.6719, lng: -46.7794 },
  'capão redondo': { lat: -23.6719, lng: -46.7794 },
  'parque do engenho': { lat: -23.6610, lng: -46.7820 },
  'jardim comercial': { lat: -23.6740, lng: -46.7890 },
  'valo velho': { lat: -23.6840, lng: -46.7860 },
  'campo limpo': { lat: -23.6490, lng: -46.7580 },
  'vila das belezas': { lat: -23.6420, lng: -46.7420 },
  'jardim sao luis': { lat: -23.6650, lng: -46.7410 },
  'jardim são luís': { lat: -23.6650, lng: -46.7410 },
  'santo amaro': { lat: -23.6530, lng: -46.7050 },
  'socorro': { lat: -23.6860, lng: -46.7120 },
  'grajau': { lat: -23.7380, lng: -46.6970 },
  'grajaú': { lat: -23.7380, lng: -46.6970 },
  'interlagos': { lat: -23.7010, lng: -46.6870 },
  'itapecerica da serra': { lat: -23.7170, lng: -46.8490 },
  'embu das artes': { lat: -23.6490, lng: -46.8520 },
  'embú das artes': { lat: -23.6490, lng: -46.8520 },
  'taboao da serra': { lat: -23.6260, lng: -46.7580 },
  'taboão da serra': { lat: -23.6260, lng: -46.7580 },
  'morumbi': { lat: -23.6030, lng: -46.7180 },
  'vila andrade': { lat: -23.6330, lng: -46.7320 },
};

// Look up address details via CEP (ViaCEP with BrasilAPI fallback)
export const fetchAddressByCep = async (rawCep: string): Promise<CepAddressData | null> => {
  const clean = rawCep.replace(/\D/g, '');
  if (clean.length !== 8) return null;

  // 1. Try ViaCEP
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const resp = await fetch(`https://viacep.com.br/ws/${clean}/json/`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (resp.ok) {
      const data = await resp.json();
      if (!data.erro) {
        const parts = [
          data.logradouro,
          data.bairro,
          data.localidade ? `${data.localidade} - ${data.uf}` : '',
          `CEP ${data.cep}`,
        ].filter(Boolean);

        return {
          cep: data.cep || formatCepString(clean),
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || 'São Paulo',
          state: data.uf || 'SP',
          full: parts.join(', '),
        };
      }
    }
  } catch (err) {
    console.warn('ViaCEP lookup error, trying fallback:', err);
  }

  // 2. Fallback to BrasilAPI
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const resp = await fetch(`https://brasilapi.com.br/api/cep/v1/${clean}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (resp.ok) {
      const data = await resp.json();
      const parts = [
        data.street,
        data.neighborhood,
        data.city ? `${data.city} - ${data.state}` : '',
        `CEP ${formatCepString(clean)}`,
      ].filter(Boolean);

      return {
        cep: formatCepString(clean),
        street: data.street || '',
        neighborhood: data.neighborhood || '',
        city: data.city || 'São Paulo',
        state: data.state || 'SP',
        full: parts.join(', '),
      };
    }
  } catch (err) {
    console.warn('BrasilAPI fallback error:', err);
  }

  return null;
};

// Geocode query string to { lat, lng } using Nominatim OpenStreetMap
export const geocodeAddress = async (
  query: string
): Promise<{ lat: number; lng: number; displayName: string } | null> => {
  try {
    const cleanQuery = query.trim();
    if (!cleanQuery) return null;

    // Check neighborhood cache first
    const lower = cleanQuery.toLowerCase();
    for (const [key, coords] of Object.entries(NEIGHBORHOOD_CACHE)) {
      if (lower.includes(key)) {
        return {
          ...coords,
          displayName: key.toUpperCase(),
        };
      }
    }

    // Enhance query with São Paulo context if not present
    let searchQuery = cleanQuery;
    if (!searchQuery.toLowerCase().includes('são paulo') && !searchQuery.toLowerCase().includes('sp')) {
      searchQuery += ', São Paulo - SP, Brasil';
    } else if (!searchQuery.toLowerCase().includes('brasil')) {
      searchQuery += ', Brasil';
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      searchQuery
    )}&limit=1&countrycodes=br`;

    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timeout);

    if (!resp.ok) return null;
    const list = await resp.json();
    if (!Array.isArray(list) || list.length === 0) return null;

    const first = list[0];
    const lat = parseFloat(first.lat);
    const lng = parseFloat(first.lon);

    if (isNaN(lat) || isNaN(lng)) return null;

    return {
      lat,
      lng,
      displayName: first.display_name,
    };
  } catch (err) {
    console.warn('Geocoding error:', err);
    return null;
  }
};

// Query real driving route distance in km using OSRM
export const getDrivingRouteDistanceKm = async (
  lat: number,
  lng: number
): Promise<number | null> => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const store = STORE_INFO.coordinates;
    const url = `https://router.project-osrm.org/route/v1/driving/${store.lng},${store.lat};${lng},${lat}?overview=false`;

    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!resp.ok) return null;
    const data = await resp.json();

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const distanceMeters = data.routes[0].distance;
      if (typeof distanceMeters === 'number' && distanceMeters > 0) {
        return parseFloat((distanceMeters / 1000).toFixed(1));
      }
    }
    return null;
  } catch (err) {
    console.warn('OSRM routing error:', err);
    return null;
  }
};

/**
 * Calculates delivery fee given a mandatory CEP plus optional number and complement
 * Rate: R$ 2,50 por KM
 * Radius warning: distanceKm > 15 km
 */
export const calculateDeliveryByCep = async (
  rawCep: string,
  streetNumber?: string,
  complement?: string
): Promise<DeliveryCalculationResult> => {
  const cleanCep = rawCep.replace(/\D/g, '');
  if (cleanCep.length !== 8) {
    return {
      success: false,
      distanceKm: 0,
      fee: 0,
      feeFormatted: '0,00',
      explanation: 'Digite um CEP válido com 8 dígitos para calcular o frete.',
      isOverRadius: false,
      source: 'fallback',
      error: 'CEP inválido ou incompleto',
    };
  }

  // 1. Fetch CEP details
  const cepData = await fetchAddressByCep(cleanCep);
  const formattedCep = formatCepString(cleanCep);

  let targetSearchQuery = '';
  let street = cepData?.street || '';
  let neighborhood = cepData?.neighborhood || '';
  let city = cepData?.city || 'São Paulo';
  let state = cepData?.state || 'SP';

  if (cepData && cepData.street) {
    targetSearchQuery = `${cepData.street}${streetNumber ? ' ' + streetNumber : ''}, ${cepData.neighborhood}, ${cepData.city} - ${cepData.state}`;
  } else if (cepData && cepData.neighborhood) {
    targetSearchQuery = `${cepData.neighborhood}, ${cepData.city} - ${cepData.state}`;
  } else {
    targetSearchQuery = `CEP ${formattedCep}, São Paulo - SP, Brasil`;
  }

  // Construct full formatted address
  const fullAddressParts = [
    street ? (streetNumber ? `${street}, ${streetNumber}` : street) : (streetNumber ? `Nº ${streetNumber}` : ''),
    complement ? complement.trim() : '',
    neighborhood,
    city && state ? `${city} - ${state}` : 'São Paulo - SP',
    `CEP ${formattedCep}`,
  ].filter(Boolean);
  const resolvedAddress = fullAddressParts.join(', ');

  // 2. Geocode destination address
  let geo = await geocodeAddress(targetSearchQuery);
  if (!geo && neighborhood) {
    geo = await geocodeAddress(`${neighborhood}, ${city} - ${state}, Brasil`);
  }
  if (!geo) {
    geo = await geocodeAddress(`CEP ${cleanCep}, São Paulo, Brasil`);
  }

  // 3. Distance calculation
  if (geo) {
    let finalDistanceKm: number | null = await getDrivingRouteDistanceKm(geo.lat, geo.lng);
    let source: DeliveryCalculationResult['source'] = 'driving_route';

    // Fallback to calibrated Haversine if driving service was unreachable
    if (finalDistanceKm === null || finalDistanceKm <= 0) {
      const straightLineKm = calculateHaversineDistanceKm(
        STORE_INFO.coordinates.lat,
        STORE_INFO.coordinates.lng,
        geo.lat,
        geo.lng
      );
      finalDistanceKm = parseFloat(Math.max(0.5, straightLineKm * 1.35).toFixed(1));
      source = 'haversine_estimate';
    }

    const distanceKm = Math.max(0.5, finalDistanceKm);
    const rawFee = distanceKm * STORE_INFO.pricePerKm;
    const fee = parseFloat(rawFee.toFixed(2));
    const feeFormatted = formatDecimalFee(fee);
    const isOverRadius = distanceKm > STORE_INFO.maxStandardRadiusKm;
    const explanation = `${distanceKm.toFixed(1).replace('.', ',')} km × R$ 2,50/km = R$ ${feeFormatted}`;

    return {
      success: true,
      distanceKm,
      fee,
      feeFormatted,
      explanation,
      isOverRadius,
      resolvedAddress,
      street,
      neighborhood,
      city,
      state,
      source,
    };
  }

  // 4. Fallback estimation by CEP prefix (São Paulo zones)
  const prefix5 = cleanCep.slice(0, 5);
  let estimatedKm = 3.5;
  if (prefix5.startsWith('058')) {
    estimatedKm = 2.0; // Cohab Adventista / Capão Redondo local
  } else if (prefix5.startsWith('057')) {
    estimatedKm = 5.0; // Campo Limpo
  } else if (prefix5.startsWith('047') || prefix5.startsWith('048')) {
    estimatedKm = 7.5; // Santo Amaro / Grajaú
  } else if (prefix5.startsWith('06')) {
    estimatedKm = 8.5; // Taboão da Serra / Embu
  } else if (prefix5.startsWith('01') || prefix5.startsWith('02') || prefix5.startsWith('03')) {
    estimatedKm = 18.0; // Centro / Zona Norte / Zona Leste (> 15 km)
  }

  const rawFee = estimatedKm * STORE_INFO.pricePerKm;
  const fee = parseFloat(rawFee.toFixed(2));
  const feeFormatted = formatDecimalFee(fee);
  const isOverRadius = estimatedKm > STORE_INFO.maxStandardRadiusKm;
  const explanation = `~${estimatedKm.toFixed(1).replace('.', ',')} km (estimado) × R$ 2,50/km = R$ ${feeFormatted}`;

  return {
    success: true,
    distanceKm: estimatedKm,
    fee,
    feeFormatted,
    explanation,
    isOverRadius,
    resolvedAddress,
    street,
    neighborhood,
    city,
    state,
    source: 'cep_estimate',
  };
};

/**
 * Backward compatibility wrapper for generic query strings
 */
export const calculateDeliveryFee = async (
  inputAddress: string
): Promise<DeliveryCalculationResult> => {
  const trimmed = inputAddress.trim();
  const cepMatch = trimmed.match(/\b\d{5}-?\d{3}\b/) || trimmed.match(/\b\d{8}\b/);
  if (cepMatch) {
    return calculateDeliveryByCep(cepMatch[0]);
  }
  return calculateDeliveryByCep(trimmed.replace(/\D/g, ''));
};
