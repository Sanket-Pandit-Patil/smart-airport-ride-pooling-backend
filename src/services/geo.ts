/**
 * Haversine distance in km. O(1).
 * Used for direct distance and detour checks.
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Total route distance for a sequence of waypoints (pickups/dropoffs).
 * Sum of segment distances. O(n).
 */
export function routeDistanceKm(waypoints: Array<{ lat: number; lng: number }>): number {
  let total = 0;
  for (let i = 1; i < waypoints.length; i++) {
    total += haversineKm(
      waypoints[i - 1].lat,
      waypoints[i - 1].lng,
      waypoints[i].lat,
      waypoints[i].lng
    );
  }
  return total;
}
