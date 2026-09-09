export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeocodedPlace {
  label: string;
  lat: number;
  lng: number;
  city?: string;
  address?: string;
}

export const locationService = {
  // Gerçek Browser Geolocation API
  async getCurrentPosition(): Promise<{ success: boolean; coords?: Coordinates; error?: string }> {
    if (!('geolocation' in navigator)) {
      return { success: false, error: 'Geolocation is not supported by your browser.' };
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            success: true,
            coords: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          });
        },
        (err) => {
          let msg = 'Location access was denied.';
          if (err.code === err.POSITION_UNAVAILABLE) msg = 'Location information is unavailable.';
          if (err.code === err.TIMEOUT) msg = 'Location request timed out.';
          resolve({ success: false, error: msg });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  },

  // Nominatim / OpenStreetMap Tersine Geocoding (Ters Adres Arama)
  async reverseGeocode(coords: Coordinates): Promise<string> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=16&addressdetails=1`,
        { headers: { 'Accept-Language': 'tr,en' } }
      );
      if (!res.ok) return `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
      const data = await res.json();
      return data.display_name || `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
    } catch {
      return `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
    }
  },

  // Gerçek Adres & Yer Arama Geocoding (Photon / OpenStreetMap)
  async searchPlaces(query: string): Promise<GeocodedPlace[]> {
    if (!query || query.trim().length < 2) return [];
    try {
      // Türkiye odaklı arama bias'ı ile
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=default&lat=41.0082&lon=28.9784`
      );
      if (!res.ok) return [];
      const data = await res.json();
      if (!data.features) return [];

      return data.features.map((f: any) => {
        const p = f.properties;
        const name = p.name || p.street || '';
        const city = p.city || p.county || p.state || '';
        const country = p.country || '';
        const fullLabel = [name, city, country].filter(Boolean).join(', ');

        return {
          label: fullLabel || query,
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
          city: p.city || p.state || ''
        };
      });
    } catch {
      return [];
    }
  }
};