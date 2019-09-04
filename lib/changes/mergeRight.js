const createRow = require('../createRow');
const Slate = require("slate");
const TablePosition = require('../TablePosition');

/**
 * Insert a new row in current table
 *
 * @param {Object} opts
 * @param {Slate.Editor} editor
 * @param {Number} at
 * @param {Function} textGetter
 * @return {Slate.Editor}
 */
function mergeRight(opts, editor) {
    const { value } = editor;
    const { startBlock } = value;

    const pos = TablePosition.create(value, startBlock, opts);
    const { table } = pos;

    const firstCell = table.nodes.get(pos.getRowIndex()).nodes.get(pos.getColumnIndex());
    const nextCell = value.document.getNextNode(firstCell.key);
    const colspan = firstCell.data.get('colspan') || 1;

    const paragraphs = nextCell.nodes.map((node) => { return Slate.Block.fromJSON(node.toJSON()) });
    
    if(nextCell.type === 'table_cell') { // use constant

        for(let i = 0; i < paragraphs.size; i++){
            editor.insertNodeByKey(firstCell.key, firstCell.nodes.size + i, paragraphs.get(i));
        }
            
        editor.setNodeByKey(firstCell.key, {
            data: {
                'colspan': colspan + 1
            }
        }).setNodeByKey(nextCell.key,{
            data: {
                'display': 'none'
            }
        });
    }

    return editor;
}

module.exports = mergeRight;
