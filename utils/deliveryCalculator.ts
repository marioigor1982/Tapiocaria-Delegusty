// Utility for calculating delivery distance and shipping fees based on store origin and customer address
// Store: Travessa Casca Preciosa, 54 - Cohab Adventista, São Paulo - SP, CEP 05868-140
// Rate:
// - De 0 km até 1,99 km: Taxa fixa base de R$ 2,50 (equivalente a 1 km)
// - A partir de 2,0 km: Distância real em km × R$ 2,50

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
  pricePerKm: 2.50, // R$ 2,50 por km rodado
  baseFee: 2.50, // Taxa fixa base de R$ 2,50 para até 1,99 km
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
  feeFormatted: string; // e.g. "2,50", "5,00" or "12,50"
  explanation: string; // e.g. "3,3 km × R$ 2,50/km = R$ 8,25"
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

/**
 * 1. Fetch address details via CEP (ViaCEP with BrasilAPI fallback)
 */
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

/**
 * 2. Geocode address query to { lat, lng } using Photon (Komoot) with OSM/Nominatim fallback
 * Photon supports full CORS in browsers and biases results directly to store origin coordinates.
 */
export const geocodeAddressReal = async (
  query: string
): Promise<{ lat: number; lng: number; displayName: string } | null> => {
  const cleanQuery = query.trim();
  if (!cleanQuery) return null;

  const store = STORE_INFO.coordinates;

  // Attempt A: Photon Geocoding (CORS-friendly, OpenStreetMap based, biased to store lat/lng)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
      cleanQuery
    )}&lat=${store.lat}&lon=${store.lng}&limit=2`;

    const resp = await fetch(photonUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (resp.ok) {
      const data = await resp.json();
      const feature = data.features?.[0];
      if (feature && feature.geometry && Array.isArray(feature.geometry.coordinates)) {
        const [lon, lat] = feature.geometry.coordinates;
        if (!isNaN(lat) && !isNaN(lon)) {
          const props = feature.properties || {};
          const name = [props.name || props.street, props.district || props.city, props.state]
            .filter(Boolean)
            .join(', ');
          return {
            lat: parseFloat(lat),
            lng: parseFloat(lon),
            displayName: name || cleanQuery,
          };
        }
      }
    }
  } catch (err) {
    console.warn('Photon geocoding error, falling back:', err);
  }

  // Attempt B: Nominatim with South-West São Paulo viewbox
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const spViewbox = '-46.95,-23.45,-46.55,-23.85';
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      cleanQuery + ', São Paulo'
    )}&viewbox=${spViewbox}&limit=1`;

    const resp = await fetch(nomUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (resp.ok) {
      const list = await resp.json();
      if (Array.isArray(list) && list.length > 0) {
        const first = list[0];
        const lat = parseFloat(first.lat);
        const lng = parseFloat(first.lon);
        if (!isNaN(lat) && !isNaN(lng)) {
          return {
            lat,
            lng,
            displayName: first.display_name,
          };
        }
      }
    }
  } catch (err) {
    console.warn('Nominatim geocoding error:', err);
  }

  return null;
};

/**
 * 3. Query real driving route distance in km using OSRM
 * Returns real road driving distance (not straight line)
 */
export const getDrivingRouteDistanceKm = async (
  lat: number,
  lng: number
): Promise<number | null> => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const store = STORE_INFO.coordinates;
    const url = `https://router.project-osrm.org/route/v1/driving/${store.lng},${store.lat};${lng},${lat}?overview=false`;

    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (resp.ok) {
      const data = await resp.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const distanceMeters = data.routes[0].distance;
        if (typeof distanceMeters === 'number' && distanceMeters > 0) {
          return parseFloat((distanceMeters / 1000).toFixed(1));
        }
      }
    }
    return null;
  } catch (err) {
    console.warn('OSRM routing error:', err);
    return null;
  }
};

/**
 * Calculates delivery fee based on customer's CEP and address
 *
 * Business Rules:
 * 1. Origin: 05868-140 (Travessa Casca Preciosa, 54 - Cohab Adventista)
 * 2. Distance: Real driving distance from origin to customer address
 * 3. Pricing:
 *    - De 0 km até 1,99 km: Taxa fixa base de R$ 2,50 (equivalente a 1 km)
 *    - A partir de 2,0 km: Distância real exata × R$ 2,50
 *    - Se distância > 15 km: Alerta de confirmação
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

  // 2. Geocode destination address
  let geo: { lat: number; lng: number; displayName: string } | null = null;

  // Attempt 1: Search by street name + city
  if (street) {
    const streetQuery = `${street}, ${city}`;
    geo = await geocodeAddressReal(streetQuery);

    // If not found, try without street prefix (e.g. "Rua João Florêncio" -> "João Florêncio")
    if (!geo) {
      const cleanStreet = street.replace(
        /^(rua|avenida|travessa|alameda|estrada|rodovia|praça|r\.|av\.|tv\.)\s+/i,
        ''
      );
      if (cleanStreet !== street) {
        geo = await geocodeAddressReal(`${cleanStreet}, ${city}`);
      }
    }
  }

  // Attempt 2: If street not found, search by neighborhood + city
  if (!geo && neighborhood) {
    geo = await geocodeAddressReal(`${neighborhood}, ${city}`);
  }

  // Attempt 3: If still not found, search with CEP formatted
  if (!geo) {
    geo = await geocodeAddressReal(`CEP ${formattedCep}, ${city}`);
  }

  // 3. Compute real distance via OSRM driving route or calibrated road Haversine
  let finalDistanceKm: number | null = null;
  let source: DeliveryCalculationResult['source'] = 'driving_route';

  if (geo) {
    finalDistanceKm = await getDrivingRouteDistanceKm(geo.lat, geo.lng);

    // Fallback to calibrated Haversine if OSRM was temporarily unreachable
    if (finalDistanceKm === null || finalDistanceKm <= 0) {
      const straightLineKm = calculateHaversineDistanceKm(
        STORE_INFO.coordinates.lat,
        STORE_INFO.coordinates.lng,
        geo.lat,
        geo.lng
      );
      // City driving distance in SP is ~35% longer than straight line
      finalDistanceKm = parseFloat(Math.max(0.1, straightLineKm * 1.35).toFixed(1));
      source = 'haversine_estimate';
    }
  }

  // Fallback 4: If no geocode was possible, estimate by geographic CEP prefix
  if (finalDistanceKm === null || finalDistanceKm <= 0) {
    source = 'cep_estimate';
    const prefix5 = cleanCep.slice(0, 5);
    if (prefix5.startsWith('05868')) {
      finalDistanceKm = 0.5; // Loja / Cohab Adventista
    } else if (prefix5.startsWith('058')) {
      finalDistanceKm = 1.8; // Capão Redondo
    } else if (prefix5.startsWith('057')) {
      finalDistanceKm = 3.2; // Campo Limpo
    } else if (prefix5.startsWith('049')) {
      finalDistanceKm = 4.0; // Jardim Ângela
    } else if (prefix5.startsWith('067')) {
      finalDistanceKm = 5.5; // Taboão da Serra
    } else if (prefix5.startsWith('047') || prefix5.startsWith('048')) {
      finalDistanceKm = 7.5; // Santo Amaro / Socorro
    } else if (prefix5.startsWith('068')) {
      finalDistanceKm = 8.5; // Embu das Artes
    } else if (prefix5.startsWith('056')) {
      finalDistanceKm = 6.5; // Morumbi
    } else {
      finalDistanceKm = 18.0; // Centro / Outras zonas (> 15 km)
    }
  }

  const distanceKm = Math.max(0.1, finalDistanceKm);
  const distStr = distanceKm.toFixed(1).replace('.', ',');

  // ==========================================
  // Regra Oficial de Cobrança do Negócio:
  // - De 0 km até 1,99 km: Taxa fixa base de R$ 2,50 (equivalente a 1 km)
  // - A partir de 2,0 km: Distância real exata × R$ 2,50
  // ==========================================
  let fee: number;
  let feeFormatted: string;
  let explanation: string;

  if (distanceKm < 2.0) {
    fee = STORE_INFO.baseFee; // R$ 2,50 fixo
    feeFormatted = formatDecimalFee(fee);
    explanation = `${distStr} km (taxa fixa base de até 1,99 km) = R$ ${feeFormatted}`;
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
