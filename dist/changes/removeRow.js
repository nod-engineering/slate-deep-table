'use strict';

var TablePosition = require('../TablePosition');

var _require = require('../getMergeCentre'),
    getMergeCentre = _require.getMergeCentre,
    getMergeCentreByPath = _require.getMergeCentreByPath;

/**
 * Remove current row in a table. Clear it if last remaining row
 *
 * @param {Object} opts
 * @param {Slate.Editor} editor
 * @param {Number} at
 * @return {Slate.Editor}
 */


function removeRow(opts, editor, at) {
    var value = editor.value;
    var startBlock = value.startBlock;


    var pos = TablePosition.create(value, startBlock, opts);
    var table = pos.table;


    if (typeof at === 'undefined') {
        at = pos.getRowIndex();
    }

    var row = table.nodes.get(at);
    // Update table by removing the row
    if (pos.getHeight() > 1) {
        editor.withoutNormalizing(function () {
            row.nodes.forEach(function (cell, index) {
                var isMerged = cell.data.get('isMerged');
                var colSpan = cell.data.get('colspan') || 1;
                var rowSpan = cell.data.get('rowspan') || 1;
                var mergeDirection = cell.data.get('mergeDirection');

                if (isMerged) {
                    var mergeCentrePath = cell.data.get('mergeCentre') || getMergeCentre({ mergeDirection: mergeDirection, table: table, columnIndex: index, rowIndex: at });

                    var _getMergeCentreByPath = getMergeCentreByPath({ path: mergeCentrePath, table: table, cellPosition: { x: index, y: at } }),
                        mergeCentreNode = _getMergeCentreByPath.mergeCentreNode,
                        mergeCentreNodePath = _getMergeCentreByPath.mergeCentreNodePath;

                    if ((mergeDirection.down || mergeDirection === 'down') && mergeCentreNodePath.y !== at) {
                        if (mergeCentreNode && mergeCentreNode.data.get('rowspan') > 1) {
                            var initialMergeCellData = mergeCentreNode.data.toJSON();
                            for (var rowIndex = 0; rowIndex < initialMergeCellData.rowspan || 0; rowIndex += 1) {
                                for (var columnIndex = 0; columnIndex < initialMergeCellData.colspan || 0; columnIndex += 1) {
                                    if (!(rowIndex === 0 && columnIndex === 0) && mergeCentreNodePath.y + rowIndex >= at) {
                                        var node = table.nodes.get(mergeCentreNodePath.y + rowIndex).nodes.get(mergeCentreNodePath.x + columnIndex);
                                        var cellData = node.data.toJSON();
                                        cellData.mergeCentre = {
                                            x: columnIndex,
                                            y: rowIndex > 0 ? rowIndex - 1 : 0
                                        };
                                        editor.setNodeByKey(node.key, { data: cellData });
                                    }
                                }
                            }
                            initialMergeCellData.rowspan = initialMergeCellData.rowspan - 1;
                            editor.setNodeByKey(mergeCentreNode.key, { data: initialMergeCellData });
                        }
                    }
                }

                if (rowSpan > 1) {
                    for (var _rowIndex = 0; _rowIndex < rowSpan; _rowIndex += 1) {
                        for (var _columnIndex = 0; _columnIndex < colSpan; _columnIndex += 1) {
                            if (!(_rowIndex === 0 && _columnIndex === 0)) {
                                var nextCell = table.nodes.get(at + _rowIndex).nodes.get(index + _columnIndex);
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
            });
            editor.removeNodeByKey(row.key).focus();
        });

        // If last remaining row, clear it instead
    } else {
        editor.withoutNormalizing(function () {
            row.nodes.forEach(function (cell) {
                // remove all children of cells
                // the schema will create an empty child content block in each cell
                cell.nodes.forEach(function (node) {
                    editor.removeNodeByKey(node.key);
                });
            });
            editor.focus();
        });
    }

    return editor;
}

module.exports = removeRow;