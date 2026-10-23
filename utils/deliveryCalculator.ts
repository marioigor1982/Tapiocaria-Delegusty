// Utility for calculating delivery distance and shipping fees based on store origin and customer address

export const STORE_INFO = {
  name: 'Tapioca Delegusty',
  address: 'Travessa Casca Preciosa, 54 - Cohab Adventista, São Paulo - SP',
  cep: '05868-140',
  fullAddress: 'Travessa Casca Preciosa, 54 - Cohab Adventista, São Paulo - SP, CEP 05868-140',
  coordinates: {
    lat: -23.6667,
    lng: -46.7770,
  },
  pricePerKm: 2.50, // R$ 2,50 por km solicitado pelo cliente
};

export interface DeliveryCalculationResult {
  success: boolean;
  distanceKm: number;
  fee: number;
  feeFormatted: string; // e.g. "7,50" or "10,00"
  explanation: string; // e.g. "3,2 km × R$ 2,50 = R$ 8,00"
  resolvedAddress?: string;
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
  'embú das artes': { lat: -23.6490, lng: -46.8520 },
  'embu das artes': { lat: -23.6490, lng: -46.8520 },
  'taboao da serra': { lat: -23.6260, lng: -46.7580 },
  'taboão da serra': { lat: -23.6260, lng: -46.7580 },
};

// Look up address details via CEP (ViaCEP)
export const fetchAddressByCep = async (rawCep: string): Promise<{
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  full?: string;
} | null> => {
  const clean = rawCep.replace(/\D/g, '');
  if (clean.length !== 8) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const resp = await fetch(`https://viacep.com.br/ws/${clean}/json/`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.erro) return null;

    const parts = [
      data.logradouro,
      data.bairro,
      data.localidade ? `${data.localidade} - ${data.uf}` : '',
      `CEP ${data.cep}`,
    ].filter(Boolean);

    return {
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
      full: parts.join(', '),
    };
  } catch (err) {
    console.warn('ViaCEP lookup error:', err);
    return null;
  }
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
        'Accept': 'application/json',
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
        // Return kilometers with 1 decimal precision
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
 * Main function to calculate delivery fee:
 * Formula: Distância (km) × R$ 2,50
 *
 * Automatically handles:
 * - CEPs (extracts address details and geocodes)
 * - Street names and neighborhoods
 * - Real driving routes (OSRM) or calibrated street Haversine (1.35x)
 * - Returns structured fee and distance for UI display & automatic input fill
 */
export const calculateDeliveryFee = async (
  inputAddress: string
): Promise<DeliveryCalculationResult> => {
  const trimmed = inputAddress.trim();
  if (!trimmed) {
    return {
      success: false,
      distanceKm: 0,
      fee: 0,
      feeFormatted: '0,00',
      explanation: 'Informe o endereço ou CEP do cliente para calcular.',
      source: 'fallback',
      error: 'Endereço vazio',
    };
  }

  // 1. Check if user typed or included a CEP (8 consecutive digits or 00000-000)
  const cepMatch = trimmed.match(/\b\d{5}-?\d{3}\b/);
  let resolvedAddressStr: string | undefined;
  let targetSearchQuery = trimmed;

  if (cepMatch) {
    const cepInfo = await fetchAddressByCep(cepMatch[0]);
    if (cepInfo && cepInfo.full) {
      resolvedAddressStr = cepInfo.full;
      // Search with resolved address
      targetSearchQuery = `${cepInfo.street || ''}, ${cepInfo.neighborhood || ''}, São Paulo - SP`;
    }
  }

  // 2. Geocode destination address
  let geo = await geocodeAddress(targetSearchQuery);

  // If failed and had a resolved address from CEP, try searching just with neighborhood/city
  if (!geo && resolvedAddressStr) {
    geo = await geocodeAddress(resolvedAddressStr);
  }

  // 3. If geocoded successfully, calculate distance
  if (geo) {
    let finalDistanceKm: number | null = await getDrivingRouteDistanceKm(geo.lat, geo.lng);
    let source: DeliveryCalculationResult['source'] = 'driving_route';

    // Fallback to Haversine × 1.35 (urban road factor) if OSRM was unavailable
    if (finalDistanceKm === null || finalDistanceKm <= 0) {
      const straightLineKm = calculateHaversineDistanceKm(
        STORE_INFO.coordinates.lat,
        STORE_INFO.coordinates.lng,
        geo.lat,
        geo.lng
      );
      // City driving distance is on average ~35% longer than straight line in São Paulo
      finalDistanceKm = parseFloat(Math.max(0.5, straightLineKm * 1.35).toFixed(1));
      source = 'haversine_estimate';
    }

    // Minimum distance display 0.5 km
    const distanceKm = Math.max(0.5, finalDistanceKm);
    // Formula: Distância × R$ 2,50
    const rawFee = distanceKm * STORE_INFO.pricePerKm;
    // Round to 2 decimals
    const fee = parseFloat(rawFee.toFixed(2));
    const feeFormatted = formatDecimalFee(fee);
    const explanation = `${distanceKm.toFixed(1).replace('.', ',')} km × R$ 2,50/km = R$ ${feeFormatted}`;

    return {
      success: true,
      distanceKm,
      fee,
      feeFormatted,
      explanation,
      resolvedAddress: resolvedAddressStr,
      source,
    };
  }

  // 4. Fallback if geocoding failed (e.g. partial neighborhood or offline)
  // Check CEP prefix for São Paulo south zone approximation
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length >= 5) {
    const prefix5 = digitsOnly.slice(0, 5);
    let estimatedKm = 3.0; // default local radius
    if (prefix5.startsWith('058')) {
      estimatedKm = 2.0; // Capão Redondo / Cohab Adventista local
    } else if (prefix5.startsWith('057')) {
      estimatedKm = 5.0; // Campo Limpo
    } else if (prefix5.startsWith('047') || prefix5.startsWith('048')) {
      estimatedKm = 7.0; // Santo Amaro / Grajaú
    } else if (prefix5.startsWith('06')) {
      estimatedKm = 8.5; // Taboão / Embu / Itapecerica
    }

    const fee = parseFloat((estimatedKm * STORE_INFO.pricePerKm).toFixed(2));
    const feeFormatted = formatDecimalFee(fee);
    return {
      success: true,
      distanceKm: estimatedKm,
      fee,
      feeFormatted,
      explanation: `~${estimatedKm.toFixed(1).replace('.', ',')} km (estimado por região) × R$ 2,50/km = R$ ${feeFormatted}`,
      resolvedAddress: resolvedAddressStr,
      source: 'cep_estimate',
    };
  }

  // Last resort default local estimate
  const defaultKm = 3.0;
  const defaultFee = parseFloat((defaultKm * STORE_INFO.pricePerKm).toFixed(2));
  return {
    success: false,
    distanceKm: defaultKm,
    fee: defaultFee,
    feeFormatted: formatDecimalFee(defaultFee),
    explanation: `Não foi possível localizar o ponto exato. Sugestão base (~3 km × R$ 2,50 = R$ ${formatDecimalFee(defaultFee)}), ou digite o valor desejado.`,
    source: 'fallback',
    error: 'Endereço não localizado',
  };
};
