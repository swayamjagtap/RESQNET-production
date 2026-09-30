import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { RoadGraph } from '../sim/graph';
import type { SimEngine } from '../sim/engine';

export function RoadLayer({ graph, engine }: { graph: RoadGraph; engine: SimEngine }) {
  const map = useMap();
  const layerRef = useRef<L.FeatureGroup | null>(null);

  useEffect(() => {
    const renderer = L.canvas({ padding: 0.5 });
    const group = L.featureGroup();

    for (const edge of graph.edges) {
      const isBlocked = edge.blockage === 2;
      const isPartial = edge.blockage === 1;

      const polyline = L.polyline(
        edge.geometry as [number, number][],
        {
          color: isBlocked ? '#ef4444' : isPartial ? '#f59e0b' : '#94a3b8',
          weight: isBlocked ? 4 : isPartial ? 3 : 2,
          opacity: isBlocked || isPartial ? 0.8 : 0.4,
          dashArray: isBlocked ? '5, 5' : undefined,
          renderer,
        }
      );

      // Wider invisible hit line for forgiving clicks
      const hitLine = L.polyline(
        edge.geometry as [number, number][],
        {
          color: 'transparent',
          weight: 15,
          renderer,
        }
      );

      hitLine.bindTooltip(`Road: ${edge.id}<br>State: ${isBlocked ? 'Blocked' : isPartial ? 'Partial' : 'Clear'}`);

      hitLine.on('click', () => {
        const current = graph.getBlockage(edge.id);
        const next = current === 0 ? 1 : current === 1 ? 2 : 0;
        engine.setBlockage(edge.id, next as 0 | 1 | 2);

        const newBlocked = next === 2;
        const newPartial = next === 1;

        polyline.setStyle({
          color: newBlocked ? '#ef4444' : newPartial ? '#f59e0b' : '#94a3b8',
          weight: newBlocked ? 4 : newPartial ? 3 : 2,
          opacity: newBlocked || newPartial ? 0.8 : 0.4,
          dashArray: newBlocked ? '5, 5' : undefined,
        });
        
        hitLine.setTooltipContent(`Road: ${edge.id}<br>State: ${newBlocked ? 'Blocked' : newPartial ? 'Partial' : 'Clear'}`);
      });

      group.addLayer(polyline);
      group.addLayer(hitLine);
    }

    group.addTo(map);
    layerRef.current = group;

    return () => {
      group.remove();
    };
  }, [map, graph, engine]);

  return null;
}
