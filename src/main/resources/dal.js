//TODO
// let line = [{row: 5, col: 1, edge: true}, {row: 5, col: 2}, {row: 5, col: 3, edge: true}]
let allFives = [
    [{row: 5, col: 0, edge: true}, {row: 5, col: 1}, {row: 5, col: 2, edge: true}],
    [{row: 5, col: 1, edge: true}, {row: 5, col: 2}, {row: 5, col: 3, edge: true}],
    [{row: 5, col: 2, edge: true}, {row: 5, col: 3}, {row: 5, col: 4, edge: true}],
    [{row: 5, col: 3, edge: true}, {row: 5, col: 4}, {row: 5, col: 5, edge: true}]

]

// //TODO add more allFives
// let allFives = []
// for(var i = 0; i < 6; i++ ) {
//     // for(var j = 0; j < 3; j++) {
//     for(var j = 0; j < 5; j++) {    //TODO remove
//         allFives.push( [ { row : i, col : j, edge: true } , { row : i, col : j+1 } , { row : i, col : j+2 , edge: true} ] );
//     }
// }


/*
let allFives = []
for(var i = 0; i < 2; i++ ) {
    for(var j = 0; j < 3; j++) {
        allFives.push( [ { row : i, col : j, edge: true } , { row : i, col : j+1 } , { row : i, col : j+2 } , { row : i, col : j+3 } , { row : i, col : j+4 , edge: true} ] );
        allFives.push( [ { row : i, col : j, edge: true } , { row : i + 1, col : j } , { row : i + 2, col : j } , { row : i + 3, col : j }, { row : i + 4, col : j , edge: true} ] );
    }
}


for(var i = 2; i < 6; i++ ) {
    for(var j = 0; j < 3; j++) {
        allFives.push( [ { row : i, col : j, edge: true } , { row : i, col : j+1 } , { row : i, col : j+2 } , { row : i, col : j+3 },  { row : i, col : j+4 , edge: true} ] );
    }
}


for(var i = 0; i < 2; i++ ) {
    for(var j = 3; j < 7; j++) {
        allFives.push( [ { row : i, col : j, edge: true } , { row : i + 1, col : j } , { row : i + 2, col : j } , { row : i + 3, col : j }, { row : i + 4, col : j , edge: true} ] );
    }
}

for(var i = 0; i < 5; i++ ) {
    for(var j = 0; j < 3; j++) {
        if( i <= 1 && j <= 2 ) {
            allFives.push( [ { row : i, col : j , edge: true} , { row : i + 1, col : j+1 } , { row : i + 2, col : j+2 } , { row : i + 3, col : j+3 }, { row : i + 4, col : j+4, edge: true} ] );
        }
        else {
            allFives.push( [ { row : i, col : j, edge: true } , { row : i - 1, col : j+1 } , { row : i - 2, col : j+2 } , { row : i - 3, col : j+3 }, { row : i - 4, col : j+4, edge: true } ] );
        }
    }
}
 */

function buildCell(row, col) {
    return 'cell: ' + row + ", " + col
}

function buildLine(line) {
    return 'line: ' + line.map(cell => cell.row + ',' + cell.col).join("; ")
}


//TODO move to official: ctx.has
function ctx_has(id) {
    try {
        let entity = ctx.getEntityById(id)
        return true
    } catch (e) {
        return false
    }
}



ctx.populateContext(() => {
    for(var i = 0; i < 7; i++ )
        ctx.insertEntity(buildCell(5, i), 'READY')
})

ctx.registerEffect('BoardUpdated', function (data) {
    ev_data = data.ev.data

    // update cells
    ctx.removeEntity(buildCell(ev_data.row, ev_data.col))
    // bp.log.info("ZZ: remove cell: " + buildCell(ev_data.row, ev_data.col))
    ctx.insertEntity(buildCell(ev_data.row, ev_data.col), ev_data.color)
    // bp.log.info("ZZ: insert cell: " + buildCell(ev_data.row, ev_data.col) + ", " + ev_data.color)
    if (ev_data.row > 0) {
        ctx.insertEntity(buildCell(ev_data.row - 1, ev_data.col), 'READY')
        // bp.log.info("ZZ: insert cell: " + buildCell(ev_data.row - 1, ev_data.col) + ", " + 'READY')
    }

    // update lines
    for(var i = 0; i < allFives.length; i++ ) {
        (function(line){
            let all_ready = true
            try {
                for (var i = 0; i < line.length && all_ready; i++) {
                    let cell = line[i]
                    let entity = ctx.getEntityById(buildCell(cell.row, cell.col))
                    if (entity.type != "READY" && entity.type != "Yellow") {
                        all_ready = false
                        // bp.log.info("ZZ: not ready: " + buildLine(line))
                        // bp.log.info(cell)
                    }
                }
            } catch (e) {
                all_ready = false
            }
            if (all_ready) {
                if (!ctx_has(buildLine(line))) {
                    // ctx.insertEntity(buildLine(line), "ALL_READY", {center: new Set(line.filter((cell) => !cell.edge))}) //TODO fails with 'IO exception serializing a b-thread'
                    ctx.insertEntity(buildLine(line), "ALL_READY", {})
                    bp.log.info("ZZ inserted: ")
                    bp.log.info(ctx.getEntityById(buildLine(line)))
                }
            } else {
                if (ctx_has(buildLine(line))) {
                    ctx.removeEntity(buildLine(line))
                    bp.log.info("ZZ removed: ")
                    bp.log.info(buildLine(line))
                }
            }
        })(allFives[i])
    }
})

for(var i = 0; i < allFives.length; i++ ) {
    (function(line){
        bp.log.info("registering:")
        bp.log.info(buildLine(line))
        ctx.registerQuery('Five.AllReady.' + buildLine(line),
            // entity => entity.id === buildLine(line))
            function (entity) {
                // bp.log.info("ZZ querying:")
                // bp.log.info(entity)
                // return entity.id.includes("line")
                // //TODO why isn't it working??
                // // bp.log.info("ZZ query result: " + result)
                return true
                // return !entity.id.includes("cell")
            })
    })(allFives[i])
}
