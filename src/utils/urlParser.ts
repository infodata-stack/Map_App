/**
 * Parses Google Maps links, coordinates, or search queries into structured latitude, longitude, and name.
 */
export interface ParsedLocationInfo {
  name?: string;
  address?: string;
  lat?: number;
  lng?: number;
  rawUrl?: string;
}

export function parseGoogleMapsLinkOrText(input: string): ParsedLocationInfo {
  const trimmed = input.trim();
  if (!trimmed) return {};

  const result: ParsedLocationInfo = {
    rawUrl: trimmed,
  };

  // 1. Direct coordinate format: "28.6517, 77.1906" or "28.6517 77.1906"
  const coordRegex = /^\s*(-?\d{1,2}(?:\.\d+)?)[,\s]+(-?\d{1,3}(?:\.\d+)?)\s*$/;
  const directCoordMatch = trimmed.match(coordRegex);
  if (directCoordMatch) {
    const lat = parseFloat(directCoordMatch[1]);
    const lng = parseFloat(directCoordMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      result.lat = lat;
      result.lng = lng;
      result.name = `GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      result.address = `Coordinates: ${lat}, ${lng}`;
      return result;
    }
  }

  // 2. Google Maps URL containing /@lat,lng,...
  // Example: https://www.google.com/maps/place/Karol+Bagh/@28.651712,77.190632,15z/...
  const atMatch = trimmed.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    result.lat = parseFloat(atMatch[1]);
    result.lng = parseFloat(atMatch[2]);
  }

  // 3. Query param q=lat,lng or query=lat,lng or destination=lat,lng
  // Example: https://maps.google.com/?q=28.6517,77.1906
  const qParamMatch = trimmed.match(/[?&](?:q|query|destination)=(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
  if (qParamMatch) {
    result.lat = parseFloat(qParamMatch[1]);
    result.lng = parseFloat(qParamMatch[2]);
  }

  // 4. Extract place name from URL path
  // Example: /maps/place/Karol+Bagh+Market/ or /maps/search/Chandni+Chowk
  const placeMatch = trimmed.match(/\/maps\/(?:place|search)\/([^/@?]+)/);
  if (placeMatch && placeMatch[1]) {
    const rawName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    result.name = rawName;
    result.address = rawName;
  }

  // If name not set yet but coordinates exist
  if (!result.name && result.lat && result.lng) {
    result.name = `Location (${result.lat.toFixed(4)}, ${result.lng.toFixed(4)})`;
    result.address = `Google Maps Pin: ${result.lat}, ${result.lng}`;
  }

  // If user pasted a plain place name or address
  if (!result.lat && !trimmed.startsWith('http')) {
    result.name = trimmed;
    result.address = trimmed;
  }

  return result;
}

/**
 * Geocodes an address query using Google Maps JS SDK Geocoder in browser (zero CORS issues)
 */
export async function geocodeWithSdkIfAvailable(query: string): Promise<ParsedLocationInfo> {
  const basic = parseGoogleMapsLinkOrText(query);
  if (basic.lat && basic.lng) {
    return basic;
  }

  if (typeof google !== 'undefined' && google.maps && google.maps.Geocoder) {
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({ address: query });
      if (response && response.results && response.results[0]) {
        const match = response.results[0];
        return {
          name: match.formatted_address.split(',')[0] || query,
          address: match.formatted_address,
          lat: match.geometry.location.lat(),
          lng: match.geometry.location.lng(),
          rawUrl: query,
        };
      }
    } catch (err) {
      console.warn('Google Maps Geocoder lookup error:', err);
    }
  }

  return basic;
}
