import React from 'react';
import classNames from 'classnames';
import { getMetricValue, getMetricColor, getClipPathDefinition } from '../utils/metric-utils';
import { CANVAS_METRIC_FONT_SIZE } from '../constants/styles';


export default function NodeShapeSquare({ id, highlighted, color, rx = 0, ry = 0, metric }) {
  const rectProps = (scale, radiusScale) => ({
    width: scale * 2,
    height: scale * 2,
    rx: (radiusScale || scale) * rx,
    ry: (radiusScale || scale) * ry,
    x: -scale,
    y: -scale
  });

  const { height, hasMetric, formattedValue } = getMetricValue(metric);
  const metricStyle = { fill: getMetricColor(metric) };
  const className = classNames('shape', { metrics: hasMetric });
  const clipId = `mask-${id}`;

  return (
    <g className={className}>
      {hasMetric && getClipPathDefinition(clipId, height)}
      {highlighted && <rect
        className="highlighted" style={{ strokeWidth: 0.02 }} {...rectProps(0.7)} />}
      <rect
        className="border" style={{ strokeWidth: 0.05 }} stroke={color} {...rectProps(0.5, 0.5)} />
      <rect className="shadow" {...rectProps(0.45, 0.39)} />
      {hasMetric && <rect
        className="metric-fill" style={metricStyle}
        clipPath={`url(#${clipId})`}
        {...rectProps(0.45, 0.39)}
      />}
      {highlighted && hasMetric ?
        <text style={{fontSize: CANVAS_METRIC_FONT_SIZE}}>
          {formattedValue}
        </text> :
        <circle className="node" r={0.125} style={{ strokeWidth: 0.05 }} />}
    </g>
  );
}
