'use strict';

var createRow = require('../createRow');
var Slate = require("slate");
var TablePosition = require('../TablePosition');

/**
 * Insert a new row in current table
 *
 * @param {Object} opts
 * @param {Slate.Editor} editor
 * @param  {Object} mergeOptions
 * @return {Slate.Editor}
 */

var spanTypes = {
    colSpan: 'colspan',
    rowSpan: 'rowspan'
};

var directions = {
    down: 'down',
    right: 'right'
};

var getNodeContentsAsBlocks = function getNodeContentsAsBlocks(node) {
    return node.nodes.map(function (innerNode) {
        return Slate.Block.fromJSON(innerNode.toJSON());
    });
};;

function mergeCell(opts, editor, mergeOptions) {
    var value = editor.value;
    var startBlock = value.startBlock;

    var pos = TablePosition.create(value, startBlock, opts);
    var table = pos.table;


    var isHeadless = table.data.get('headless');
    var direction = mergeOptions.direction,
        mergeType = mergeOptions.mergeType;


    if (isHeadless || !isHeadless && pos.getRowIndex() > 0 || direction === directions.right) {

        var spanAttribute = direction === directions.right ? spanTypes.colSpan : spanTypes.rowSpan;
        var firstCell = table.nodes.get(pos.getRowIndex()).nodes.get(pos.getColumnIndex());
        var span = firstCell.data.get(spanAttribute) || 1;
        var firstCellDirection = firstCell.data.get('mergeDirection') || direction;
        var nextRow = table.nodes.get(pos.getRowIndex() + span);
        var nextCell = null;

        if (direction === firstCellDirection) {

            if (direction === directions.down) {
                if (nextRow) {
                    nextCell = nextRow.nodes.get(pos.getColumnIndex());
                }
            } else {
                nextCell = table.nodes.get(pos.getRowIndex()).nodes.get(pos.getColumnIndex() + span);
            }

            if (nextCell && nextCell.type === opts.typeCell) {

                var cellContents = getNodeContentsAsBlocks(nextCell);

                for (var i = 0; i < cellContents.size; i++) {
                    editor.insertNodeByKey(firstCell.key, firstCell.nodes.size + i, cellContents.get(i));
                }

                var firstCellData = firstCell.data.toJSON();
                firstCellData['' + spanAttribute] = span + 1;
                firstCellData['mergeDirection'] = direction;

                var nextCellData = nextCell.data.toJSON();
                nextCellData['display'] = 'none';
                nextCellData['mergeDirection'] = direction;

                editor.setNodeByKey(firstCell.key, { data: firstCellData }).setNodeByKey(nextCell.key, { data: nextCellData });
            }
        }
    }

    return editor;
}

module.exports = mergeCell;