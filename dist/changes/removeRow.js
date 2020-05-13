'use strict';

var TablePosition = require('../TablePosition');
var getMergeCentre = require('../getMergeCentre');

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
                var mergeDirection = cell.data.get('mergeDirection');
                var mergeCentre = getMergeCentre({ mergeDirection: mergeDirection, table: table, columnIndex: index, rowIndex: at });
                var rowSpan = cell.data.get('rowspan') || 1;
                var colSpan = cell.data.get('colspan') || 1;

                if (isMerged && (mergeDirection.down || mergeDirection === 'down')) {
                    if (mergeCentre && mergeCentre.data.get('rowspan') > 1) {
                        var initialMergeCellData = mergeCentre.data.toJSON();
                        initialMergeCellData.rowspan = initialMergeCellData.rowspan - 1;
                        try {
                            editor.setNodeByKey(mergeCentre.key, { data: initialMergeCellData });
                        } catch (e) {
                            console.warn(e);
                        }
                    }
                }
                if (rowSpan > 1) {
                    for (var rowIndex = 0; rowIndex < rowSpan; rowIndex += 1) {
                        for (var columnIndex = 0; columnIndex < colSpan; columnIndex += 1) {
                            if (!(rowIndex === 0 && columnIndex === 0)) {
                                var nextCell = table.nodes.get(at + rowIndex).nodes.get(index + columnIndex);
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