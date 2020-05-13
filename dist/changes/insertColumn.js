'use strict';

var TablePosition = require('../TablePosition');
var moveSelection = require('./moveSelection');
var createCell = require('../createCell');
var getMergeCentre = require('../getMergeCentre');

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
    var initialMergeCells = [];
    var column = table.nodes.map(function (row) {
        return row.nodes.get(at);
    });

    table.nodes.forEach(function (rowNode, index) {
        var node = rowNode.nodes.get(at);
        var newCell = createCell(opts);
        console.log('newCell key: ', newCell.key);
        if (node) {
            var isMerged = node.data.get('isMerged');
            var mergeDirection = node.data.get('mergeDirection');
            var mergeCentre = getMergeCentre({ mergeDirection: mergeDirection, table: table, columnIndex: at, rowIndex: index });

            if (isMerged) {
                if ((mergeDirection.right || mergeDirection === 'right') && rowNode.nodes.find(function (rowCell) {
                    return rowCell.key === mergeCentre;
                })) {
                    if (mergeCentre && mergeCentre.data.get('colspan') > 1) {
                        initialMergeCells.push(mergeCentre);
                    }
                }
                var addMergedCell = false;

                if (mergeDirection) {
                    if ((mergeDirection.right || mergeDirection === 'right') && !(mergeDirection.down || mergeDirection === 'down') && rowNode.nodes.find(function (rowCell) {
                        return rowCell.key === mergeCentre;
                    })) {
                        addMergedCell = true;
                    } else if ((mergeDirection.right || mergeDirection === 'right') && (mergeDirection.down || mergeDirection === 'down') && !column.find(function (cell) {
                        return cell.key === mergeCentre;
                    })) {
                        addMergedCell = true;
                    }
                }

                if (addMergedCell) {
                    newCell = newCell.setIn(['data', 'isMerged'], isMerged);
                    newCell = newCell.setIn(['data', 'mergeDirection'], mergeDirection);
                }
            }
        }
        newCells.push({ rowKey: rowNode.key, newCell: newCell });
    });

    // Insert the new cell
    editor.withoutNormalizing(function () {
        newCells.forEach(function (item) {
            editor.insertNodeByKey(item.rowKey, at, item.newCell);
        });
        initialMergeCells.forEach(function (cell) {
            var initialMergeCellData = cell.data.toJSON();
            initialMergeCellData.colspan = initialMergeCellData.colspan + 1;
            editor.setNodeByKey(cell.key, { data: initialMergeCellData });
        });
    });

    // Update the selection (not doing can break the undo)
    return moveSelection(opts, editor, pos.getColumnIndex() + 1, pos.getRowIndex());
}

module.exports = insertColumn;