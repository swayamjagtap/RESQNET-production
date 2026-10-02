import { useMemo, useState } from 'react';

export interface SvgStepChartProps {
  data: { x: number; y: number }[];
  maxX: number;
  maxY: number;
  width?: number;
  height?: number;
  color?: string;
  markers?: { x: number; label: string; color: string }[];
  ariaLabel?: string;
}

export function SvgStepChart({ data, maxX, maxY, width = 300, height = 150, color = 'var(--primary)', markers = [], ariaLabel = "Step chart" }: SvgStepChartProps) {
  const [showData, setShowData] = useState(false);

  const pathD = useMemo(() => {
    if (data.length === 0) return '';
    let d = `M 0 ${height}`;
    
    for (let i = 0; i < data.length; i++) {
      const pt = data[i];
      const x = (pt.x / Math.max(maxX, 1)) * width;
      const y = height - (pt.y / Math.max(maxY, 1)) * height;
      
      if (i === 0) {
        d += ` L ${x} ${height} L ${x} ${y}`;
      } else {
        const prev = data[i-1];
        d += ` L ${x} ${height - (prev.y / Math.max(maxY, 1)) * height} L ${x} ${y}`;
      }
    }
    
    // Line to end
    const lastY = data.length > 0 ? height - (data[data.length - 1].y / Math.max(maxY, 1)) * height : height;
    d += ` L ${width} ${lastY}`;
    return d;
  }, [data, maxX, maxY, width, height]);

  return (
    <div className="svg-step-chart" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '12px' }} onClick={() => setShowData(!showData)}>
          {showData ? 'Hide data' : 'View data'}
        </button>
      </div>
      
      {showData ? (
        <div style={{ maxHeight: `${height}px`, overflowY: 'auto', fontSize: '12px', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '4px' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th>Time (s)</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={i}>
                  <td>{d.x}</td>
                  <td>{d.y}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          style={{ width: '100%', height: 'auto', overflow: 'visible', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid var(--border-color)' }}
          aria-label={ariaLabel}
          role="img"
        >
          {/* Grid lines */}
          <line x1="0" y1="0" x2={width} y2="0" stroke="var(--border-color)" strokeWidth="1" />
          <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4,4" />
          <line x1="0" y1={height} x2={width} y2={height} stroke="var(--border-color)" strokeWidth="1" />
          
          <path d={pathD} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
          
          {/* Markers */}
          {markers.map((m, i) => {
            const mx = (m.x / Math.max(maxX, 1)) * width;
            return (
              <g key={i} transform={`translate(${mx}, 0)`}>
                <line x1="0" y1="0" x2="0" y2={height} stroke={m.color} strokeWidth="1" strokeDasharray="2,2" />
                <circle cx="0" cy={height} r="3" fill={m.color} />
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
