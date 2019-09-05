'use strict';

var TablePosition = require('../TablePosition');

/**
 * Delete the whole table
 *
 * @param {Object} opts
 * @param {Slate.Editor} editor
 * @param {Number} at
 * @return {Slate.Editor}
 */
function removeTable(opts, editor, at) {
  var value = editor.value;
  var startBlock = value.startBlock;


  var pos = TablePosition.create(value, startBlock, opts);
  var table = pos.table;


  return editor.deselect().removeNodeByKey(table.key);
}

module.exports = removeTable;