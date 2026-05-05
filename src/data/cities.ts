/**
 * Bundled list of major world cities for the location autocomplete.
 *
 * Curated, romanised, and deliberately small (~250 cities) to keep the JS
 * bundle light. Sorted by approximate population so that the most common
 * matches surface first.
 *
 * If a user's city is not in this list, they can still type freely — the
 * autocomplete falls back to free-text without losing what they typed.
 */
export interface CityEntry {
  /** City name as users would type it. */
  city: string;
  /** Country in English. */
  country: string;
  /** ISO 3166-1 alpha-2 country code, kept for future use. */
  countryCode: string;
}

// Order roughly reflects population / global recognisability — used as a
// stable tie-breaker so popular matches surface first.
export const CITIES: ReadonlyArray<CityEntry> = [
  // Africa
  { city: 'Lagos', country: 'Nigeria', countryCode: 'NG' },
  { city: 'Abuja', country: 'Nigeria', countryCode: 'NG' },
  { city: 'Port Harcourt', country: 'Nigeria', countryCode: 'NG' },
  { city: 'Ibadan', country: 'Nigeria', countryCode: 'NG' },
  { city: 'Kano', country: 'Nigeria', countryCode: 'NG' },
  { city: 'Cairo', country: 'Egypt', countryCode: 'EG' },
  { city: 'Alexandria', country: 'Egypt', countryCode: 'EG' },
  { city: 'Johannesburg', country: 'South Africa', countryCode: 'ZA' },
  { city: 'Cape Town', country: 'South Africa', countryCode: 'ZA' },
  { city: 'Durban', country: 'South Africa', countryCode: 'ZA' },
  { city: 'Pretoria', country: 'South Africa', countryCode: 'ZA' },
  { city: 'Nairobi', country: 'Kenya', countryCode: 'KE' },
  { city: 'Mombasa', country: 'Kenya', countryCode: 'KE' },
  { city: 'Accra', country: 'Ghana', countryCode: 'GH' },
  { city: 'Kumasi', country: 'Ghana', countryCode: 'GH' },
  { city: 'Addis Ababa', country: 'Ethiopia', countryCode: 'ET' },
  { city: 'Casablanca', country: 'Morocco', countryCode: 'MA' },
  { city: 'Rabat', country: 'Morocco', countryCode: 'MA' },
  { city: 'Marrakesh', country: 'Morocco', countryCode: 'MA' },
  { city: 'Algiers', country: 'Algeria', countryCode: 'DZ' },
  { city: 'Tunis', country: 'Tunisia', countryCode: 'TN' },
  { city: 'Dakar', country: 'Senegal', countryCode: 'SN' },
  { city: 'Abidjan', country: 'Ivory Coast', countryCode: 'CI' },
  { city: 'Kampala', country: 'Uganda', countryCode: 'UG' },
  { city: 'Dar es Salaam', country: 'Tanzania', countryCode: 'TZ' },
  { city: 'Kigali', country: 'Rwanda', countryCode: 'RW' },
  { city: 'Lusaka', country: 'Zambia', countryCode: 'ZM' },
  { city: 'Harare', country: 'Zimbabwe', countryCode: 'ZW' },
  { city: 'Luanda', country: 'Angola', countryCode: 'AO' },
  { city: 'Khartoum', country: 'Sudan', countryCode: 'SD' },

  // Europe
  { city: 'London', country: 'United Kingdom', countryCode: 'GB' },
  { city: 'Manchester', country: 'United Kingdom', countryCode: 'GB' },
  { city: 'Birmingham', country: 'United Kingdom', countryCode: 'GB' },
  { city: 'Edinburgh', country: 'United Kingdom', countryCode: 'GB' },
  { city: 'Glasgow', country: 'United Kingdom', countryCode: 'GB' },
  { city: 'Bristol', country: 'United Kingdom', countryCode: 'GB' },
  { city: 'Leeds', country: 'United Kingdom', countryCode: 'GB' },
  { city: 'Liverpool', country: 'United Kingdom', countryCode: 'GB' },
  { city: 'Cardiff', country: 'United Kingdom', countryCode: 'GB' },
  { city: 'Belfast', country: 'United Kingdom', countryCode: 'GB' },
  { city: 'Dublin', country: 'Ireland', countryCode: 'IE' },
  { city: 'Cork', country: 'Ireland', countryCode: 'IE' },
  { city: 'Paris', country: 'France', countryCode: 'FR' },
  { city: 'Marseille', country: 'France', countryCode: 'FR' },
  { city: 'Lyon', country: 'France', countryCode: 'FR' },
  { city: 'Toulouse', country: 'France', countryCode: 'FR' },
  { city: 'Nice', country: 'France', countryCode: 'FR' },
  { city: 'Berlin', country: 'Germany', countryCode: 'DE' },
  { city: 'Munich', country: 'Germany', countryCode: 'DE' },
  { city: 'Hamburg', country: 'Germany', countryCode: 'DE' },
  { city: 'Frankfurt', country: 'Germany', countryCode: 'DE' },
  { city: 'Cologne', country: 'Germany', countryCode: 'DE' },
  { city: 'Stuttgart', country: 'Germany', countryCode: 'DE' },
  { city: 'Düsseldorf', country: 'Germany', countryCode: 'DE' },
  { city: 'Madrid', country: 'Spain', countryCode: 'ES' },
  { city: 'Barcelona', country: 'Spain', countryCode: 'ES' },
  { city: 'Valencia', country: 'Spain', countryCode: 'ES' },
  { city: 'Seville', country: 'Spain', countryCode: 'ES' },
  { city: 'Bilbao', country: 'Spain', countryCode: 'ES' },
  { city: 'Lisbon', country: 'Portugal', countryCode: 'PT' },
  { city: 'Porto', country: 'Portugal', countryCode: 'PT' },
  { city: 'Rome', country: 'Italy', countryCode: 'IT' },
  { city: 'Milan', country: 'Italy', countryCode: 'IT' },
  { city: 'Naples', country: 'Italy', countryCode: 'IT' },
  { city: 'Turin', country: 'Italy', countryCode: 'IT' },
  { city: 'Florence', country: 'Italy', countryCode: 'IT' },
  { city: 'Bologna', country: 'Italy', countryCode: 'IT' },
  { city: 'Amsterdam', country: 'Netherlands', countryCode: 'NL' },
  { city: 'Rotterdam', country: 'Netherlands', countryCode: 'NL' },
  { city: 'The Hague', country: 'Netherlands', countryCode: 'NL' },
  { city: 'Utrecht', country: 'Netherlands', countryCode: 'NL' },
  { city: 'Eindhoven', country: 'Netherlands', countryCode: 'NL' },
  { city: 'Brussels', country: 'Belgium', countryCode: 'BE' },
  { city: 'Antwerp', country: 'Belgium', countryCode: 'BE' },
  { city: 'Ghent', country: 'Belgium', countryCode: 'BE' },
  { city: 'Zurich', country: 'Switzerland', countryCode: 'CH' },
  { city: 'Geneva', country: 'Switzerland', countryCode: 'CH' },
  { city: 'Basel', country: 'Switzerland', countryCode: 'CH' },
  { city: 'Bern', country: 'Switzerland', countryCode: 'CH' },
  { city: 'Vienna', country: 'Austria', countryCode: 'AT' },
  { city: 'Salzburg', country: 'Austria', countryCode: 'AT' },
  { city: 'Stockholm', country: 'Sweden', countryCode: 'SE' },
  { city: 'Gothenburg', country: 'Sweden', countryCode: 'SE' },
  { city: 'Malmö', country: 'Sweden', countryCode: 'SE' },
  { city: 'Oslo', country: 'Norway', countryCode: 'NO' },
  { city: 'Bergen', country: 'Norway', countryCode: 'NO' },
  { city: 'Copenhagen', country: 'Denmark', countryCode: 'DK' },
  { city: 'Aarhus', country: 'Denmark', countryCode: 'DK' },
  { city: 'Helsinki', country: 'Finland', countryCode: 'FI' },
  { city: 'Reykjavik', country: 'Iceland', countryCode: 'IS' },
  { city: 'Warsaw', country: 'Poland', countryCode: 'PL' },
  { city: 'Krakow', country: 'Poland', countryCode: 'PL' },
  { city: 'Wroclaw', country: 'Poland', countryCode: 'PL' },
  { city: 'Gdansk', country: 'Poland', countryCode: 'PL' },
  { city: 'Prague', country: 'Czech Republic', countryCode: 'CZ' },
  { city: 'Brno', country: 'Czech Republic', countryCode: 'CZ' },
  { city: 'Budapest', country: 'Hungary', countryCode: 'HU' },
  { city: 'Bucharest', country: 'Romania', countryCode: 'RO' },
  { city: 'Cluj-Napoca', country: 'Romania', countryCode: 'RO' },
  { city: 'Sofia', country: 'Bulgaria', countryCode: 'BG' },
  { city: 'Athens', country: 'Greece', countryCode: 'GR' },
  { city: 'Thessaloniki', country: 'Greece', countryCode: 'GR' },
  { city: 'Istanbul', country: 'Turkey', countryCode: 'TR' },
  { city: 'Ankara', country: 'Turkey', countryCode: 'TR' },
  { city: 'Izmir', country: 'Turkey', countryCode: 'TR' },
  { city: 'Moscow', country: 'Russia', countryCode: 'RU' },
  { city: 'Saint Petersburg', country: 'Russia', countryCode: 'RU' },
  { city: 'Kyiv', country: 'Ukraine', countryCode: 'UA' },
  { city: 'Lviv', country: 'Ukraine', countryCode: 'UA' },
  { city: 'Belgrade', country: 'Serbia', countryCode: 'RS' },
  { city: 'Zagreb', country: 'Croatia', countryCode: 'HR' },
  { city: 'Ljubljana', country: 'Slovenia', countryCode: 'SI' },
  { city: 'Riga', country: 'Latvia', countryCode: 'LV' },
  { city: 'Vilnius', country: 'Lithuania', countryCode: 'LT' },
  { city: 'Tallinn', country: 'Estonia', countryCode: 'EE' },

  // Americas
  { city: 'New York', country: 'United States', countryCode: 'US' },
  { city: 'Los Angeles', country: 'United States', countryCode: 'US' },
  { city: 'Chicago', country: 'United States', countryCode: 'US' },
  { city: 'Houston', country: 'United States', countryCode: 'US' },
  { city: 'Phoenix', country: 'United States', countryCode: 'US' },
  { city: 'Philadelphia', country: 'United States', countryCode: 'US' },
  { city: 'San Antonio', country: 'United States', countryCode: 'US' },
  { city: 'San Diego', country: 'United States', countryCode: 'US' },
  { city: 'Dallas', country: 'United States', countryCode: 'US' },
  { city: 'Austin', country: 'United States', countryCode: 'US' },
  { city: 'San Francisco', country: 'United States', countryCode: 'US' },
  { city: 'San Jose', country: 'United States', countryCode: 'US' },
  { city: 'Seattle', country: 'United States', countryCode: 'US' },
  { city: 'Denver', country: 'United States', countryCode: 'US' },
  { city: 'Boston', country: 'United States', countryCode: 'US' },
  { city: 'Washington', country: 'United States', countryCode: 'US' },
  { city: 'Atlanta', country: 'United States', countryCode: 'US' },
  { city: 'Miami', country: 'United States', countryCode: 'US' },
  { city: 'Tampa', country: 'United States', countryCode: 'US' },
  { city: 'Orlando', country: 'United States', countryCode: 'US' },
  { city: 'Charlotte', country: 'United States', countryCode: 'US' },
  { city: 'Nashville', country: 'United States', countryCode: 'US' },
  { city: 'Detroit', country: 'United States', countryCode: 'US' },
  { city: 'Minneapolis', country: 'United States', countryCode: 'US' },
  { city: 'Portland', country: 'United States', countryCode: 'US' },
  { city: 'Las Vegas', country: 'United States', countryCode: 'US' },
  { city: 'Pittsburgh', country: 'United States', countryCode: 'US' },
  { city: 'Salt Lake City', country: 'United States', countryCode: 'US' },
  { city: 'Toronto', country: 'Canada', countryCode: 'CA' },
  { city: 'Montreal', country: 'Canada', countryCode: 'CA' },
  { city: 'Vancouver', country: 'Canada', countryCode: 'CA' },
  { city: 'Calgary', country: 'Canada', countryCode: 'CA' },
  { city: 'Edmonton', country: 'Canada', countryCode: 'CA' },
  { city: 'Ottawa', country: 'Canada', countryCode: 'CA' },
  { city: 'Quebec City', country: 'Canada', countryCode: 'CA' },
  { city: 'Winnipeg', country: 'Canada', countryCode: 'CA' },
  { city: 'Halifax', country: 'Canada', countryCode: 'CA' },
  { city: 'Mexico City', country: 'Mexico', countryCode: 'MX' },
  { city: 'Guadalajara', country: 'Mexico', countryCode: 'MX' },
  { city: 'Monterrey', country: 'Mexico', countryCode: 'MX' },
  { city: 'São Paulo', country: 'Brazil', countryCode: 'BR' },
  { city: 'Rio de Janeiro', country: 'Brazil', countryCode: 'BR' },
  { city: 'Brasília', country: 'Brazil', countryCode: 'BR' },
  { city: 'Salvador', country: 'Brazil', countryCode: 'BR' },
  { city: 'Belo Horizonte', country: 'Brazil', countryCode: 'BR' },
  { city: 'Buenos Aires', country: 'Argentina', countryCode: 'AR' },
  { city: 'Córdoba', country: 'Argentina', countryCode: 'AR' },
  { city: 'Santiago', country: 'Chile', countryCode: 'CL' },
  { city: 'Lima', country: 'Peru', countryCode: 'PE' },
  { city: 'Bogotá', country: 'Colombia', countryCode: 'CO' },
  { city: 'Medellín', country: 'Colombia', countryCode: 'CO' },
  { city: 'Caracas', country: 'Venezuela', countryCode: 'VE' },
  { city: 'Quito', country: 'Ecuador', countryCode: 'EC' },
  { city: 'Montevideo', country: 'Uruguay', countryCode: 'UY' },
  { city: 'San José', country: 'Costa Rica', countryCode: 'CR' },
  { city: 'Panama City', country: 'Panama', countryCode: 'PA' },
  { city: 'Havana', country: 'Cuba', countryCode: 'CU' },
  { city: 'Kingston', country: 'Jamaica', countryCode: 'JM' },

  // Asia
  { city: 'Tokyo', country: 'Japan', countryCode: 'JP' },
  { city: 'Osaka', country: 'Japan', countryCode: 'JP' },
  { city: 'Kyoto', country: 'Japan', countryCode: 'JP' },
  { city: 'Yokohama', country: 'Japan', countryCode: 'JP' },
  { city: 'Nagoya', country: 'Japan', countryCode: 'JP' },
  { city: 'Sapporo', country: 'Japan', countryCode: 'JP' },
  { city: 'Fukuoka', country: 'Japan', countryCode: 'JP' },
  { city: 'Seoul', country: 'South Korea', countryCode: 'KR' },
  { city: 'Busan', country: 'South Korea', countryCode: 'KR' },
  { city: 'Incheon', country: 'South Korea', countryCode: 'KR' },
  { city: 'Beijing', country: 'China', countryCode: 'CN' },
  { city: 'Shanghai', country: 'China', countryCode: 'CN' },
  { city: 'Guangzhou', country: 'China', countryCode: 'CN' },
  { city: 'Shenzhen', country: 'China', countryCode: 'CN' },
  { city: 'Chengdu', country: 'China', countryCode: 'CN' },
  { city: 'Hangzhou', country: 'China', countryCode: 'CN' },
  { city: 'Wuhan', country: 'China', countryCode: 'CN' },
  { city: 'Xi’an', country: 'China', countryCode: 'CN' },
  { city: 'Hong Kong', country: 'Hong Kong', countryCode: 'HK' },
  { city: 'Taipei', country: 'Taiwan', countryCode: 'TW' },
  { city: 'Singapore', country: 'Singapore', countryCode: 'SG' },
  { city: 'Kuala Lumpur', country: 'Malaysia', countryCode: 'MY' },
  { city: 'Penang', country: 'Malaysia', countryCode: 'MY' },
  { city: 'Bangkok', country: 'Thailand', countryCode: 'TH' },
  { city: 'Chiang Mai', country: 'Thailand', countryCode: 'TH' },
  { city: 'Phuket', country: 'Thailand', countryCode: 'TH' },
  { city: 'Jakarta', country: 'Indonesia', countryCode: 'ID' },
  { city: 'Surabaya', country: 'Indonesia', countryCode: 'ID' },
  { city: 'Bandung', country: 'Indonesia', countryCode: 'ID' },
  { city: 'Bali', country: 'Indonesia', countryCode: 'ID' },
  { city: 'Manila', country: 'Philippines', countryCode: 'PH' },
  { city: 'Cebu', country: 'Philippines', countryCode: 'PH' },
  { city: 'Hanoi', country: 'Vietnam', countryCode: 'VN' },
  { city: 'Ho Chi Minh City', country: 'Vietnam', countryCode: 'VN' },
  { city: 'Da Nang', country: 'Vietnam', countryCode: 'VN' },
  { city: 'Phnom Penh', country: 'Cambodia', countryCode: 'KH' },
  { city: 'Mumbai', country: 'India', countryCode: 'IN' },
  { city: 'Delhi', country: 'India', countryCode: 'IN' },
  { city: 'Bangalore', country: 'India', countryCode: 'IN' },
  { city: 'Hyderabad', country: 'India', countryCode: 'IN' },
  { city: 'Chennai', country: 'India', countryCode: 'IN' },
  { city: 'Kolkata', country: 'India', countryCode: 'IN' },
  { city: 'Pune', country: 'India', countryCode: 'IN' },
  { city: 'Ahmedabad', country: 'India', countryCode: 'IN' },
  { city: 'Jaipur', country: 'India', countryCode: 'IN' },
  { city: 'Karachi', country: 'Pakistan', countryCode: 'PK' },
  { city: 'Lahore', country: 'Pakistan', countryCode: 'PK' },
  { city: 'Islamabad', country: 'Pakistan', countryCode: 'PK' },
  { city: 'Dhaka', country: 'Bangladesh', countryCode: 'BD' },
  { city: 'Colombo', country: 'Sri Lanka', countryCode: 'LK' },
  { city: 'Kathmandu', country: 'Nepal', countryCode: 'NP' },

  // Middle East
  { city: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE' },
  { city: 'Abu Dhabi', country: 'United Arab Emirates', countryCode: 'AE' },
  { city: 'Sharjah', country: 'United Arab Emirates', countryCode: 'AE' },
  { city: 'Riyadh', country: 'Saudi Arabia', countryCode: 'SA' },
  { city: 'Jeddah', country: 'Saudi Arabia', countryCode: 'SA' },
  { city: 'Doha', country: 'Qatar', countryCode: 'QA' },
  { city: 'Kuwait City', country: 'Kuwait', countryCode: 'KW' },
  { city: 'Manama', country: 'Bahrain', countryCode: 'BH' },
  { city: 'Muscat', country: 'Oman', countryCode: 'OM' },
  { city: 'Tel Aviv', country: 'Israel', countryCode: 'IL' },
  { city: 'Jerusalem', country: 'Israel', countryCode: 'IL' },
  { city: 'Amman', country: 'Jordan', countryCode: 'JO' },
  { city: 'Beirut', country: 'Lebanon', countryCode: 'LB' },
  { city: 'Tehran', country: 'Iran', countryCode: 'IR' },
  { city: 'Baghdad', country: 'Iraq', countryCode: 'IQ' },

  // Oceania
  { city: 'Sydney', country: 'Australia', countryCode: 'AU' },
  { city: 'Melbourne', country: 'Australia', countryCode: 'AU' },
  { city: 'Brisbane', country: 'Australia', countryCode: 'AU' },
  { city: 'Perth', country: 'Australia', countryCode: 'AU' },
  { city: 'Adelaide', country: 'Australia', countryCode: 'AU' },
  { city: 'Canberra', country: 'Australia', countryCode: 'AU' },
  { city: 'Gold Coast', country: 'Australia', countryCode: 'AU' },
  { city: 'Hobart', country: 'Australia', countryCode: 'AU' },
  { city: 'Auckland', country: 'New Zealand', countryCode: 'NZ' },
  { city: 'Wellington', country: 'New Zealand', countryCode: 'NZ' },
  { city: 'Christchurch', country: 'New Zealand', countryCode: 'NZ' },
];

/**
 * Search the city list for matches against a free-text query.
 * - Case-insensitive substring match against city name (primary) and country (secondary).
 * - Prefix matches rank above interior substring matches.
 * - Stable order preserves the population-ish ordering of CITIES.
 */
export function searchCities(query: string, limit = 8): CityEntry[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const prefix: CityEntry[] = [];
  const contains: CityEntry[] = [];
  for (const entry of CITIES) {
    const cityLc = entry.city.toLowerCase();
    const countryLc = entry.country.toLowerCase();
    if (cityLc.startsWith(q)) {
      prefix.push(entry);
    } else if (cityLc.includes(q) || countryLc.startsWith(q)) {
      contains.push(entry);
    }
    if (prefix.length >= limit) break;
  }
  return [...prefix, ...contains].slice(0, limit);
}

export function formatCityLabel(entry: CityEntry): string {
  return `${entry.city}, ${entry.country}`;
}
