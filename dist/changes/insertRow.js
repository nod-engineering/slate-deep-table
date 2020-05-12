'use strict';

var createRow = require('../createRow');
var TablePosition = require('../TablePosition');
var getMergeCentre = require('../getMergeCentre');

/**
 * Insert a new row in current table
 *
 * @param {Object} opts
 * @param {Slate.Editor} editor
 * @param {Number} at
 * @param {Function} textGetter
 * @return {Slate.Editor}
 */
function insertRow(opts, editor, at, textGetter) {
    var value = editor.value;
    var startBlock = value.startBlock,
        document = value.document;


    var pos = TablePosition.create(value, startBlock, opts);
    var table = pos.table;

    // Create a new row with the right count of cells

    var firstRow = table.nodes.get(0);
    var newRow = createRow(opts, firstRow.nodes.size, textGetter);

    if (typeof at === 'undefined') {
        at = pos.getRowIndex() + (pos.cell.data.get('rowspan') || 1);
    }

    var initialMergeCells = [];

    var nextRow = table.nodes.get(at);
    if (nextRow) {
        nextRow.nodes.forEach(function (node, index) {
            var isMerged = node.data.get('isMerged');
            var mergeDirection = node.data.get('mergeDirection') || {};
            var mergeCentre = node.data.get('mergeCentre') || getMergeCentre({ mergeDirection: mergeDirection, table: table, columnIndex: index, rowIndex: at });

            if (isMerged) {
                if (mergeDirection.down || mergeDirection === 'down') {
                    var row = nextRow.nodes;
                    if (!row.find(function (rowNode) {
                        return rowNode.key === mergeCentre;
                    })) {
                        var selectedCell = document.getNode(mergeCentre);

                        if (selectedCell && selectedCell.data.get('rowspan') > 1) {
                            initialMergeCells.push(selectedCell);
                        }
                    }
                }

                var addMergedCell = true;

                if (mergeDirection.right || mergeDirection === 'right') {
                    var _row = nextRow.nodes;
                    if (_row.find(function (rowNode) {
                        return rowNode.key === mergeCentre;
                    })) {
                        addMergedCell = false;
                    }
                }

                if (addMergedCell) {
                    newRow = newRow.setIn(['nodes', index, 'data', 'isMerged'], isMerged);
                    newRow = newRow.setIn(['nodes', index, 'data', 'mergeDirection'], mergeDirection);
                }
            }
        });
    }

    return editor.withoutNormalizing(function () {
        editor.insertNodeByKey(table.key, at, newRow).moveToEndOfNode(newRow.nodes.get(pos.getColumnIndex()));
        initialMergeCells.forEach(function (cell) {
            var initialMergeCellData = cell.data.toJSON();
            initialMergeCellData.rowspan = initialMergeCellData.rowspan + 1;
            editor.setNodeByKey(cell.key, { data: initialMergeCellData });
        });
        editor.focus();
    });
}

module.exports = insertRow;