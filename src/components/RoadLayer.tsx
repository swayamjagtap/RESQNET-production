import { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { RoadGraph } from '../sim/graph';
import type { SimEngine } from '../sim/engine';
import { EdgeSpatialGrid, findNearestEdge } from '../lib/nearest-edge';

/** Road display style. */
function roadStyle(blockage: number): L.PolylineOptions {
  if (blockage === 2) return { color: '#dc2626', weight: 3, opacity: 0.85, dashArray: '6, 4' };
  if (blockage === 1) return { color: '#d97706', weight: 2.5, opacity: 0.7 };
  return { color: '#64748b', weight: 1, opacity: 0.3 };
}

function stateLabel(blockage: number): string {
  return blockage === 2 ? 'Blocked' : blockage === 1 ? 'Partial' : 'Clear';
}

export function RoadLayer({ graph, engine }: { graph: RoadGraph; engine: SimEngine }) {
  const map = useMap();
  const layerRef = useRef<L.FeatureGroup | null>(null);
  const polylinesRef = useRef<Map<string, L.Polyline>>(new Map());
  const rendererRef = useRef<L.Canvas | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const tooltipRef = useRef<L.Tooltip | null>(null);

  // Create canvas renderer once
  if (!rendererRef.current) {
    rendererRef.current = L.canvas({ padding: 0.5 });
  }
  const renderer = rendererRef.current;

  // Build spatial grid once per graph
  const spatialGrid = useMemo(() => new EdgeSpatialGrid(graph.edges), [graph]);

  // Draw road polylines
  useEffect(() => {
    if (!map || !graph || !graph.edges) return;
    const group = L.featureGroup();
    const pMap = new Map<string, L.Polyline>();

    for (const edge of graph.edges) {
      const blockage = graph.getBlockage(edge.id);
      const style = roadStyle(blockage);
      const polyline = L.polyline(edge.geometry as [number, number][], {
        ...style,
        renderer,
        interactive: false,
      });
      group.addLayer(polyline);
      pMap.set(edge.id, polyline);
    }

    group.addTo(map);
    layerRef.current = group;
    polylinesRef.current = pMap;

    return () => {
      group.remove();
    };
  }, [map, graph, renderer]);

  // Tooltip for hovered road
  useEffect(() => {
    if (!map) return;
    if (tooltipRef.current) {
      map.closeTooltip(tooltipRef.current);
      tooltipRef.current = null;
    }
    if (hoveredEdgeId) {
      const edge = graph.edges.find(e => e.id === hoveredEdgeId);
      if (edge) {
        const midIdx = Math.floor(edge.geometry.length / 2);
        const mid = edge.geometry[midIdx];
        const blockage = graph.getBlockage(edge.id);
        const name = edge.name || 'Unnamed road';
        const tooltip = L.tooltip({ permanent: false, direction: 'top', offset: [0, -8] })
          .setLatLng([mid[0], mid[1]])
          .setContent(`<b>${name}</b><br>State: ${stateLabel(blockage)}`);
        tooltip.addTo(map);
        tooltipRef.current = tooltip;
      }
    }
    return () => {
      if (tooltipRef.current) {
        map.closeTooltip(tooltipRef.current);
        tooltipRef.current = null;
      }
    };
  }, [hoveredEdgeId, map, graph]);

  // Cycle blockage on click, ignore marker clicks
  const handleClick = useCallback((e: L.LeafletMouseEvent) => {
    // Ignore clicks on markers (originalEvent.target is a marker element)
    const target = e.originalEvent?.target as HTMLElement | undefined;
    if (target?.closest?.('.leaflet-marker-icon') || target?.closest?.('.leaflet-marker-pane')) return;

    const latLngToPixel = (lat: number, lng: number) => {
      const pt = map.latLngToContainerPoint([lat, lng]);
      return { x: pt.x, y: pt.y };
    };

    // Use larger tolerance on touch devices
    const tolerance = e.originalEvent instanceof TouchEvent ? 24 : 14;
    const result = findNearestEdge(e.latlng.lat, e.latlng.lng, latLngToPixel, spatialGrid, tolerance);
    if (!result) return;

    const current = graph.getBlockage(result.edgeId);
    const next = (current === 0 ? 1 : current === 1 ? 2 : 0) as 0 | 1 | 2;
    engine.setBlockage(result.edgeId, next);

    // Update polyline style
    const polyline = polylinesRef.current.get(result.edgeId);
    if (polyline) {
      polyline.setStyle(roadStyle(next));
    }

    // Update tooltip
    setHoveredEdgeId(result.edgeId);
  }, [map, spatialGrid, graph, engine]);

  // Mouse move for hover highlight
  const handleMouseMove = useCallback((e: L.LeafletMouseEvent) => {
    const target = e.originalEvent?.target as HTMLElement | undefined;
    if (target?.closest?.('.leaflet-marker-icon')) {
      setHoveredEdgeId(null);
      return;
    }

    const latLngToPixel = (lat: number, lng: number) => {
      const pt = map.latLngToContainerPoint([lat, lng]);
      return { x: pt.x, y: pt.y };
    };

    const result = findNearestEdge(e.latlng.lat, e.latlng.lng, latLngToPixel, spatialGrid, 14);
    setHoveredEdgeId(result?.edgeId ?? null);
  }, [map, spatialGrid]);

  useMapEvents({
    click: handleClick,
    mousemove: handleMouseMove,
    mouseout: () => setHoveredEdgeId(null),
    dragstart: () => setHoveredEdgeId(null),
    zoomstart: () => setHoveredEdgeId(null),
  });

  return null;
}
