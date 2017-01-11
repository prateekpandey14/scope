import React from 'react';
import classNames from 'classnames';
import { line, curveCardinalClosed } from 'd3-shape';
import { getMetricValue, getMetricColor, getClipPathDefinition } from '../utils/metric-utils';
import { CANVAS_METRIC_FONT_SIZE } from '../constants/styles';


const spline = line()
  .curve(curveCardinalClosed.tension(0.65));


function getWidth(h) {
  return (Math.sqrt(3) / 2) * h;
}


function getPoints(h) {
  const w = getWidth(h);
  const points = [
    [w * 0.5, 0],
    [w, 0.25 * h],
    [w, 0.75 * h],
    [w * 0.5, h],
    [0, 0.75 * h],
    [0, 0.25 * h]
  ];

  return spline(points);
}


export default function NodeShapeHexagon({id, highlighted, color, metric}) {
  const pathProps = v => ({
    d: getPoints(v * 2),
    transform: `translate(-${getWidth(v)}, -${v})`
  });

  const shadowSize = 0.45;

  const clipId = `mask-${id}`;
  const {height, hasMetric, formattedValue} = getMetricValue(metric);
  const metricStyle = { fill: getMetricColor(metric) };
  const className = classNames('shape', { metrics: hasMetric });
  // how much the hex curve line interpolator curves outside the original shape definition in
  // percent (very roughly)
  const hexCurve = 0.05;

  return (
    <g className={className}>
      {hasMetric && getClipPathDefinition(
        clipId,
        (1 + (hexCurve * 2)),
        height,
        -hexCurve,
        (1 - height) * (shadowSize * 2)
      )}
      {highlighted && <path
        className="highlighted" style={{ strokeWidth: 0.02 }} {...pathProps(0.7)} />}
      <path className="border" stroke={color} style={{ strokeWidth: 0.05 }} {...pathProps(0.5)} />
      <path className="shadow" {...pathProps(shadowSize)} />
      {hasMetric && <path
        className="metric-fill"
        style={metricStyle}
        clipPath={`url(#${clipId})`}
        {...pathProps(shadowSize)}
      />}
      {highlighted && hasMetric ?
        <text style={{fontSize: CANVAS_METRIC_FONT_SIZE}}>
          {formattedValue}
        </text> :
        <circle className="node" r={0.125} style={{ strokeWidth: 0.05 }} />}
    </g>
  );
}
