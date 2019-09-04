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
function mergeDown(opts, editor) {
    const { value } = editor;
    const { startBlock } = value;

    const pos = TablePosition.create(value, startBlock, opts);
    const { table } = pos;


    const firstCell = table.nodes.get(pos.getRowIndex()).nodes.get(pos.getColumnIndex());
    const rowspan = firstCell.data.get('rowspan') || 1;
    const nextRow = table.nodes.get(pos.getRowIndex() + rowspan);

    if(nextRow){

        const nextCell = nextRow.nodes.get(pos.getColumnIndex());
        const paragraphs = nextCell.nodes.map((node) => { return Slate.Block.fromJSON(node.toJSON()) });
    
        if(nextCell.type === 'table_cell') { // use constant
    
            for(let i = 0; i < paragraphs.size; i++){
                editor.insertNodeByKey(firstCell.key, firstCell.nodes.size + i, paragraphs.get(i));
            }
            
            editor.setNodeByKey(firstCell.key, {
                data: {
                    'rowspan': rowspan + 1
                }
            }).setNodeByKey(nextCell.key,{
                data: {
                    'display': 'none'
                }
            });

            if(nextRow.nodes.size === 0){
                
                editor.removeNodeByKey(nextRow.key);
            }
    
        }
    
    }

    return editor;
}

module.exports = mergeDown;
