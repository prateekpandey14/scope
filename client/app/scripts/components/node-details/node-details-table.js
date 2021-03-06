import React from 'react';
import classNames from 'classnames';
import { find, get, union, sortBy, groupBy, concat } from 'lodash';

import { NODE_DETAILS_DATA_ROWS_DEFAULT_LIMIT } from '../../constants/limits';

import ShowMore from '../show-more';
import NodeDetailsTableRow from './node-details-table-row';
import NodeDetailsTableHeaders from './node-details-table-headers';
import { ipToPaddedString } from '../../utils/string-utils';
import {
  isIP, isNumber, defaultSortDesc, getTableColumnsStyles
} from '../../utils/node-details-utils';


function getDefaultSortedBy(columns, nodes) {
  // default sorter specified by columns
  const defaultSortColumn = find(columns, {defaultSort: true});
  if (defaultSortColumn) {
    return defaultSortColumn.id;
  }
  // otherwise choose first metric
  const firstNodeWithMetrics = find(nodes, n => get(n, ['metrics', 0]));
  if (firstNodeWithMetrics) {
    return get(firstNodeWithMetrics, ['metrics', 0, 'id']);
  }

  return 'label';
}


function maybeToLower(value) {
  if (!value || !value.toLowerCase) {
    return value;
  }
  return value.toLowerCase();
}


function getNodeValue(node, header) {
  const fieldId = header && header.id;
  if (fieldId !== null) {
    let field = union(node.metrics, node.metadata).find(f => f.id === fieldId);

    if (field) {
      if (isIP(header)) {
        // Format the IPs so that they are sorted numerically.
        return ipToPaddedString(field.value);
      } else if (isNumber(header)) {
        return parseFloat(field.value);
      }
      return field.value;
    }

    if (node.parents) {
      field = node.parents.find(f => f.topologyId === fieldId);
      if (field) {
        return field.label;
      }
    }

    if (node[fieldId] !== undefined && node[fieldId] !== null) {
      return node[fieldId];
    }
  }

  return null;
}


function getValueForSortedBy(sortedByHeader) {
  return node => maybeToLower(getNodeValue(node, sortedByHeader));
}


function getMetaDataSorters(nodes) {
  // returns an array of sorters that will take a node
  return get(nodes, [0, 'metadata'], []).map((field, index) => (node) => {
    const nodeMetadataField = node.metadata && node.metadata[index];
    if (nodeMetadataField) {
      if (isNumber(nodeMetadataField)) {
        return parseFloat(nodeMetadataField.value);
      }
      return nodeMetadataField.value;
    }
    return null;
  });
}


function sortNodes(nodes, getValue, sortedDesc) {
  const sortedNodes = sortBy(
    nodes,
    getValue,
    getMetaDataSorters(nodes)
  );
  if (sortedDesc) {
    sortedNodes.reverse();
  }
  return sortedNodes;
}


function getSortedNodes(nodes, sortedByHeader, sortedDesc) {
  const getValue = getValueForSortedBy(sortedByHeader);
  const withAndWithoutValues = groupBy(nodes, (n) => {
    const v = getValue(n);
    return v !== null && v !== undefined ? 'withValues' : 'withoutValues';
  });
  const withValues = sortNodes(withAndWithoutValues.withValues, getValue, sortedDesc);
  const withoutValues = sortNodes(withAndWithoutValues.withoutValues, getValue, sortedDesc);

  return concat(withValues, withoutValues);
}


export default class NodeDetailsTable extends React.Component {

  constructor(props, context) {
    super(props, context);
    this.state = {
      limit: props.limit || NODE_DETAILS_DATA_ROWS_DEFAULT_LIMIT,
      sortedDesc: this.props.sortedDesc,
      sortedBy: this.props.sortedBy
    };
    this.handleLimitClick = this.handleLimitClick.bind(this);
    this.updateSorted = this.updateSorted.bind(this);
  }

  updateSorted(sortedBy, sortedDesc) {
    this.setState({ sortedBy, sortedDesc });
    this.props.onSortChange(sortedBy, sortedDesc);
  }

  handleLimitClick() {
    const limit = this.state.limit ? 0 : NODE_DETAILS_DATA_ROWS_DEFAULT_LIMIT;
    this.setState({ limit });
  }

  getColumnHeaders() {
    const columns = this.props.columns || [];
    return [{id: 'label', label: this.props.label}].concat(columns);
  }

  render() {
    const { nodeIdKey, columns, topologyId, onClickRow, onMouseEnter, onMouseLeave,
      onMouseEnterRow, onMouseLeaveRow } = this.props;

    const sortedBy = this.state.sortedBy || getDefaultSortedBy(columns, this.props.nodes);
    const sortedByHeader = this.getColumnHeaders().find(h => h.id === sortedBy);
    const sortedDesc = this.state.sortedDesc || defaultSortDesc(sortedByHeader);

    let nodes = getSortedNodes(this.props.nodes, sortedByHeader, sortedDesc);
    const limited = nodes && this.state.limit > 0 && nodes.length > this.state.limit;
    const expanded = this.state.limit === 0;
    const notShown = nodes.length - this.state.limit;
    if (nodes && limited) {
      nodes = nodes.slice(0, this.state.limit);
    }

    const className = classNames('node-details-table-wrapper-wrapper', this.props.className);
    const headers = this.getColumnHeaders();
    const styles = getTableColumnsStyles(headers);

    return (
      <div className={className} style={this.props.style}>
        <div className="node-details-table-wrapper">
          <table className="node-details-table">
            <thead>
              {this.props.nodes && this.props.nodes.length > 0 && <NodeDetailsTableHeaders
                headers={headers}
                sortedBy={sortedBy}
                sortedDesc={sortedDesc}
                onClick={this.updateSorted}
              />}
            </thead>
            <tbody
              style={this.props.tbodyStyle}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}>
              {nodes && nodes.map(node => (
                <NodeDetailsTableRow
                  key={node.id}
                  renderIdCell={this.props.renderIdCell}
                  selected={this.props.selectedNodeId === node.id}
                  node={node}
                  nodeIdKey={nodeIdKey}
                  colStyles={styles}
                  columns={columns}
                  onClick={onClickRow}
                  onMouseLeaveRow={onMouseLeaveRow}
                  onMouseEnterRow={onMouseEnterRow}
                  topologyId={topologyId} />
              ))}
            </tbody>
          </table>
          <ShowMore
            handleClick={this.handleLimitClick}
            collection={nodes}
            expanded={expanded}
            notShown={notShown} />
        </div>
      </div>
    );
  }
}


NodeDetailsTable.defaultProps = {
  nodeIdKey: 'id',  // key to identify a node in a row (used for topology links)
  onSortChange: () => {},
  sortedDesc: null,
  sortedBy: null,
};
