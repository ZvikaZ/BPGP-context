//TODO
// let line = [{row: 5, col: 1, edge: true}, {row: 5, col: 2}, {row: 5, col: 3, edge: true}]
let allFives = [
    [{row: 5, col: 1, edge: true}, {row: 5, col: 2}, {row: 5, col: 3, edge: true}],
    [{row: 5, col: 2, edge: true}, {row: 5, col: 3}, {row: 5, col: 4, edge: true}]

]

// //TODO add more allFives
// let allFives = []
// for(var i = 0; i < 2; i++ ) {
//     for(var j = 0; j < 3; j++) {
//         allFives.push( [ { row : i, col : j, edge: true } , { row : i, col : j+1 } , { row : i, col : j+2 } , { row : i, col : j+3 } , { row : i, col : j+4 , edge: true} ] );
//         allFives.push( [ { row : i, col : j, edge: true } , { row : i + 1, col : j } , { row : i + 2, col : j } , { row : i + 3, col : j }, { row : i + 4, col : j , edge: true} ] );
//     }
// }


function buildCell(row, col) {
    return 'cell: ' + row + ", " + col
}

function buildLine(line) {
    return 'line: ' + line.map(cell => cell.row + ',' + cell.col).join("; ")
}


ctx.populateContext(() => {
    for(var i = 0; i < 7; i++ )
        ctx.insertEntity(buildCell(5, i), 'READY')
})

ctx.registerEffect('BoardUpdated', function (data) {
    ev_data = data.ev.data

    // update cells
    ctx.removeEntity(buildCell(ev_data.row, ev_data.col))
    ctx.insertEntity(buildCell(ev_data.row, ev_data.col), ev_data.color)
    if (ev_data.row > 0)
        ctx.insertEntity(buildCell(ev_data.row - 1, ev_data.col), 'READY')

    // update lines
    allFives.forEach(function (line) {
        let all_ready = true
        try {
            for (var i = 0; i < line.length && all_ready; i++) {
                let cell = line[i]
                if (ctx.getEntityById(buildCell(cell.row, cell.col)).type != "READY") {
                    all_ready = false
                    bp.log.info("not ready")
                    bp.log.info(cell)
                }
            }
        } catch (e) {
            all_ready = false
        }
        try {
            if (all_ready) {
                ctx.insertEntity(buildLine(line), "ALL_READY", {center: line.filter((cell) => !cell.edge)})
                bp.log.info("ZZ inserted: ")
                bp.log.info(buildLine(line))
            } else {
                ctx.removeEntity(buildLine(line))
                bp.log.info("ZZ removed: ")
                bp.log.info(buildLine(line))
            }
        } catch (e) {
            // nothing to do
        }
    })
})

let i = 0
allFives.forEach(function (line) {
    ctx.registerQuery('Five.AllReady.' + i,
        entity => entity.id == buildLine(line))
    i++
})



