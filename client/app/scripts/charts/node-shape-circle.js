import React from 'react';
import classNames from 'classnames';
import { getMetricValue, getMetricColor, getClipPathDefinition } from '../utils/metric-utils';
import { CANVAS_METRIC_FONT_SIZE } from '../constants/styles';


export default function NodeShapeCircle({id, highlighted, color, metric}) {
  const { height, hasMetric, formattedValue } = getMetricValue(metric);
  const metricStyle = { fill: getMetricColor(metric) };
  const className = classNames('shape', { metrics: hasMetric });
  const clipId = `mask-${id}`;

  return (
    <g className={className}>
      {hasMetric && getClipPathDefinition(clipId, height)}
      {highlighted && <circle r={0.7} style={{ strokeWidth: 0.02 }} className="highlighted" />}
      <circle r={0.5} style={{ strokeWidth: 0.05 }} className="border" stroke={color} />
      <circle r={0.45} className="shadow" />
      {hasMetric && <circle
        r={0.45}
        className="metric-fill"
        style={metricStyle}
        clipPath={`url(#${clipId})`}
      />}
      {highlighted && hasMetric ?
        <text style={{fontSize: CANVAS_METRIC_FONT_SIZE}}>{formattedValue}</text> :
        <circle className="node" r={0.125} style={{ strokeWidth: 0.05 }} />}
    </g>
  );
}
