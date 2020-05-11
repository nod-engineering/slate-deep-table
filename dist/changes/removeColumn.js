'use strict';

var TablePosition = require('../TablePosition');

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
    var startBlock = value.startBlock,
        document = value.document;


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
                var mergeCentre = cell.data.get('mergeCentre');
                var colSpan = cell.data.get('colspan') || 1;
                var rowSpan = cell.data.get('rowspan') || 1;

                if (isMerged && mergeDirection.right) {
                    var selectedCell = document.getNode(mergeCentre);

                    if (selectedCell && selectedCell.data.get('colspan') > 1) {
                        var initialMergeCellData = selectedCell.data.toJSON();
                        initialMergeCellData.colspan = initialMergeCellData.colspan - 1;
                        try {
                            editor.setNodeByKey(selectedCell.key, { data: initialMergeCellData });
                        } catch (e) {
                            console.warn(e);
                        }
                    }
                }

                if (colSpan > 1) {
                    for (var rowIndex = 0; rowIndex < rowSpan; rowIndex += 1) {
                        for (var columnIndex = 0; columnIndex < colSpan; columnIndex += 1) {
                            if (!(rowIndex === 0 && columnIndex === 0)) {
                                var nextCell = rows.get(index + rowIndex).nodes.get(at + columnIndex);
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