'use strict';

var createRow = require('../createRow');
var Slate = require("slate");
var TablePosition = require('../TablePosition');

/**
 * Insert a new row in current table
 *
 * @param {Object} opts
 * @param {Slate.Editor} editor
 * @param {Number} at
 * @param {Function} textGetter
 * @return {Slate.Editor}
 */
function mergeDown(opts, editor) {
    var value = editor.value;
    var startBlock = value.startBlock;


    var pos = TablePosition.create(value, startBlock, opts);
    var table = pos.table;


    var firstCell = table.nodes.get(pos.getRowIndex()).nodes.get(pos.getColumnIndex());
    var rowspan = firstCell.data.get('rowspan') || 1;
    var nextRow = table.nodes.get(pos.getRowIndex() + rowspan);

    if (nextRow) {

        var nextCell = nextRow.nodes.get(pos.getColumnIndex());
        var paragraphs = nextCell.nodes.map(function (node) {
            return Slate.Block.fromJSON(node.toJSON());
        });

        if (nextCell.type === 'table_cell') {
            // use constant

            for (var i = 0; i < paragraphs.size; i++) {
                editor.insertNodeByKey(firstCell.key, firstCell.nodes.size + i, paragraphs.get(i));
            }

            editor.setNodeByKey(firstCell.key, {
                data: {
                    'rowspan': rowspan + 1
                }
            }).setNodeByKey(nextCell.key, {
                data: {
                    'display': 'none'
                }
            });

            if (nextRow.nodes.size === 0) {
                editor.removeNodeByKey(nextRow.key);
            }
        }
    }

    return editor;
}

module.exports = mergeDown;