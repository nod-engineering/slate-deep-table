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

const getNodeContentsAsBlocks = node => node.nodes.map((innerNode) => { return Slate.Block.fromJSON(innerNode.toJSON()) });;

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
        const firstCellDirection = firstCell.data.get('mergeDirection') || direction;
        const nextRow = table.nodes.get(pos.getRowIndex() + span); 
        let nextCell = null;
        

        if(direction === firstCellDirection) {

            if(direction === directions.down){
                if(nextRow){  
                    nextCell = nextRow.nodes.get(pos.getColumnIndex());
                }
            } else {
                nextCell = table.nodes.get(pos.getRowIndex()).nodes.get(pos.getColumnIndex() + span);
            }

            if(nextCell && nextCell.type === opts.typeCell){

                const cellContents = getNodeContentsAsBlocks(nextCell);    

                for(let i = 0; i < cellContents.size; i++){
                    editor.insertNodeByKey(firstCell.key, firstCell.nodes.size + i, cellContents.get(i));
                }

                let firstCellData = firstCell.data.toJSON(); 
                firstCellData[`${spanAttribute}`] =  span + 1;
                firstCellData['mergeDirection'] = direction;

                let nextCellData = nextCell.data.toJSON();
                nextCellData['isMerged'] = true;
                nextCellData['mergeDirection'] = direction;

                editor.setNodeByKey(firstCell.key, { data: firstCellData}).setNodeByKey(nextCell.key, { data: nextCellData });
            }  
        }
    }

    return editor;
}

module.exports = mergeCell;
