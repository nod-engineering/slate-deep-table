const createRow = require('../createRow');
const Slate = require("slate");
const TablePosition = require('../TablePosition');

/**
 * Insert a new row in current table
 *
 * @param {Object} opts
 * @param {Slate.Editor} editor
 * @param  {Object} mergeOptions
 * @return {Slate.Editor}
 */
function mergeCell(opts, editor, mergeOptions) {
    const { value } = editor;
    const { startBlock } = value;
    const pos = TablePosition.create(value, startBlock, opts);
    const { table } = pos;

    const isHeadless = table.data.get('headless');

    if(isHeadless || !isHeadless && pos.getRowIndex() > 0){

        const { direction } = mergeOptions;
        const spanAttribute = direction === 'right' ? 'colspan' : 'rowspan';
        const firstCell = table.nodes.get(pos.getRowIndex()).nodes.get(pos.getColumnIndex());
        const span = firstCell.data.get(spanAttribute) || 1;
        let nextCell = null;


        if(direction === 'down'){
            const nextRow = table.nodes.get(pos.getRowIndex() + span);

            if(nextRow){
                nextCell = nextRow.nodes.get(pos.getColumnIndex());
            }
        } else {
            nextCell = table.nodes.get(pos.getRowIndex()).nodes.get(pos.getColumnIndex() + span);
        }

        if(nextCell && nextCell.type === opts.typeCell){
            const paragraphs = nextCell.nodes.map((node) => { return Slate.Block.fromJSON(node.toJSON()) });
            
            for(let i = 0; i < paragraphs.size; i++){
                editor.insertNodeByKey(firstCell.key, firstCell.nodes.size + i, paragraphs.get(i));
            }

            let firstCellData = firstCell.data.toJSON();
            firstCellData[`${spanAttribute}`] =  span + 1;

            const nextCellData = Object.assign({ data: { 'display': 'none' }}, nextCell.data.toJSON());

            editor.setNodeByKey(firstCell.key, { data: firstCellData}).setNodeByKey(nextCell.key, nextCellData);
        }  
    }

    return editor;
}

module.exports = mergeCell;
