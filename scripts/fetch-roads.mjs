/**
 * scripts/fetch-roads.mjs
 * Fetches OpenStreetMap road data for Vile Parle via Overpass API
 * and converts it into a clean, connected RoadGraph JSON dataset.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BBOX = {
  swLat: 19.085,
  swLng: 72.825,
  neLat: 19.125,
  neLng: 72.875,
};

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.nchc.org.tw/api/interpreter',
];

const QUERY = `[out:json][timeout:60];
(
  way["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link)$"]
  (${BBOX.swLat},${BBOX.swLng},${BBOX.neLat},${BBOX.neLng});
);
(._;>;);
out body;`;

/** Haversine formula to compute distance in metres between two lat/lng points */
function haversineMetres(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in metres
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Compute total polyline length in metres */
function polylineLengthMetres(polyline) {
  let total = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    total += haversineMetres(
      polyline[i][0],
      polyline[i][1],
      polyline[i + 1][0],
      polyline[i + 1][1]
    );
  }
  return total;
}

/** Douglas-Peucker polyline simplification */
function perpendicularDistance(point, lineStart, lineEnd) {
  const [x, y] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;

  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    return Math.hypot(x - x1, y - y1);
  }

  const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
  const tClamped = Math.max(0, Math.min(1, t));

  const projX = x1 + tClamped * dx;
  const projY = y1 + tClamped * dy;

  // Convert approx deg to approx metres for tolerance check (~111,000m per deg)
  return Math.hypot(x - projX, y - projY) * 111000;
}

function simplifyPolyline(points, toleranceMetres = 5) {
  if (points.length <= 2) return points;

  let dmax = 0;
  let index = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const d = perpendicularDistance(points[i], points[0], points[end]);
    if (d > dmax) {
      index = i;
      dmax = d;
    }
  }

  if (dmax > toleranceMetres) {
    const recResults1 = simplifyPolyline(points.slice(0, index + 1), toleranceMetres);
    const recResults2 = simplifyPolyline(points.slice(index), toleranceMetres);
    return [...recResults1.slice(0, -1), ...recResults2];
  } else {
    return [points[0], points[end]];
  }
}

async function fetchOverpass() {
  const headers = {
    'User-Agent': 'RESQNET-Disaster-Response-Demo/1.0 (swayamjagtap@gmail.com)',
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  for (const url of OVERPASS_ENDPOINTS) {
    console.log(`[fetch-roads] Querying Overpass API (${url})...`);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: `data=${encodeURIComponent(QUERY)}`,
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`[fetch-roads] Received ${data.elements?.length ?? 0} elements from ${url}.`);
        return data;
      }
      console.warn(`[fetch-roads] ${url} failed with status ${res.status}.`);
    } catch (err) {
      console.warn(`[fetch-roads] ${url} error: ${err.message}.`);
    }
  }

  throw new Error('Unreachable: All Overpass endpoints failed.');
}

async function main() {
  const overpassData = await fetchOverpass();
  const elements = overpassData.elements || [];

  const osmNodes = new Map(); // id -> { lat, lng }
  const osmWays = [];

  for (const el of elements) {
    if (el.type === 'node') {
      osmNodes.set(el.id, { lat: el.lat, lng: el.lon });
    } else if (el.type === 'way') {
      osmWays.push(el);
    }
  }

  // Count how many times each node is referenced across all ways
  const nodeUsage = new Map();
  for (const way of osmWays) {
    if (!way.nodes) continue;
    for (let i = 0; i < way.nodes.length; i++) {
      const nid = way.nodes[i];
      // Endpoints of ways always count as intersections
      const isEndpoint = i === 0 || i === way.nodes.length - 1;
      nodeUsage.set(nid, (nodeUsage.get(nid) || 0) + (isEndpoint ? 2 : 1));
    }
  }

  const rawNodes = new Map(); // nodeId -> { id, lat, lng }
  const rawEdges = []; // array of { id, from, to, lengthMetres, geometry, name, highway }
  let edgeCounter = 1;

  for (const way of osmWays) {
    if (!way.nodes || way.nodes.length < 2) continue;

    let segmentStartIdx = 0;

    for (let i = 1; i < way.nodes.length; i++) {
      const nid = way.nodes[i];
      const isIntersection = (nodeUsage.get(nid) || 0) >= 2 || i === way.nodes.length - 1;

      if (isIntersection) {
        const segNodes = way.nodes.slice(segmentStartIdx, i + 1);
        const fromNid = `n${way.nodes[segmentStartIdx]}`;
        const toNid = `n${nid}`;

        const fromCoord = osmNodes.get(way.nodes[segmentStartIdx]);
        const toCoord = osmNodes.get(nid);

        if (fromCoord && toCoord && fromNid !== toNid) {
          rawNodes.set(fromNid, { id: fromNid, lat: fromCoord.lat, lng: fromCoord.lng });
          rawNodes.set(toNid, { id: toNid, lat: toCoord.lat, lng: toCoord.lng });

          const polyline = [];
          for (const snid of segNodes) {
            const c = osmNodes.get(snid);
            if (c) polyline.push([c.lat, c.lng]);
          }

          if (polyline.length >= 2) {
            const lengthM = haversineMetres(
              polyline[0][0],
              polyline[0][1],
              polyline[polyline.length - 1][0],
              polyline[polyline.length - 1][1]
            );
            // Haversine along actual polyline points
            const actualLengthM = polylineLengthMetres(polyline);

            rawEdges.push({
              id: `e${edgeCounter++}`,
              from: fromNid,
              to: toNid,
              lengthMetres: Math.round(actualLengthM * 100) / 100,
              geometry: polyline,
              name: way.tags?.name || undefined,
              highway: way.tags?.highway || undefined,
            });
          }
        }
        segmentStartIdx = i;
      }
    }
  }

  console.log(`[fetch-roads] Parsed ${rawNodes.size} intersection nodes and ${rawEdges.length} raw edges.`);

  // Find Largest Connected Component (LCC)
  const adj = new Map();
  for (const nid of rawNodes.keys()) {
    adj.set(nid, []);
  }
  for (const e of rawEdges) {
    adj.get(e.from)?.push(e.to);
    adj.get(e.to)?.push(e.from);
  }

  const visited = new Set();
  let lccNodes = new Set();

  for (const startNid of rawNodes.keys()) {
    if (visited.has(startNid)) continue;

    const component = new Set();
    const queue = [startNid];
    visited.add(startNid);

    while (queue.length > 0) {
      const curr = queue.pop();
      component.add(curr);
      for (const neighbor of adj.get(curr) || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    if (component.size > lccNodes.size) {
      lccNodes = component;
    }
  }

  console.log(`[fetch-roads] Largest Connected Component retains ${lccNodes.size} of ${rawNodes.size} nodes.`);

  const finalNodes = {};
  for (const nid of lccNodes) {
    finalNodes[nid] = rawNodes.get(nid);
  }

  let finalEdges = rawEdges.filter((e) => lccNodes.has(e.from) && lccNodes.has(e.to));

  // Deduplicate multi-edges between same pair if identical
  const edgeMap = new Map();
  const uniqueEdges = [];
  for (const e of finalEdges) {
    const pairKey = e.from < e.to ? `${e.from}_${e.to}` : `${e.to}_${e.from}`;
    if (!edgeMap.has(pairKey)) {
      edgeMap.set(pairKey, e);
      uniqueEdges.push(e);
    }
  }
  finalEdges = uniqueEdges;

  console.log(`[fetch-roads] Retained ${finalEdges.length} edges after LCC filter and deduplication.`);

  // Prepare metadata block
  const outputData = {
    metadata: {
      source: 'OpenStreetMap contributors (ODbL)',
      query: QUERY,
      fetchedAt: new Date().toISOString(),
      boundingBox: BBOX,
      nodeCount: Object.keys(finalNodes).length,
      edgeCount: finalEdges.length,
      units: { distance: 'metres', coordinates: 'decimal degrees (lat, lng)' },
      notes:
        'Conservatively simplified as bidirectional graph for emergency simulation demo. Contains only the largest connected component within Vile Parle viewing bounds.',
      simplifiedPolyline: false,
    },
    nodes: finalNodes,
    edges: finalEdges,
  };

  const targetPath = path.join(__dirname, '../src/data/vileparle-roads.json');
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });

  let jsonStr = JSON.stringify(outputData, null, 2);
  let sizeMb = Buffer.byteLength(jsonStr) / (1024 * 1024);

  if (sizeMb > 2.0) {
    console.log(`[fetch-roads] File size is ${sizeMb.toFixed(2)} MB (> 2 MB). Applying Douglas-Peucker polyline simplification (7.5m)...`);
    for (const e of outputData.edges) {
      e.geometry = simplifyPolyline(e.geometry, 7.5);
    }
    outputData.metadata.simplifiedPolyline = true;
    jsonStr = JSON.stringify(outputData, null, 2);
    sizeMb = Buffer.byteLength(jsonStr) / (1024 * 1024);
  }

  fs.writeFileSync(targetPath, jsonStr, 'utf-8');
  console.log(`[fetch-roads] Successfully saved road graph to ${targetPath} (${sizeMb.toFixed(2)} MB).`);
}

main().catch((err) => {
  console.error('[fetch-roads] Fatal error:', err);
  process.exit(1);
});
