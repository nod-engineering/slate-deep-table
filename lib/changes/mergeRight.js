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
    const colspan = firstCell.data.get('colspan') || 1;
    const nextCell = table.nodes.get(pos.getRowIndex()).nodes.get(pos.getColumnIndex() + colspan);

    
    if(nextCell){
        const paragraphs = nextCell.nodes.map((node) => { return Slate.Block.fromJSON(node.toJSON()) });
        
        if(nextCell.type === 'table_cell') { // use constant

            for(let i = 0; i < paragraphs.size; i++){
                editor.insertNodeByKey(firstCell.key, firstCell.nodes.size + i, paragraphs.get(i));
            }

            const firstCellData = Object.assign({ data: { 'colspan': colspan + 1 }}, firstCell.data.toJSON());
            const nextCellData = Object.assign({ data: { 'display': 'none' }}, nextCell.data.toJSON());

            editor.setNodeByKey(firstCell.key, firstCellData).setNodeByKey(nextCell.key, nextCellData);
        }
    }   

    return editor;
}

module.exports = mergeRight;
