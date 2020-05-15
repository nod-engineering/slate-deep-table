'use strict';

var TablePosition = require('../TablePosition');

var _require = require('../getMergeCentre'),
    getMergeCentre = _require.getMergeCentre,
    getMergeCentreByPath = _require.getMergeCentreByPath;

/**
 * Delete current column in a table
 *
 * @param {Object} opts
 * @param {Slate.Editor} editor
 * @param {Number} at
 * @return {Slate.Editor}
 */


function removeColumn(opts, editor, at) {
    var value = editor.value;
    var startBlock = value.startBlock;


    var pos = TablePosition.create(value, startBlock, opts);
    var table = pos.table;


    if (typeof at === 'undefined') {
        at = pos.getColumnIndex();
    }

    var rows = table.nodes;

    // Remove the cell from every row
    if (pos.getWidth() > 1) {
        editor.withoutNormalizing(function () {
            rows.forEach(function (row, index) {
                var cell = row.nodes.get(at);
                var isMerged = cell.data.get('isMerged');
                var mergeDirection = cell.data.get('mergeDirection');
                var colSpan = cell.data.get('colspan') || 1;
                var rowSpan = cell.data.get('rowspan') || 1;

                if (isMerged) {
                    var mergeCentrePath = cell.data.get('mergeCentre') || getMergeCentre({ mergeDirection: mergeDirection, table: table, columnIndex: at, rowIndex: index });

                    var _getMergeCentreByPath = getMergeCentreByPath({ path: mergeCentrePath, table: table, cellPosition: { x: at, y: index } }),
                        mergeCentreNode = _getMergeCentreByPath.mergeCentreNode,
                        mergeCentreNodePath = _getMergeCentreByPath.mergeCentreNodePath;

                    if ((mergeDirection.right || mergeDirection === 'right') && mergeCentreNodePath.x !== at) {

                        if (mergeCentreNode && mergeCentreNode.data.get('colspan') > 1) {
                            var initialMergeCellData = mergeCentreNode.data.toJSON();
                            for (var rowIndex = 0; rowIndex < initialMergeCellData.rowspan || 0; rowIndex += 1) {
                                for (var columnIndex = 0; columnIndex < initialMergeCellData.colspan || 0; columnIndex += 1) {
                                    if (!(rowIndex === 0 && columnIndex === 0) && mergeCentreNodePath.x + columnIndex > at) {
                                        var node = table.nodes.get(mergeCentreNodePath.y + rowIndex).nodes.get(mergeCentreNodePath.x + columnIndex);
                                        var cellData = node.data.toJSON();
                                        cellData.mergeCentre = {
                                            x: columnIndex > 0 ? columnIndex - 1 : 0,
                                            y: rowIndex
                                        };
                                        editor.setNodeByKey(node.key, { data: cellData });
                                    }
                                }
                            }
                            initialMergeCellData.colspan = initialMergeCellData.colspan - 1;
                            editor.setNodeByKey(mergeCentreNode.key, { data: initialMergeCellData });
                        }
                    }
                }
                if (colSpan > 1) {
                    for (var _rowIndex = 0; _rowIndex < rowSpan; _rowIndex += 1) {
                        for (var _columnIndex = 0; _columnIndex < colSpan; _columnIndex += 1) {
                            if (!(_rowIndex === 0 && _columnIndex === 0)) {
                                var nextCell = rows.get(index + _rowIndex).nodes.get(at + _columnIndex);
                                if (nextCell.data.get('isMerged')) {
                                    var data = nextCell.data.toJSON();
                                    delete data.isMerged;
                                    delete data.colspan;
                                    delete data.rowspan;
                                    delete data.mergeCentre;
                                    delete data.mergeDirection;
                                    editor.setNodeByKey(nextCell.key, { data: data });
                                }
                            }
                        }
                    }
                }
                editor.removeNodeByKey(cell.key).focus();
            });
        });
    }
    // If last column, clear text in cells instead
    else {
            editor.withoutNormalizing(function () {
                rows.forEach(function (row) {
                    row.nodes.forEach(function (cell) {
                        // remove all children of cells
                        // the schema will create an empty child content block in each cell
                        cell.nodes.forEach(function (node) {
                            editor.removeNodeByKey(node.key);
                        });
                    });
                });
                editor.focus();
            });
        }

    // Replace the table
    return editor;
}

module.exports = removeColumn;