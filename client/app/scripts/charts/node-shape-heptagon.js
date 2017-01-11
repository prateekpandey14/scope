import React from 'react';
import classNames from 'classnames';
import { line, curveCardinalClosed } from 'd3-shape';
import { getMetricValue, getMetricColor, getClipPathDefinition } from '../utils/metric-utils';
import { CANVAS_METRIC_FONT_SIZE } from '../constants/styles';


const spline = line()
  .curve(curveCardinalClosed.tension(0.65));


function polygon(r, sides) {
  const a = (Math.PI * 2) / sides;
  const points = [];
  for (let i = 0; i < sides; i += 1) {
    points.push([r * Math.sin(a * i), -r * Math.cos(a * i)]);
  }
  return points;
}


export default function NodeShapeHeptagon({id, highlighted, color, metric}) {
  const pathProps = v => ({
    d: spline(polygon(v, 7))
  });

  const { height, hasMetric, formattedValue } = getMetricValue(metric);
  const metricStyle = { fill: getMetricColor(metric) };
  const className = classNames('shape', { metrics: hasMetric });
  const clipId = `mask-${id}`;

  return (
    <g className={className}>
      {hasMetric && getClipPathDefinition(clipId, height, -0.5, 0.5 - height)}
      {highlighted && <path
        className="highlighted" style={{ strokeWidth: 0.02 }} {...pathProps(0.7)} />}
      <path className="border" style={{ strokeWidth: 0.05 }} stroke={color} {...pathProps(0.5)} />
      <path className="shadow" {...pathProps(0.45)} />
      {hasMetric && <path
        className="metric-fill"
        clipPath={`url(#${clipId})`}
        style={metricStyle}
        {...pathProps(0.45)}
      />}
      {highlighted && hasMetric ?
        <text style={{fontSize: CANVAS_METRIC_FONT_SIZE}}>{formattedValue}</text> :
        <circle className="node" r={0.125} style={{ strokeWidth: 0.05 }} />}
    </g>
  );
}
