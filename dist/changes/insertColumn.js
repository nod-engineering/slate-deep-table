'use strict';

var TablePosition = require('../TablePosition');
var moveSelection = require('./moveSelection');
var createCell = require('../createCell');

var _require = require('../getMergeCentre'),
    getMergeCentre = _require.getMergeCentre,
    getMergeCentreByPath = _require.getMergeCentreByPath;

/**
 * Insert a new column in current table
 *
 * @param {Object} opts
 * @param {Slate.Editor} editor
 * @param {Number} at
 * @return {Slate.Editor}
 */


function insertColumn(opts, editor, at) {
    var value = editor.value;
    var startBlock = value.startBlock;


    var pos = TablePosition.create(value, startBlock, opts);
    var table = pos.table;


    if (typeof at === 'undefined') {
        at = pos.getColumnIndex() + (pos.cell.data.get('colspan') || 1);
    }

    var newCells = [];
    var initialMergeCentre = [];

    var column = table.nodes.map(function (row) {
        return row.nodes.get(at);
    });

    table.nodes.forEach(function (rowNode, index) {
        var node = rowNode.nodes.get(at);
        var newCell = createCell(opts);
        if (node) {
            var isMerged = node.data.get('isMerged');
            if (isMerged) {
                var mergeDirection = node.data.get('mergeDirection');
                var mergeCentrePath = node.data.get('mergeCentre') || getMergeCentre({ mergeDirection: mergeDirection, table: table, columnIndex: at, rowIndex: index });

                var _getMergeCentreByPath = getMergeCentreByPath({ path: mergeCentrePath, table: table, cellPosition: { x: at, y: index } }),
                    mergeCentreNode = _getMergeCentreByPath.mergeCentreNode,
                    mergeCentreNodePath = _getMergeCentreByPath.mergeCentreNodePath;

                if ((mergeDirection.right || mergeDirection === 'right') && mergeCentreNode && rowNode.nodes.find(function (rowCell) {
                    return rowCell.key === mergeCentreNode.key;
                })) {
                    if (mergeCentreNode && mergeCentreNode.data.get('colspan') > 1) {
                        initialMergeCentre.push({ mergeCentreNode: mergeCentreNode, mergeCentreNodePath: mergeCentreNodePath });
                    }
                }
                var addMergedCell = false;

                if (mergeDirection && mergeCentreNode) {
                    if ((mergeDirection.right || mergeDirection === 'right') && !(mergeDirection.down || mergeDirection === 'down') && rowNode.nodes.find(function (rowCell) {
                        return rowCell.key === mergeCentreNode.key;
                    })) {
                        addMergedCell = true;
                    } else if ((mergeDirection.right || mergeDirection === 'right') && (mergeDirection.down || mergeDirection === 'down') && !column.find(function (cell) {
                        return cell.key === mergeCentreNode.key;
                    })) {
                        addMergedCell = true;
                    }
                }
                if (addMergedCell) {
                    newCell = newCell.setIn(['data', 'isMerged'], isMerged);
                    newCell = newCell.setIn(['data', 'mergeDirection'], mergeDirection);
                    newCell = newCell.setIn(['data', 'mergeCentre'], mergeCentrePath);
                }
            }
        }
        newCells.push({ rowKey: rowNode.key, newCell: newCell });
    });

    // Insert the new cell
    editor.withoutNormalizing(function () {
        if (initialMergeCentre.length > 0) {
            initialMergeCentre.forEach(function (_ref) {
                var mergeCentreNode = _ref.mergeCentreNode,
                    mergeCentreNodePath = _ref.mergeCentreNodePath;

                var initialMergeCellData = mergeCentreNode.data.toJSON();
                for (var rowIndex = 0; rowIndex < initialMergeCellData.rowspan || 0; rowIndex += 1) {
                    for (var columnIndex = 0; columnIndex < initialMergeCellData.colspan || 0; columnIndex += 1) {
                        if (!(rowIndex === 0 && columnIndex === 0) && mergeCentreNodePath.x + columnIndex >= at) {
                            var cell = table.nodes.get(mergeCentreNodePath.y + rowIndex).nodes.get(mergeCentreNodePath.x + columnIndex);
                            var cellData = cell.data.toJSON();
                            cellData.mergeCentre = {
                                x: columnIndex + 1,
                                y: rowIndex
                            };
                            editor.setNodeByKey(cell.key, { data: cellData });
                        }
                    }
                }
                initialMergeCellData.colspan = initialMergeCellData.colspan + 1;
                editor.setNodeByKey(mergeCentreNode.key, { data: initialMergeCellData });
            });
        }
        newCells.forEach(function (item) {
            editor.insertNodeByKey(item.rowKey, at, item.newCell);
        });
    });

    // Update the selection (not doing can break the undo)
    return moveSelection(opts, editor, pos.getColumnIndex() + 1, pos.getRowIndex());
}

module.exports = insertColumn;