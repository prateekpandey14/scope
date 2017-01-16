import React from 'react';
import classNames from 'classnames';

import NodeDetailsTableNodeLink from './node-details-table-node-link';
import NodeDetailsTableNodeMetric from './node-details-table-node-metric';
import { formatDataType } from '../../utils/string-utils';

function getValuesForNode(node) {
  const values = {};
  ['metrics', 'metadata'].forEach((collection) => {
    if (node[collection]) {
      node[collection].forEach((field) => {
        const result = Object.assign({}, field);
        result.valueType = collection;
        values[field.id] = result;
      });
    }
  });

  (node.parents || []).forEach((p) => {
    values[p.topologyId] = {
      id: p.topologyId,
      label: p.topologyId,
      value: p.label,
      relative: p,
      valueType: 'relatives',
    };
  });

  return values;
}

function renderValues(node, columns = [], columnStyles = []) {
  const fields = getValuesForNode(node);
  return columns.map(({id}, i) => {
    const field = fields[id];
    const style = columnStyles[i];
    if (field) {
      if (field.valueType === 'metadata') {
        const {value, title} = formatDataType(field);
        return (
          <td
            className="node-details-table-node-value truncate"
            title={title}
            style={style}
            key={field.id}>
            {value}
          </td>
        );
      }
      if (field.valueType === 'relatives') {
        return (
          <td
            className="node-details-table-node-value truncate"
            title={field.value}
            style={style}
            key={field.id}>
            {<NodeDetailsTableNodeLink linkable nodeId={field.relative.id} {...field.relative} />}
          </td>
        );
      }
      return <NodeDetailsTableNodeMetric style={style} key={field.id} {...field} />;
    }
    // empty cell to complete the row for proper hover
    return <td className="node-details-table-node-value" style={style} key={id} />;
  });
}


export default class NodeDetailsTableRow extends React.Component {
  constructor(props, context) {
    super(props, context);

    //
    // We watch how far the mouse moves when click on a row, move to much and we assume that the
    // user is selecting some data in the row. In this case don't trigger the onClick event which
    // is most likely a details panel popping open.
    //
    this.state = { focused: false };
    this.mouseDragOrigin = [0, 0];

    this.saveLabelElementRef = this.saveLabelElementRef.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseEnter = this.onMouseEnter.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
  }

  saveLabelElementRef(ref) {
    this.labelElement = ref;
  }

  onMouseEnter(ev) {
    ev.preventDefault();
    this.setState({ focused: true });
    if (this.props.onMouseEnter) {
      this.props.onMouseEnter(this);
    }
  }

  onMouseLeave() {
    // ev.preventDefault();
    this.setState({ focused: false });
    if (this.props.onMouseLeave) {
      this.props.onMouseLeave(this);
    }
  }

  onMouseDown(ev) {
    const { pageX, pageY } = ev;
    this.mouseDragOrigin = [pageX, pageY];
  }

  onMouseUp(ev) {
    const [originX, originY] = this.mouseDragOrigin;
    const { pageX, pageY } = ev;
    const thresholdPx = 2;
    const movedTheMouseTooMuch = (
      Math.abs(originX - pageX) > thresholdPx ||
      Math.abs(originY - pageY) > thresholdPx
    );
    if (movedTheMouseTooMuch) {
      return;
    }

    const { node, onClick } = this.props;
    onClick(ev, node, this.labelElement);
  }

  render() {
    const { focused } = this.state;
    const { node, nodeIdKey, topologyId, columns, onClick, selected, colStyles } = this.props;
    const [firstColumnStyle, ...columnStyles] = colStyles;
    const values = renderValues(node, columns, columnStyles);
    const nodeId = node[nodeIdKey];
    const className = classNames('node-details-table-node', { selected, focused });

    if (!node.id) {
      return <tr className="node-details-table-dummynode" />;
    }

    return (
      <tr
        onMouseDown={onClick && this.onMouseDown}
        onMouseUp={onClick && this.onMouseUp}
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}
        className={className}>
        <td
          className="node-details-table-node-label truncate"
          ref={this.saveLabelElementRef} style={firstColumnStyle}>
          {this.props.renderIdCell(Object.assign(node, {topologyId, nodeId}))}
        </td>
        {values}
      </tr>
    );
  }
}


NodeDetailsTableRow.defaultProps = {
  renderIdCell: props => <NodeDetailsTableNodeLink {...props} />
};
