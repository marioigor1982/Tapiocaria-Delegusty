// Utility for calculating delivery distance and shipping fees based on store origin and customer address
// Store: Travessa Casca Preciosa, 54 - Cohab Adventista, São Paulo - SP, CEP 05868-140
// Rate: R$ 2,50 por KM (Mínimo de R$ 2,50 para até 1 km)

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
  pricePerKm: 2.50, // R$ 2,50 por km
  minimumFee: 2.50, // Taxa fixa mínima de R$ 2,50 até 1 km
  maxStandardRadiusKm: 15.0, // Raio padrão de 15 km
};

// Search boundary box for São Paulo (favors Zona Sul/Oeste/Grande SP near store)
// minlon, maxlat, maxlon, minlat
const SP_SOUTH_WEST_VIEWBOX = '-46.95,-23.45,-46.55,-23.85';

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
  feeFormatted: string; // e.g. "2,50", "4,75" or "10,00"
  explanation: string; // e.g. "1,9 km × R$ 2,50/km = R$ 4,75"
  isOverRadius: boolean; // true if distanceKm > 15 km
  resolvedAddress?: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  source: 'driving_route' | 'haversine_estimate' | 'cep_estimate' | 'fallback';
  error?: string;
}

// Known approximate coordinates and max plausible radius (km) by CEP prefix around store
const CEP_PREFIX_MAP: Record<string, { lat: number; lng: number; defaultKm: number; maxPlausibleKm: number }> = {
  // Cohab Adventista / Loja local
  '05868': { lat: -23.6667, lng: -46.7770, defaultKm: 0.5, maxPlausibleKm: 2.0 },
  // Capão Redondo / Parque Fernanda / Cohab Adventista
  '058': { lat: -23.6700, lng: -46.7800, defaultKm: 1.8, maxPlausibleKm: 6.0 },
  // Campo Limpo / Jardim Ipê / Pirajussara (Vizinho imediato ao Capão Redondo!)
  '05797': { lat: -23.6535, lng: -46.7742, defaultKm: 1.9, maxPlausibleKm: 5.0 },
  '057': { lat: -23.6450, lng: -46.7650, defaultKm: 2.8, maxPlausibleKm: 7.0 },
  // Vila Sônia / Morumbi
  '056': { lat: -23.6020, lng: -46.7260, defaultKm: 6.5, maxPlausibleKm: 10.0 },
  // Butantã / Raposo
  '055': { lat: -23.5750, lng: -46.7280, defaultKm: 10.0, maxPlausibleKm: 15.0 },
  // Taboão da Serra (divisa com Campo Limpo)
  '067': { lat: -23.6260, lng: -46.7580, defaultKm: 5.0, maxPlausibleKm: 9.0 },
  // Embu das Artes
  '068': { lat: -23.6490, lng: -46.8520, defaultKm: 8.5, maxPlausibleKm: 13.0 },
  // Itapecerica da Serra
  '069': { lat: -23.7170, lng: -46.8490, defaultKm: 9.5, maxPlausibleKm: 15.0 },
  // Jardim Ângela / M'Boi Mirim
  '049': { lat: -23.6850, lng: -46.7550, defaultKm: 4.5, maxPlausibleKm: 8.5 },
  // Socorro / Interlagos / Cidade Dutra
  '048': { lat: -23.6950, lng: -46.7050, defaultKm: 7.5, maxPlausibleKm: 13.0 },
  // Santo Amaro
  '047': { lat: -23.6530, lng: -46.7050, defaultKm: 6.5, maxPlausibleKm: 10.0 },
  // Campo Belo / Brooklin
  '046': { lat: -23.6350, lng: -46.6750, defaultKm: 9.0, maxPlausibleKm: 13.0 },
  // Moema / Itaim Bibi
  '045': { lat: -23.5950, lng: -46.6750, defaultKm: 11.0, maxPlausibleKm: 16.0 },
};

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

// Format BRL number to 2 decimals string with comma (e.g. 4.75 -> "4,75")
export const formatDecimalFee = (num: number): string => {
  return num.toFixed(2).replace('.', ',');
};

// Format raw CEP string into 00000-000
export const formatCepString = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
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

// Geocode query string to { lat, lng } using Nominatim OpenStreetMap with viewbox bias
export const geocodeAddress = async (
  query: string,
  useViewbox = true
): Promise<{ lat: number; lng: number; displayName: string } | null> => {
  try {
    const cleanQuery = query.trim();
    if (!cleanQuery) return null;

    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      cleanQuery
    )}&limit=1&countrycodes=br`;

    if (useViewbox) {
      url += `&viewbox=${SP_SOUTH_WEST_VIEWBOX}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'TapiocaApp/1.0',
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
 * Rate rule:
 * - 0,01 km até 1,0 km: R$ 2,50 (taxa fixa mínima por km)
 * - Acima de 1,1 km em diante: distância em km × R$ 2,50
 * - Distância > 15 km: ativa aviso de confirmação
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

  // 1. Fetch CEP details via ViaCEP / BrasilAPI
  const cepData = await fetchAddressByCep(cleanCep);
  const formattedCep = formatCepString(cleanCep);

  const street = cepData?.street || '';
  const neighborhood = cepData?.neighborhood || '';
  const city = cepData?.city || 'São Paulo';
  const state = cepData?.state || 'SP';

  // Construct full formatted address
  const fullAddressParts = [
    street ? (streetNumber ? `${street}, Nº ${streetNumber}` : street) : (streetNumber ? `Nº ${streetNumber}` : ''),
    complement ? complement.trim() : '',
    neighborhood,
    city && state ? `${city} - ${state}` : 'São Paulo - SP',
    `CEP ${formattedCep}`,
  ].filter(Boolean);
  const resolvedAddress = fullAddressParts.join(', ');

  // 2. Identify CEP prefix zone parameters to prevent false-positive far-away namesake geocodes
  let matchedZone: { lat: number; lng: number; defaultKm: number; maxPlausibleKm: number } | null = null;
  for (const [prefix, zone] of Object.entries(CEP_PREFIX_MAP)) {
    if (cleanCep.startsWith(prefix)) {
      matchedZone = zone;
      break;
    }
  }

  // 3. Geocode destination address
  // CRITICAL FIX: Do NOT include neighborhood in Nominatim search if street is present!
  // In OSM, OpenStreetMap neighborhoods often differ from Correios (e.g. "Capão Redondo" vs "Jardim Ipê"),
  // which causes 0 results or false hits 60 km away in Vila Curuçá!
  let geo: { lat: number; lng: number; displayName: string } | null = null;

  if (street) {
    // Attempt 1: Street + City + South-West Viewbox
    geo = await geocodeAddress(`${street}, São Paulo, Brasil`, true);

    // Attempt 2: Strip street type (e.g. "Rua", "Avenida", "Travessa") + City
    if (!geo) {
      const cleanStreetName = street.replace(
        /^(rua|avenida|travessa|alameda|estrada|rodovia|praça|r\.|av\.|tv\.)\s+/i,
        ''
      );
      if (cleanStreetName !== street) {
        geo = await geocodeAddress(`${cleanStreetName}, São Paulo, Brasil`, true);
      }
    }
  }

  // Sanity check candidate coordinates against CEP zone if matched
  if (geo && matchedZone) {
    const straightKm = calculateHaversineDistanceKm(
      STORE_INFO.coordinates.lat,
      STORE_INFO.coordinates.lng,
      geo.lat,
      geo.lng
    );
    // If the geocoded point is impossibly far from what this CEP prefix allows, reject false namesake
    if (straightKm > matchedZone.maxPlausibleKm) {
      console.warn(
        `Geocode rejected for CEP ${cleanCep}: candidate ${geo.displayName} was ${straightKm.toFixed(1)} km away, max plausible is ${matchedZone.maxPlausibleKm} km`
      );
      geo = null;
    }
  }

  // Attempt 3: If street geocoding failed or was rejected, use matched zone coordinates directly
  if (!geo && matchedZone) {
    geo = {
      lat: matchedZone.lat,
      lng: matchedZone.lng,
      displayName: `Região CEP ${cleanCep.slice(0, 5)} - ${neighborhood || city}`,
    };
  }

  // Attempt 4: If still not found and we have a neighborhood
  if (!geo && neighborhood) {
    geo = await geocodeAddress(`${neighborhood}, Zona Sul, São Paulo, Brasil`, true);
  }

  // 4. Distance and Fee calculation
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
      finalDistanceKm = parseFloat(Math.max(0.1, straightLineKm * 1.35).toFixed(1));
      source = 'haversine_estimate';
    }

    const distanceKm = Math.max(0.1, finalDistanceKm);
    const distStr = distanceKm.toFixed(1).replace('.', ',');

    // Regra oficial do cliente:
    // De 0,01 km até 1,0 km: taxa fixa de R$ 2,50 (não pode ser R$ 1,25 ou menor que R$ 2,50)
    // Passando de 1,1 km em diante: o sistema calcula distância × R$ 2,50
    let fee: number;
    let feeFormatted: string;
    let explanation: string;

    if (distanceKm <= 1.0) {
      fee = 2.50;
      feeFormatted = formatDecimalFee(fee);
      explanation = `${distStr} km (taxa fixa mínima de até 1 km) = R$ ${feeFormatted}`;
    } else {
      const rawFee = distanceKm * STORE_INFO.pricePerKm;
      fee = parseFloat(rawFee.toFixed(2));
      feeFormatted = formatDecimalFee(fee);
      explanation = `${distStr} km × R$ 2,50/km = R$ ${feeFormatted}`;
    }

    const isOverRadius = distanceKm > STORE_INFO.maxStandardRadiusKm;

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

  // 5. Fallback estimation by CEP prefix if all services fail
  const prefix5 = cleanCep.slice(0, 5);
  let estimatedKm = 2.5;

  if (prefix5.startsWith('05868')) {
    estimatedKm = 0.5; // Cohab Adventista local
  } else if (prefix5.startsWith('058')) {
    estimatedKm = 1.8; // Capão Redondo local
  } else if (prefix5.startsWith('057')) {
    estimatedKm = 2.8; // Campo Limpo / Jardim Ipê
  } else if (prefix5.startsWith('049')) {
    estimatedKm = 4.5; // Jardim Ângela
  } else if (prefix5.startsWith('067')) {
    estimatedKm = 5.0; // Taboão da Serra
  } else if (prefix5.startsWith('047') || prefix5.startsWith('048')) {
    estimatedKm = 7.0; // Santo Amaro / Socorro
  } else if (prefix5.startsWith('068')) {
    estimatedKm = 8.5; // Embu das Artes
  } else if (prefix5.startsWith('01') || prefix5.startsWith('02') || prefix5.startsWith('03')) {
    estimatedKm = 18.0; // Centro / Zona Norte / Zona Leste (> 15 km)
  }

  let fee: number;
  let feeFormatted: string;
  let explanation: string;
  const distStr = estimatedKm.toFixed(1).replace('.', ',');

  if (estimatedKm <= 1.0) {
    fee = 2.50;
    feeFormatted = formatDecimalFee(fee);
    explanation = `~${distStr} km (taxa fixa mínima de até 1 km) = R$ ${feeFormatted}`;
  } else {
    const rawFee = estimatedKm * STORE_INFO.pricePerKm;
    fee = parseFloat(rawFee.toFixed(2));
    feeFormatted = formatDecimalFee(fee);
    explanation = `~${distStr} km (estimado) × R$ 2,50/km = R$ ${feeFormatted}`;
  }

  const isOverRadius = estimatedKm > STORE_INFO.maxStandardRadiusKm;

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

/**
 * Generates a Google Maps directions URL between store CEP and destination CEP / address
 * Origin: Travessa Casca Preciosa, 54 - Cohab Adventista, São Paulo - SP (05868-140)
 */
export const getGoogleMapsRouteUrl = (
  destinationCep: string,
  destinationAddress?: string
): string => {
  const cepOrigem = STORE_INFO.cep; // 05868-140
  const dest = (destinationAddress && destinationAddress.length > 5)
    ? destinationAddress.trim()
    : (destinationCep ? `CEP ${destinationCep.trim()}, São Paulo, SP` : 'São Paulo, SP');

  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    cepOrigem
  )}&destination=${encodeURIComponent(dest)}&travelmode=driving`;
};
