// Rebuild after movement and before combat. Queries return source-array order,
// so piercing shots, chain effects and equal-distance targets stay deterministic.
// Dead units are checked at query time because an earlier hit can kill them.
export function createBonkSpatialIndex(units = [], {cellSize = 8, predicate = u => u.bonkEnemy && u.alive} = {}) {
 if (!Number.isFinite(cellSize) || cellSize <= 0) throw new RangeError('cellSize must be positive');
 let buckets = new Map(), entries = [], maxRadius = 0, tested = 0;
 const key = (x, z) => `${x},${z}`;
 const radius = u => Number.isFinite(u.collisionRadius) ? Math.max(0, u.collisionRadius) : .4;
 const eligible = u => Number.isFinite(u.x) && Number.isFinite(u.z) && predicate(u);
 const ordered = found => found.sort((a, b) => a.order - b.order).map(e => e.unit);
 function candidates(minX, minZ, maxX, maxZ, visit) {
  const x0 = Math.floor(minX / cellSize), x1 = Math.floor(maxX / cellSize), z0 = Math.floor(minZ / cellSize), z1 = Math.floor(maxZ / cellSize);
  // Large map-wide effects are cheaper as one linear scan than thousands of
  // empty buckets. This also keeps every finite radius query bounded.
  if ((x1 - x0 + 1) * (z1 - z0 + 1) > entries.length * 2) {for (const entry of entries) visit(entry); return;}
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (const entry of buckets.get(key(x, z)) || []) visit(entry);
 }
 const api = {
  rebuild(source = units) {
   units = source; buckets.clear(); entries = []; maxRadius = 0; tested = 0;
   for (let order = 0; order < source.length; order++) {
    const unit = source[order]; if (!eligible(unit)) continue;
    const entry = {unit, order}, k = key(Math.floor(unit.x / cellSize), Math.floor(unit.z / cellSize));
    let bucket = buckets.get(k); if (!bucket) buckets.set(k, bucket = []);
    bucket.push(entry); entries.push(entry); maxRadius = Math.max(maxRadius, radius(unit));
   }
   return api;
  },
  within(point, range, {collisionRadii = false, exclude} = {}) {
   if (!Number.isFinite(range) || range < 0 || !Number.isFinite(point?.x) || !Number.isFinite(point?.z)) return [];
   const found = [], reach = range + (collisionRadii ? maxRadius : 0);
   candidates(point.x - reach, point.z - reach, point.x + reach, point.z + reach, entry => {
    const u = entry.unit; if (u === exclude || !eligible(u)) return; tested++;
    const dx = u.x - point.x, dz = u.z - point.z, r = range + (collisionRadii ? radius(u) : 0);
    if (dx * dx + dz * dz <= r * r) found.push(entry);
   });
   return ordered(found);
  },
  nearest(point, range, options) {
   let best = null, bestDistance = Infinity;
   for (const unit of api.within(point, range, options)) {const d = (unit.x - point.x) ** 2 + (unit.z - point.z) ** 2; if (d < bestDistance) {best = unit; bestDistance = d;}}
   return best;
  },
  stats() {return {units: entries.length, buckets: buckets.size, distanceTests: tested};},
 };
 return api.rebuild(units);
}
