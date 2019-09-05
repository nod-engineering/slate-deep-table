'use strict';

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Slate = require('slate');
// const { SchemaViolations } = Slate;

var _require = require('immutable'),
    Range = _require.Range,
    List = _require.List;

var createCell = require('./createCell');
var createRow = require('./createRow');

var SchemaViolations = {
    ChildRequired: 'child_min_invalid',
    ChildObjectInvalid: 'child_object_invalid',
    ChildTypeInvalid: 'child_type_invalid',
    ParentTypeInvalid: 'parent_type_invalid'

    /**
     * convenience methods used below
     */

};var insertChild = function insertChild(editor, error, type) {
    return editor.insertNodeByKey(error.node.key, error.index, { object: 'block', type: type });
};

var removeChild = function removeChild(editor, error) {
    return editor.removeNodeByKey(error.child.key);
};

var wrapWithParent = function wrapWithParent(editor, error, type) {
    return editor.wrapBlockByKey(error.node.key, type);
};

/**
 * Create a schema for tables
 * @param {String} opts.typeTable The type of table blocks
 * @param {String} opts.typeRow The type of row blocks
 * @param {String} opts.typeCell The type of cell blocks
 * @param {String} opts.typeContent The default type of content blocks in cells
 * @return {Object} A schema definition with rules to normalize tables
 */
function makeSchema(opts) {
    var _blocks;

    var schema = {
        blocks: (_blocks = {}, _defineProperty(_blocks, opts.typeCell, {
            parent: { type: opts.typeRow /* object: block in here stops it invalidating them, why? maybe the rules are OR */ },
            nodes: [{
                match: { object: 'block' },
                min: 1
            }],
            normalize: function normalize(editor, error) {
                // reason, ctx

                // enforce cells must contain blocks, insert or wrap if not
                switch (error.code) {
                    case SchemaViolations.ChildRequired:
                        return editor.command(insertChild, error, opts.typeContent);

                    case SchemaViolations.ChildObjectInvalid:
                        // wrap non-block children with a block
                        return editor.replaceNodeByKey(error.child.key, {
                            object: 'block',
                            type: opts.typeContent,
                            nodes: error.node.mapDescendants(function (n) {
                                return n.regenerateKey();
                            }).nodes
                        });

                    case SchemaViolations.ParentTypeInvalid:
                        return editor.command(wrapWithParent, error, opts.typeRow);
                }
            }
        }), _defineProperty(_blocks, opts.typeRow, {
            parent: { type: opts.typeTable },
            nodes: [{
                match: { object: 'block', type: opts.typeCell },
                min: 1
            }],
            normalize: function normalize(editor, error) {

                // enforce rows must contain cells, drop all else
                switch (error.code) {
                    case SchemaViolations.ChildRequired:
                        return editor.command(insertChild, error, opts.typeCell);

                    case SchemaViolations.ChildObjectInvalid:
                        return editor.replaceNodeByKey(error.child.key, { object: 'block', type: opts.typeCell });

                    case SchemaViolations.ChildTypeInvalid:
                        // i wonder why we remove it instead of converting it to a cell.
                        return editor.command(removeChild, error);

                    case SchemaViolations.ParentTypeInvalid:
                        return editor.command(wrapWithParent, error, opts.typeTable);
                }
            }
        }), _defineProperty(_blocks, opts.typeTable, {
            nodes: [{
                match: { object: 'block', type: opts.typeRow },
                min: 1
            }],
            normalize: function normalize(editor, error) {

                // enforce rows must contain cells, drop all else
                switch (error.code) {
                    case SchemaViolations.ChildRequired:
                        return editor.command(insertChild, error, opts.typeRow);

                    case SchemaViolations.ChildObjectInvalid:
                        return editor.command(removeChild, error).command(insertChild, error, opts.typeRow);

                    case SchemaViolations.ChildTypeInvalid:
                        return editor.command(removeChild, error);
                }
            }
        }), _blocks)
    };

    var isRow = function isRow(node) {
        return node.type === opts.typeRow;
    };
    var isCell = function isCell(node) {
        return node.type === opts.typeCell;
    };
    var countCells = function countCells(row) {
        return row.nodes.count(isCell);
    };

    var normalizeNode = function normalizeNode(node, editor, next) {

        if (node.object != 'block') return next();
        if (node.type !== opts.typeTable) return next();

        var table = node;
        var rows = table.nodes.filter(isRow);

        // The number of column this table has
        var columns = rows.reduce(function (count, row) {
            return Math.max(count, countCells(row));
        }, 1); // Min 1 column

        var invalidRows = rows.map(function (row) {
            var cells = countCells(row);
            var invalids = row.nodes.filterNot(isCell);

            // Row is valid: right count of cells and no extra node
            if (invalids.isEmpty() && cells === columns) {
                return null;
            }

            // Otherwise, remove the invalids and append the missing cells
            return {
                row: row,
                invalids: invalids,
                add: columns - cells
            };
        }).filter(Boolean);

        if (invalidRows.size === 0) return next();

        return function (editor) {
            return invalidRows.reduce(function (tr, _ref) {
                var row = _ref.row,
                    invalids = _ref.invalids,
                    add = _ref.add;


                tr = invalids.reduce(function (t, child) {
                    return t.removeNodeByKey(child.key);
                }, tr);

                tr = Range(0, add).reduce(function (t) {
                    var cell = createCell(opts);
                    return t.insertNodeByKey(row.key, 0, cell);
                }, tr);

                return tr;
            }, editor);
        };
    };

    return { schema: schema, normalizeNode: normalizeNode };
}

module.exports = makeSchema;