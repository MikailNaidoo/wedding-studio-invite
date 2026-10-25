export function findContainingRing(longitude, latitude, rings) {
  for (const ring of rings) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if ((yi > latitude) !== (yj > latitude) && longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    if (inside) return ring;
  }
  return null;
}

export function getCountryOutlines(name, features) {
  const geometry = features.find(feature => feature.properties.ADMIN === name)?.geometry;
  if (!geometry) return [];
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  return polygons.map(polygon => polygon[0]).filter(ring => ring?.length);
}

export function focusPose(longitude, latitude, zoom = 3.4) {
  const radians = Math.PI / 180;
  const lon = longitude * radians;
  const lat = latitude * radians;
  const x = Math.cos(lat) * Math.sin(lon);
  const y = Math.sin(lat);
  const z = Math.cos(lat) * Math.cos(lon);
  const rotation = Math.atan2(-x, z);
  const rotatedZ = z * Math.cos(rotation) - x * Math.sin(rotation);
  return { rotation, tilt: Math.atan2(y, rotatedZ), zoom };
}
