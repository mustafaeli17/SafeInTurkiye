import { Coordinates } from './locationService';

export interface RouteGeometryPoint {
  lat: number;
  lng: number;
}

export interface RealRouteResult {
  distanceKm: number;
  durationMinutes: number;
  geometry: RouteGeometryPoint[];
  source: string;
  calculatedAt: string;
}

export const routingService = {
  // Gerçek OSRM Public Driving Routing API
  async getRoute(origin: Coordinates, destination: Coordinates): Promise<{ success: boolean; route?: RealRouteResult; error?: string }> {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
      
      const res = await fetch(url);
      if (!res.ok) {
        return { success: false, error: 'Could not calculate route. Please try another destination.' };
      }

      const data = await res.json();
      if (!data.routes || data.routes.length === 0) {
        return { success: false, error: 'No drivable route found between these locations.' };
      }

      const primary = data.routes[0];
      const distanceKm = Number((primary.distance / 1000).toFixed(2));
      const durationMinutes = Math.max(1, Math.round(primary.duration / 60));

      const geometry: RouteGeometryPoint[] = primary.geometry.coordinates.map((coord: [number, number]) => ({
        lat: coord[1],
        lng: coord[0]
      }));

      return {
        success: true,
        route: {
          distanceKm,
          durationMinutes,
          geometry,
          source: 'OpenStreetMap / OSRM Driving Engine',
          calculatedAt: new Date().toLocaleTimeString()
        }
      };
    } catch {
      return { success: false, error: 'Routing service network error. Please check connection.' };
    }
  }
};