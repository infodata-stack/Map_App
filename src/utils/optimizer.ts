import { LocationPoint, RouteOptimizationOptions, RouteSummary } from '../types/route';

/**
 * Calculates straight line great-circle distance between two GPS coordinates using Haversine formula
 */
export function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in KM
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Real-world road circuity factor multiplier.
 * Roads are rarely straight lines; in cities, road distance is typically 1.25x to 1.35x haversine distance.
 */
export function estimateRoadDistanceKm(haversineKm: number): number {
  return Number((haversineKm * 1.3).toFixed(2));
}

/**
 * Estimates duration in minutes given road distance and vehicle speed
 */
export function estimateDurationMinutes(distanceKm: number, speedKmH: number = 30): number {
  if (speedKmH <= 0) return 0;
  const hours = distanceKm / speedKmH;
  return Math.round(hours * 60);
}

/**
 * Solves the core question: Given a Start Location and 3+ locations,
 * which location is nearest first, second, third?
 */
export function rankNearestLocations(
  startPoint: LocationPoint,
  stops: LocationPoint[],
  speedKmH: number = 30
): { rankedStops: LocationPoint[]; nearestStop: LocationPoint | null } {
  if (!stops || stops.length === 0) {
    return { rankedStops: [], nearestStop: null };
  }

  const computedStops = stops.map((stop) => {
    const rawDist = calculateHaversineDistanceKm(startPoint.lat, startPoint.lng, stop.lat, stop.lng);
    const roadDist = estimateRoadDistanceKm(rawDist);
    const duration = estimateDurationMinutes(roadDist, speedKmH);
    return {
      ...stop,
      distanceFromStartKm: roadDist,
      durationFromStartMinutes: duration,
      legDistanceKm: roadDist,
      legDurationMinutes: duration,
    };
  });

  // Sort ascending by distance from start
  computedStops.sort((a, b) => (a.distanceFromStartKm ?? 0) - (b.distanceFromStartKm ?? 0));

  // Tag order index 1, 2, 3...
  const ranked = computedStops.map((stop, index) => ({
    ...stop,
    orderIndex: index + 1,
  }));

  return {
    rankedStops: ranked,
    nearestStop: ranked[0] || null,
  };
}

/**
 * Computes TSP distance matrix between all points
 */
function buildDistanceMatrix(points: LocationPoint[]): number[][] {
  const n = points.length;
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 0;
      } else {
        const straight = calculateHaversineDistanceKm(
          points[i].lat, points[i].lng,
          points[j].lat, points[j].lng
        );
        matrix[i][j] = estimateRoadDistanceKm(straight);
      }
    }
  }

  return matrix;
}

/**
 * 2-Opt local search improvement for Traveling Salesperson Problem (TSP).
 * Uncrosses loops to find the globally shortest practical route.
 */
function applyTwoOpt(tour: number[], distMatrix: number[][], roundTrip: boolean): number[] {
  let improved = true;
  let bestTour = [...tour];
  const maxIterations = 50;
  let iteration = 0;

  while (improved && iteration < maxIterations) {
    improved = false;
    iteration++;

    // Index 0 is the start point (fixed)
    for (let i = 1; i < bestTour.length - 1; i++) {
      for (let k = i + 1; k < bestTour.length; k++) {
        // Calculate current cost
        const prevA = bestTour[i - 1];
        const currA = bestTour[i];
        const currB = bestTour[k];
        const nextB = k + 1 < bestTour.length ? bestTour[k + 1] : (roundTrip ? bestTour[0] : null);

        const currentCost =
          distMatrix[prevA][currA] +
          (nextB !== null ? distMatrix[currB][nextB] : 0);

        const newCost =
          distMatrix[prevA][currB] +
          (nextB !== null ? distMatrix[currA][nextB] : 0);

        if (newCost < currentCost - 0.05) {
          // Reverse subsegment from i to k
          const sub = bestTour.slice(i, k + 1).reverse();
          bestTour = [...bestTour.slice(0, i), ...sub, ...bestTour.slice(k + 1)];
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }

  return bestTour;
}

/**
 * Smart Multi-stop Route Optimizer:
 * Combines Nearest Neighbor heuristic with 2-Opt TSP optimization.
 * Handles 3 to 100+ stops seamlessly in milliseconds.
 */
export function optimizeMultiStopRoute(
  startPoint: LocationPoint,
  stops: LocationPoint[],
  options: RouteOptimizationOptions
): {
  optimizedStops: LocationPoint[];
  summary: RouteSummary;
} {
  if (stops.length === 0) {
    return {
      optimizedStops: [],
      summary: {
        totalDistanceKm: 0,
        totalDurationMinutes: 0,
        stopCount: 0,
        estimatedFuelLiters: 0,
        estimatedCostInr: 0,
        completedStops: 0,
      },
    };
  }

  // All points: index 0 is startPoint, 1..n are stops
  const allPoints = [startPoint, ...stops];
  const n = allPoints.length;
  const distMatrix = buildDistanceMatrix(allPoints);

  // Step 1: Nearest Neighbor Heuristic Tour starting from point 0
  const visited = new Array(n).fill(false);
  visited[0] = true;
  const tour = [0];

  for (let step = 1; step < n; step++) {
    const current = tour[tour.length - 1];
    let nearestIdx = -1;
    let minDistance = Infinity;

    for (let candidate = 1; candidate < n; candidate++) {
      if (!visited[candidate]) {
        const d = distMatrix[current][candidate];
        if (d < minDistance) {
          minDistance = d;
          nearestIdx = candidate;
        }
      }
    }

    if (nearestIdx !== -1) {
      visited[nearestIdx] = true;
      tour.push(nearestIdx);
    }
  }

  // Step 2: 2-Opt Local Optimization
  const optimizedTourIndices = applyTwoOpt(tour, distMatrix, options.roundTrip);

  // Step 3: Reconstruct stops with leg and cumulative distances
  let cumulativeDistanceKm = 0;
  let cumulativeDurationMinutes = 0;
  const optimizedStops: LocationPoint[] = [];

  for (let i = 1; i < optimizedTourIndices.length; i++) {
    const prevPointIdx = optimizedTourIndices[i - 1];
    const currPointIdx = optimizedTourIndices[i];
    const originalStop = allPoints[currPointIdx];

    const legKm = distMatrix[prevPointIdx][currPointIdx];
    const legMins = estimateDurationMinutes(legKm, options.speedKmH);

    cumulativeDistanceKm += legKm;
    cumulativeDurationMinutes += legMins;

    optimizedStops.push({
      ...originalStop,
      orderIndex: i,
      legDistanceKm: Number(legKm.toFixed(2)),
      legDurationMinutes: legMins,
      distanceFromStartKm: Number(cumulativeDistanceKm.toFixed(2)),
      durationFromStartMinutes: cumulativeDurationMinutes,
    });
  }

  // If round-trip, add return leg to total
  if (options.roundTrip && optimizedStops.length > 0) {
    const lastStopIdx = optimizedTourIndices[optimizedTourIndices.length - 1];
    const returnKm = distMatrix[lastStopIdx][0];
    const returnMins = estimateDurationMinutes(returnKm, options.speedKmH);
    cumulativeDistanceKm += returnKm;
    cumulativeDurationMinutes += returnMins;
  }

  const fuelLiters = Number((cumulativeDistanceKm / options.fuelEfficiencyKmPerLiter).toFixed(2));
  const fuelCost = Math.round(fuelLiters * options.fuelPricePerLiter);
  const completedCount = stops.filter((s) => s.status === 'visited').length;

  return {
    optimizedStops,
    summary: {
      totalDistanceKm: Number(cumulativeDistanceKm.toFixed(2)),
      totalDurationMinutes: cumulativeDurationMinutes,
      stopCount: optimizedStops.length,
      nearestStopId: optimizedStops[0]?.id,
      nearestStopDistanceKm: optimizedStops[0]?.legDistanceKm,
      estimatedFuelLiters: fuelLiters,
      estimatedCostInr: fuelCost,
      completedStops: completedCount,
    },
  };
}

/**
 * Generates an official Google Maps Directions URL supporting up to 9 waypoints in standard query,
 * or direct turn-by-turn navigation for individual legs.
 */
export function buildGoogleMapsRouteUrl(
  startPoint: LocationPoint,
  stops: LocationPoint[],
  roundTrip: boolean = false
): string {
  if (stops.length === 0) return '';

  const origin = `${startPoint.lat},${startPoint.lng}`;
  const finalDest = roundTrip ? origin : `${stops[stops.length - 1].lat},${stops[stops.length - 1].lng}`;

  // Stops in between origin and finalDest
  const waypoints = roundTrip
    ? stops.map((s) => `${s.lat},${s.lng}`)
    : stops.slice(0, stops.length - 1).map((s) => `${s.lat},${s.lng}`);

  const baseUrl = 'https://www.google.com/maps/dir/?api=1';
  let url = `${baseUrl}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(finalDest)}&travelmode=driving`;

  if (waypoints.length > 0) {
    url += `&waypoints=${encodeURIComponent(waypoints.join('|'))}`;
  }

  return url;
}

/**
 * Generates single-stop turn-by-turn navigation link
 * On Android, this opens directly in Google Maps Navigation mode!
 */
export function buildSingleStopNavigationUrl(stop: LocationPoint): {
  webUrl: string;
  androidIntentUrl: string;
} {
  const query = `${stop.lat},${stop.lng}`;
  const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}&travelmode=driving`;
  const androidIntentUrl = `google.navigation:q=${query}`;
  return { webUrl, androidIntentUrl };
}

/**
 * Prepares WhatsApp formatted sharing text with clickable links
 */
export function formatWhatsAppShareText(
  startPoint: LocationPoint,
  stops: LocationPoint[],
  summary: RouteSummary,
  roundTrip: boolean = false,
  isHindi: boolean = true
): string {
  const gmapsUrl = buildGoogleMapsRouteUrl(startPoint, stops, roundTrip);

  if (isHindi) {
    let msg = `📍 *स्मार्ट रूट प्लान - यात्रा विवरण*\n\n`;
    msg += `🚀 *शुरुआती बिंदु:* ${startPoint.name} (${startPoint.address})\n`;
    msg += `📊 *कुल स्टॉप्स:* ${stops.length}\n`;
    msg += `📏 *कुल दूरी:* ~${summary.totalDistanceKm} KM\n`;
    msg += `⏱️ *अनुमानित समय:* ~${Math.floor(summary.totalDurationMinutes / 60)}h ${summary.totalDurationMinutes % 60}m\n\n`;
    msg += `*स्टॉप्स का सबसे छोटा क्रम (Optimized Order):*\n`;

    stops.forEach((s, idx) => {
      const badge = idx === 0 ? '🥇 (सबसे पास)' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '📍';
      msg += `\n${idx + 1}. ${badge} *${s.name}*\n`;
      msg += `   पता: ${s.address}\n`;
      if (s.phone) msg += `   संपर्क: ${s.phone}\n`;
      if (s.legDistanceKm) msg += `   दूरी: ${s.legDistanceKm} KM (${s.legDurationMinutes} min)\n`;
      msg += `   Google Maps: https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}\n`;
    });

    if (roundTrip) {
      msg += `\n🏁 *वापसी:* ${startPoint.name} (Round Trip)\n`;
    }

    msg += `\n🗺️ *पूरा रूट Google Maps में खोलें:*\n${gmapsUrl}\n`;
    return msg;
  }

  // English fallback
  let msg = `📍 *Smart Route Plan - Delivery & Visit Details*\n\n`;
  msg += `🚀 *Start Point:* ${startPoint.name} (${startPoint.address})\n`;
  msg += `📊 *Total Stops:* ${stops.length}\n`;
  msg += `📏 *Total Distance:* ~${summary.totalDistanceKm} KM\n`;
  msg += `⏱️ *Est. Time:* ~${Math.floor(summary.totalDurationMinutes / 60)}h ${summary.totalDurationMinutes % 60}m\n\n`;
  msg += `*Optimized Visiting Sequence:*\n`;

  stops.forEach((s, idx) => {
    const badge = idx === 0 ? '🥇 (Nearest)' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '📍';
    msg += `\n${idx + 1}. ${badge} *${s.name}*\n`;
    msg += `   Address: ${s.address}\n`;
    if (s.phone) msg += `   Phone: ${s.phone}\n`;
    if (s.legDistanceKm) msg += `   Leg: ${s.legDistanceKm} KM (${s.legDurationMinutes} mins)\n`;
    msg += `   Map: https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}\n`;
  });

  if (roundTrip) {
    msg += `\n🏁 *Return to Hub:* ${startPoint.name}\n`;
  }

  msg += `\n🗺️ *Open Full Route in Google Maps:*\n${gmapsUrl}\n`;
  return msg;
}
