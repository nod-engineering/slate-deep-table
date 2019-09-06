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

function unmergeCell(opts, editor) {
    var value = editor.value;
    var startBlock = value.startBlock;

    var pos = TablePosition.create(value, startBlock, opts);
    var table = pos.table;


    var firstCell = table.nodes.get(pos.getRowIndex()).nodes.get(pos.getColumnIndex());
    var firstCellDirection = firstCell.data.get('mergeDirection');
    var spanAttribute = firstCellDirection === directions.right ? spanTypes.colSpan : spanTypes.rowSpan;
    var span = firstCell.data.get(spanAttribute) || 1;
    var nextRow = table.nodes.get(pos.getRowIndex() + span - 1);
    var nextCell = null;

    console.log(firstCellDirection);
    console.log(span);

    if (firstCellDirection && span > 1) {

        console.log('do it');
        if (firstCellDirection === directions.down) {
            if (nextRow) {
                nextCell = nextRow.nodes.get(pos.getColumnIndex());
            }
        } else {
            nextCell = table.nodes.get(pos.getRowIndex()).nodes.get(pos.getColumnIndex() + span - 1);
        }

        if (nextCell && nextCell.type === opts.typeCell) {

            var firstCellData = firstCell.data.toJSON();
            firstCellData['' + spanAttribute] = span - 1;

            var nextCellData = nextCell.data.toJSON();
            nextCellData['isMerged'] = false;

            editor.setNodeByKey(firstCell.key, { data: firstCellData }).setNodeByKey(nextCell.key, { data: nextCellData });
        }
    } else {
        console.log('not a merged cell');
    }

    return editor;
}

module.exports = unmergeCell;