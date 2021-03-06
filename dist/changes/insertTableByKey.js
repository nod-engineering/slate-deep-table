'use strict';

var createTable = require('../createTable');

/**
 * Insert a new table by key, if index is left empty it defaults to 0
 *
 * @param {Object} opts
 * @param {Slate.Editor} editor
 * @param {String} key
 * @param {Number} index
 * @param {Number} columns
 * @param {Number} rows
 * @return {Slate.Editor}
 */
function insertTableByKey(opts, editor, key) {
  var index = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
  var columns = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 2;
  var rows = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 2;
  var value = editor.value;


  if (!value.selection.start.key) return false;

  // Create the table node
  var fillWithEmptyText = function fillWithEmptyText(x, y) {
    return '';
  };
  var table = createTable(opts, columns, rows, fillWithEmptyText);

  var done = editor.insertNodeByKey(key, index, table);
  return done;
}

module.exports = insertTableByKey;