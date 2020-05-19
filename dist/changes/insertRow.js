'use strict';

var createRow = require('../createRow');
var TablePosition = require('../TablePosition');

var _require = require('../getMergeCentre'),
    getMergeCentre = _require.getMergeCentre,
    getMergeCentreByPath = _require.getMergeCentreByPath;

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
    var startBlock = value.startBlock;


    var pos = TablePosition.create(value, startBlock, opts);
    var table = pos.table;

    // Create a new row with the right count of cells

    var firstRow = table.nodes.get(0);
    var newRow = createRow(opts, firstRow.nodes.size, textGetter);

    if (typeof at === 'undefined') {
        at = pos.getRowIndex() + (pos.cell.data.get('rowspan') || 1);
    }

    var initialMergeCentre = [];

    var nextRow = table.nodes.get(at);
    if (nextRow) {
        nextRow.nodes.forEach(function (node, index) {
            var isMerged = node.data.get('isMerged');
            if (isMerged) {
                var mergeDirection = node.data.get('mergeDirection') || {};
                var mergeCentrePath = node.data.get('mergeCentre') || getMergeCentre({ mergeDirection: mergeDirection, table: table, columnIndex: index, rowIndex: at });

                var _getMergeCentreByPath = getMergeCentreByPath({ path: mergeCentrePath, table: table, cellPosition: { x: index, y: at } }),
                    mergeCentreNode = _getMergeCentreByPath.mergeCentreNode,
                    mergeCentreNodePath = _getMergeCentreByPath.mergeCentreNodePath;

                if (mergeCentreNode && mergeDirection.down || mergeDirection === 'down') {
                    var row = nextRow.nodes;
                    if (!row.find(function (rowNode) {
                        return rowNode.key === mergeCentreNode.key;
                    })) {

                        if (mergeCentreNode && mergeCentreNode.data.get('rowspan') > 1) {
                            initialMergeCentre.push({ mergeCentreNode: mergeCentreNode, mergeCentreNodePath: mergeCentreNodePath });
                        }
                    }
                }

                var addMergedCell = true;

                if (mergeDirection.right || mergeDirection === 'right') {
                    var _row = nextRow.nodes;
                    if (mergeCentreNode && _row.find(function (rowNode) {
                        return rowNode.key === mergeCentreNode.key;
                    })) {
                        addMergedCell = false;
                    }
                }

                if (addMergedCell) {
                    newRow = newRow.setIn(['nodes', index, 'data', 'isMerged'], isMerged);
                    newRow = newRow.setIn(['nodes', index, 'data', 'mergeDirection'], mergeDirection);
                    newRow = newRow.setIn(['nodes', index, 'data', 'mergeCentre'], mergeCentrePath);
                }
            }
        });
    }

    return editor.withoutNormalizing(function () {
        if (initialMergeCentre.length > 0) {
            initialMergeCentre.forEach(function (_ref) {
                var mergeCentreNode = _ref.mergeCentreNode,
                    mergeCentreNodePath = _ref.mergeCentreNodePath;

                var initialMergeCellData = mergeCentreNode.data.toJSON();
                for (var rowIndex = 0; rowIndex < initialMergeCellData.rowspan || 0; rowIndex += 1) {
                    for (var columnIndex = 0; columnIndex < initialMergeCellData.colspan || 0; columnIndex += 1) {
                        if (!(rowIndex === 0 && columnIndex === 0) && mergeCentreNodePath.y + rowIndex >= at) {
                            var cell = table.nodes.get(mergeCentreNodePath.y + rowIndex).nodes.get(mergeCentreNodePath.x + columnIndex);
                            var cellData = cell.data.toJSON();
                            cellData.mergeCentre = {
                                x: columnIndex,
                                y: rowIndex + 1
                            };
                            editor.setNodeByKey(cell.key, { data: cellData });
                        }
                    }
                }
                initialMergeCellData.rowspan = initialMergeCellData.rowspan + 1;
                editor.setNodeByKey(mergeCentreNode.key, { data: initialMergeCellData });
            });
        }
        editor.insertNodeByKey(table.key, at, newRow).moveToEndOfNode(newRow.nodes.get(pos.getColumnIndex())).focus();
    });
}

module.exports = insertRow;