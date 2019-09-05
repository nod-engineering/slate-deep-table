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

const spanTypes = {
    colSpan: 'colspan',
    rowSpan: 'rowspan',
}

const directions = {
    down: 'down',
    right: 'right',
}

function mergeCell(opts, editor, mergeOptions) {
    const { value } = editor;
    const { startBlock } = value;
    const pos = TablePosition.create(value, startBlock, opts);
    const { table } = pos;

    const isHeadless = table.data.get('headless');
    const { direction } = mergeOptions;

    if(isHeadless || !isHeadless && pos.getRowIndex() > 0 || direction === directions.right){

        const spanAttribute = direction === directions.right ? spanTypes.colSpan : spanTypes.rowSpan;
        const firstCell = table.nodes.get(pos.getRowIndex()).nodes.get(pos.getColumnIndex());
        const span = firstCell.data.get(spanAttribute) || 1;
        let nextCell = null;
        let numCellsIsEqual = true;
        const thisRow = table.nodes.get(pos.getRowIndex());
        const nextRow = table.nodes.get(pos.getRowIndex() + span);

        if(direction === directions.down){
            if(nextRow){
                
                nextCell = nextRow.nodes.get(pos.getColumnIndex());
            }
        } else {
            nextCell = table.nodes.get(pos.getRowIndex()).nodes.get(pos.getColumnIndex() + span);

        }

        if(nextCell && nextCell.type === opts.typeCell){


            if(direction === direction.down){

            } else {
                numCellsIsEqual= firstCell.data.get(spanTypes.rowSpan) === nextCell.data.get(spanTypes.rowSpan);
            }


            if(numCellsIsEqual){
                const paragraphs = nextCell.nodes.map((node) => { return Slate.Block.fromJSON(node.toJSON()) });
                
                for(let i = 0; i < paragraphs.size; i++){
                    editor.insertNodeByKey(firstCell.key, firstCell.nodes.size + i, paragraphs.get(i));
                }

                let firstCellData = firstCell.data.toJSON();
                firstCellData[`${spanAttribute}`] =  span + 1;

                const nextCellData = Object.assign({ data: { 'display': 'none', mergeDirection: direction }}, nextCell.data.toJSON());

                editor.setNodeByKey(firstCell.key, { data: firstCellData}).setNodeByKey(nextCell.key, nextCellData);

                if(nextRow.nodes.count(node => node.data.get('display') !== 'none') === 0) {
                    editor.removeNodeByKey(nextRow.key);
                }
            }
        }  
    }

    return editor;
}

module.exports = mergeCell;
