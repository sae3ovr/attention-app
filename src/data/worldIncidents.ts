import type { Incident, IncidentCategory, IncidentSeverity } from '../types';

interface WorldIncidentSeed {
  city: string;
  country: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  title: string;
  description: string;
  lat: number;
  lng: number;
  address: string;
  reporterName: string;
  reporterLevel: number;
  confirmCount: number;
  isVerified: boolean;
}

const SEEDS: WorldIncidentSeed[] = [
  // ─── FIRES ───
  { city: 'London', country: 'GB', category: 'fire', severity: 'critical', title: 'Warehouse fire in Docklands', description: 'Large fire in an abandoned warehouse. London Fire Brigade on site. Thick black smoke visible from miles.', lat: 51.5050, lng: -0.0225, address: 'Royal Victoria Dock, London', reporterName: 'James W.', reporterLevel: 14, confirmCount: 38, isVerified: true },
  { city: 'São Paulo', country: 'BR', category: 'fire', severity: 'high', title: 'Vegetation fire near Marginal Pinheiros', description: 'Dry vegetation fire spreading rapidly near the highway. Traffic diverted. Bombeiros deploying.', lat: -23.5678, lng: -46.6920, address: 'Marginal Pinheiros, São Paulo', reporterName: 'Rafael S.', reporterLevel: 9, confirmCount: 22, isVerified: true },
  { city: 'Sydney', country: 'AU', category: 'fire', severity: 'critical', title: 'Bushfire approaching suburbs', description: 'Bushfire moving toward outer suburbs. RFS issued emergency warning. Evacuations underway.', lat: -33.8100, lng: 150.9920, address: 'Blue Mountains, NSW', reporterName: 'Emily T.', reporterLevel: 18, confirmCount: 55, isVerified: true },
  { city: 'Tokyo', country: 'JP', category: 'fire', severity: 'medium', title: 'Kitchen fire in restaurant Shinjuku', description: 'Small fire in a ramen restaurant. Quickly contained by fire dept. Some smoke in surrounding streets.', lat: 35.6930, lng: 139.7010, address: 'Kabukichō, Shinjuku', reporterName: 'Yuki M.', reporterLevel: 7, confirmCount: 11, isVerified: false },
  { city: 'Lagos', country: 'NG', category: 'fire', severity: 'critical', title: 'Market fire in Balogun', description: 'Major fire at Balogun Market. Multiple stalls destroyed. Emergency services stretched thin.', lat: 6.4480, lng: 3.3930, address: 'Balogun Market, Lagos Island', reporterName: 'Adebayo K.', reporterLevel: 6, confirmCount: 42, isVerified: true },

  // ─── FLOODS ───
  { city: 'Mumbai', country: 'IN', category: 'flood', severity: 'critical', title: 'Severe flooding in Dharavi', description: 'Monsoon flooding has submerged streets. Water level over 1 meter. Residents trapped on upper floors.', lat: 19.0435, lng: 72.8535, address: 'Dharavi, Mumbai', reporterName: 'Priya D.', reporterLevel: 11, confirmCount: 67, isVerified: true },
  { city: 'Bangkok', country: 'TH', category: 'flood', severity: 'high', title: 'Flash flooding near Chatuchak', description: 'Sudden rain caused flash flooding. Roads impassable. BTS still operating but ground transport halted.', lat: 13.7999, lng: 100.5533, address: 'Chatuchak, Bangkok', reporterName: 'Somchai P.', reporterLevel: 8, confirmCount: 29, isVerified: true },
  { city: 'Paris', country: 'FR', category: 'flood', severity: 'high', title: 'Seine river flood alert', description: 'Water level rising dangerously. Quays closed to public. Precautionary evacuation in low areas.', lat: 48.8520, lng: 2.3476, address: 'Quai de la Seine, Paris', reporterName: 'Pierre L.', reporterLevel: 15, confirmCount: 34, isVerified: true },
  { city: 'Buenos Aires', country: 'AR', category: 'flood', severity: 'medium', title: 'Localized flooding in La Boca', description: 'Heavy rain caused sewer overflow. Several streets flooded with 30cm of water. Avoid driving.', lat: -34.6348, lng: -58.3630, address: 'La Boca, Buenos Aires', reporterName: 'Martín G.', reporterLevel: 5, confirmCount: 15, isVerified: false },

  // ─── INJURED ANIMALS ───
  { city: 'Rome', country: 'IT', category: 'injured_animal', severity: 'low', title: 'Injured stray dog near Colosseum', description: 'Large dog limping badly with injured front leg. Appears friendly but in pain. Needs veterinary help.', lat: 41.8905, lng: 12.4944, address: 'Via dei Fori Imperiali, Rome', reporterName: 'Giulia R.', reporterLevel: 4, confirmCount: 8, isVerified: false },
  { city: 'Istanbul', country: 'TR', category: 'injured_animal', severity: 'low', title: 'Cat colony needs medical attention', description: '~15 street cats showing signs of illness near the Spice Bazaar. Possible calicivirus outbreak.', lat: 41.0167, lng: 28.9700, address: 'Eminönü, Istanbul', reporterName: 'Ayşe B.', reporterLevel: 6, confirmCount: 12, isVerified: false },
  { city: 'Rio de Janeiro', country: 'BR', category: 'injured_animal', severity: 'medium', title: 'Injured sea turtle on Copacabana', description: 'Green sea turtle washed ashore with fishing net entangled. IBAMA notified. Volunteers keeping area clear.', lat: -22.9711, lng: -43.1826, address: 'Praia de Copacabana, Rio', reporterName: 'Camila F.', reporterLevel: 10, confirmCount: 25, isVerified: true },
  { city: 'Berlin', country: 'DE', category: 'injured_animal', severity: 'low', title: 'Injured fox in Tiergarten', description: 'Red fox with apparent leg injury spotted near the Victory Column. Animal rescue contacted.', lat: 52.5145, lng: 13.3502, address: 'Tiergarten, Berlin', reporterName: 'Hans M.', reporterLevel: 3, confirmCount: 5, isVerified: false },

  // ─── TRAFFIC ACCIDENTS ───
  { city: 'Mexico City', country: 'MX', category: 'accident', severity: 'high', title: 'Multi-vehicle crash on Periférico', description: '5-car pileup on the inner ring. 3 people injured. Two lanes completely blocked. Expect 1hr+ delays.', lat: 19.3730, lng: -99.1770, address: 'Periférico Sur, CDMX', reporterName: 'Carlos V.', reporterLevel: 12, confirmCount: 31, isVerified: true },
  { city: 'Seoul', country: 'KR', category: 'accident', severity: 'medium', title: 'Bus collision near Gangnam', description: 'City bus rear-ended a sedan at intersection. Moderate damage. Traffic backing up on Teheran-ro.', lat: 37.5015, lng: 127.0240, address: 'Teheran-ro, Gangnam-gu', reporterName: 'Ji-won K.', reporterLevel: 7, confirmCount: 14, isVerified: false },
  { city: 'Dubai', country: 'AE', category: 'accident', severity: 'critical', title: 'Truck overturned on Sheikh Zayed Road', description: 'Cargo truck overturned blocking 3 lanes. Fuel spill on road surface. Emergency teams on scene.', lat: 25.2048, lng: 55.2708, address: 'Sheikh Zayed Road, Dubai', reporterName: 'Ahmed N.', reporterLevel: 16, confirmCount: 48, isVerified: true },
  { city: 'Bogotá', country: 'CO', category: 'accident', severity: 'medium', title: 'Motorcycle accident Carrera 7', description: 'Motorcycle rider hit by car turning. Rider conscious but injured. Ambulance en route.', lat: 4.6580, lng: -74.0560, address: 'Carrera 7, Bogotá', reporterName: 'Sofía H.', reporterLevel: 5, confirmCount: 9, isVerified: false },
  { city: 'Nairobi', country: 'KE', category: 'accident', severity: 'high', title: 'Matatu crash on Thika Road', description: 'Public minibus crash involving matatu and private vehicle. Several passengers with injuries.', lat: -1.2205, lng: 36.8880, address: 'Thika Road, Nairobi', reporterName: 'Wanjiku M.', reporterLevel: 8, confirmCount: 20, isVerified: true },

  // ─── BUILDINGS AT RISK ───
  { city: 'Cairo', country: 'EG', category: 'building_risk', severity: 'critical', title: 'Building at risk of collapse', description: 'Residential building showing severe cracks in foundation. Residents evacuated. Structural engineers assessing.', lat: 30.0560, lng: 31.2460, address: 'Shubra, Cairo', reporterName: 'Mahmoud A.', reporterLevel: 9, confirmCount: 35, isVerified: true },
  { city: 'Shanghai', country: 'CN', category: 'building_risk', severity: 'high', title: 'Construction scaffolding collapse risk', description: 'Strong winds damaging scaffolding on 30-story building. Area cordoned off. Debris falling occasionally.', lat: 31.2350, lng: 121.4790, address: 'Pudong, Shanghai', reporterName: 'Wei L.', reporterLevel: 13, confirmCount: 27, isVerified: true },
  { city: 'Casablanca', country: 'MA', category: 'building_risk', severity: 'high', title: 'Old riad structure collapsing', description: 'Historic building in medina partially collapsed. Rubble on street. Authorities blocking access.', lat: 33.5730, lng: -7.5890, address: 'Ancienne Médina, Casablanca', reporterName: 'Fatima Z.', reporterLevel: 7, confirmCount: 18, isVerified: false },

  // ─── SUSPICIOUS PERSONS ───
  { city: 'New York', country: 'US', category: 'suspicious', severity: 'medium', title: 'Suspicious package at Penn Station', description: 'Unattended bag under bench near track 7. NYPD bomb squad notified. Area being cleared.', lat: 40.7505, lng: -73.9935, address: 'Penn Station, Manhattan', reporterName: 'Mike D.', reporterLevel: 10, confirmCount: 22, isVerified: true },
  { city: 'Amsterdam', country: 'NL', category: 'suspicious', severity: 'low', title: 'Person photographing door locks', description: 'Individual systematically photographing apartment building entry systems on Prinsengracht.', lat: 52.3745, lng: 4.8840, address: 'Prinsengracht, Amsterdam', reporterName: 'Joost V.', reporterLevel: 4, confirmCount: 6, isVerified: false },
  { city: 'Cape Town', country: 'ZA', category: 'suspicious', severity: 'high', title: 'Armed robbery suspect spotted', description: 'Suspect matching description from earlier robbery seen near Waterfront. Police notified.', lat: -33.9036, lng: 18.4207, address: 'V&A Waterfront, Cape Town', reporterName: 'Thando S.', reporterLevel: 11, confirmCount: 19, isVerified: true },

  // ─── ROBBERIES ───
  { city: 'Barcelona', country: 'ES', category: 'robbery', severity: 'high', title: 'Phone snatching on Las Ramblas', description: 'Group of pickpockets actively targeting tourists. Multiple phones snatched in last 30 min.', lat: 41.3814, lng: 2.1735, address: 'Las Ramblas, Barcelona', reporterName: 'Marc P.', reporterLevel: 13, confirmCount: 28, isVerified: true },
  { city: 'Johannesburg', country: 'ZA', category: 'robbery', severity: 'critical', title: 'Armed hijacking Sandton', description: 'Armed carjacking at intersection. Driver unharmed but vehicle taken. Black sedan last seen heading east.', lat: -26.1076, lng: 28.0567, address: 'Sandton Drive, Johannesburg', reporterName: 'Sipho N.', reporterLevel: 15, confirmCount: 32, isVerified: true },

  // ─── POLICE OPERATIONS ───
  { city: 'Chicago', country: 'US', category: 'police', severity: 'medium', title: 'CPD checkpoint on Michigan Ave', description: 'Police DUI checkpoint at Michigan & Congress. Expect 15-20 min delays. Have documents ready.', lat: 41.8762, lng: -87.6245, address: 'Michigan Ave, Chicago', reporterName: 'Lisa R.', reporterLevel: 8, confirmCount: 17, isVerified: false },
  { city: 'Toronto', country: 'CA', category: 'police', severity: 'high', title: 'Active police operation downtown', description: 'Heavy police presence on Queen St W. Multiple blocks cordoned off. Avoid the area.', lat: 43.6510, lng: -79.3890, address: 'Queen St W, Toronto', reporterName: 'Dave M.', reporterLevel: 11, confirmCount: 24, isVerified: true },

  // ─── MEDICAL EMERGENCIES ───
  { city: 'Moscow', country: 'RU', category: 'medical', severity: 'medium', title: 'Person collapsed at Arbat', description: 'Elderly person collapsed on the pedestrian street. Bystanders providing first aid. Ambulance called.', lat: 55.7510, lng: 37.5980, address: 'Arbat Street, Moscow', reporterName: 'Alexei P.', reporterLevel: 5, confirmCount: 8, isVerified: false },
  { city: 'Singapore', country: 'SG', category: 'medical', severity: 'high', title: 'Heat stroke cases at marathon', description: 'Multiple runners requiring medical attention near Marina Bay. AED deployed. SCDF responding.', lat: 1.2816, lng: 103.8636, address: 'Marina Bay, Singapore', reporterName: 'Li Wei C.', reporterLevel: 9, confirmCount: 21, isVerified: true },

  // ─── NOISE DISTURBANCES ───
  { city: 'Berlin', country: 'DE', category: 'noise', severity: 'low', title: 'Illegal rave in abandoned lot', description: 'Loud electronic music from construction site near Kreuzberg since midnight. Residents losing sleep.', lat: 52.4990, lng: 13.4190, address: 'Kreuzberg, Berlin', reporterName: 'Petra K.', reporterLevel: 3, confirmCount: 7, isVerified: false },

  // ─── TRAFFIC ISSUES ───
  { city: 'Los Angeles', country: 'US', category: 'traffic', severity: 'medium', title: 'Major gridlock on I-405', description: 'Complete standstill on northbound 405 from LAX to Santa Monica. Use PCH as alternative.', lat: 33.9610, lng: -118.4040, address: 'I-405, Los Angeles', reporterName: 'Sarah J.', reporterLevel: 6, confirmCount: 33, isVerified: false },
  { city: 'Beijing', country: 'CN', category: 'traffic', severity: 'medium', title: 'Construction causing gridlock Ring Road 3', description: 'Road work on Third Ring Road East. 2 lanes closed. Traffic backed up for 5km. Delays over 45 min.', lat: 39.9330, lng: 116.4585, address: 'East Third Ring Road, Beijing', reporterName: 'Chen Y.', reporterLevel: 7, confirmCount: 19, isVerified: false },
];

let counter = 100;
function makeId() { return `inc-world-${++counter}`; }

export function generateWorldIncidents(): Incident[] {
  const now = Date.now();
  return SEEDS.map((seed, i) => ({
    id: makeId(),
    reporterUid: `world-user-${i}`,
    reporterName: seed.reporterName,
    reporterLevel: seed.reporterLevel,
    reporterBadge: seed.reporterLevel >= 20 ? 'Sentinela de Ouro' : seed.reporterLevel >= 10 ? 'Agente Comunitário' : 'Repórter de Rua',
    category: seed.category,
    severity: seed.severity,
    title: seed.title,
    description: seed.description,
    location: { latitude: seed.lat, longitude: seed.lng },
    geohash: '',
    address: seed.address,
    photoURLs: [],
    confirmCount: seed.confirmCount,
    denyCount: Math.floor(seed.confirmCount * 0.05),
    credibilityScore: seed.confirmCount * 1.5,
    status: 'active' as const,
    isVerified: seed.isVerified,
    isFakeReport: false,
    verifiedByUid: seed.isVerified ? 'guardian-world' : null,
    verifiedByName: seed.isVerified ? 'World Guardian' : null,
    views: Math.floor(seed.confirmCount * 4.5),
    commentCount: Math.floor(seed.confirmCount * 0.5),
    comments: [],
    createdAt: now - (i * 1200000 + Math.random() * 3600000),
    expiresAt: now + 86400000,
  }));
}
