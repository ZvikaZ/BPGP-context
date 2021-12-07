//region Helper functions
function buildCellId(row, col) {
    return 'cell: ' + row + ", " + col
}

//endregion

//region Context population - basic game
const ROWS = 6
const COLS = 7

const cells = []
const columns = []

for (let j = 0; j < COLS; j++) {
    columns.push(ctx.Entity("column: " + j, 'column', {col: j}))
    for (let i = 0; i < ROWS; i++) {
        cells.push(ctx.Entity(buildCellId(i, j), 'cell', {
            row: i,
            col: j,
            color: "",
            status: i == 0 ? "READY" : "NOT-READY"
        }))
    }
}


function createLines(len, kind) {
    let lines = []
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j <= COLS - len; j++) {
            let right = []
            let right_underneath = []
            for (let k = 0; k < len; k++) {
                right.push({row: i, col: j + k, edge: k == 0 || k == (len-1) ? true : false})
                right_underneath.push({row: i - 1, col: j + k, edge: k == 0 || k == (len-1) ? true : false})
            }
            lines.push(ctx.Entity(kind +" right (" + i + "," + j + ")", kind, {
                cells: right,
                cells_underneath: right_underneath,
                status: i == 0 ? "READY" : "NOT-READY"
            }))
        }
    }

    for (let i = 0; i <= ROWS - len; i++) {
        for (let j = 0; j < COLS; j++) {
            let up = []
            let up_underneath = []
            for (let k = 0; k < len; k++) {
                up.push({row: i + k, col: j, edge: k == 0 || k == (len-1) ? true : false})
                up_underneath.push({row: i + k - 1, col: j, edge: k == 0 || k == (len-1) ? true : false})
            }
            lines.push(ctx.Entity(kind + " up (" + i + "," + j + ")", kind, {
                cells: up,
                cells_underneath: up_underneath,
                status: "NOT-READY"
            }))
        }
    }

    for (let i = 0; i <= ROWS - len; i++) {
        for (let j = 0; j <= COLS - len; j++) {
            let diag = []
            let diag_underneath = []
            for (let k = 0; k < len; k++) {
                diag.push({row: i + k, col: j + k, edge: k == 0 || k == (len-1) ? true : false})
                diag_underneath.push({row: i + k - 1, col: j + k, edge: k == 0 || k == (len-1) ? true : false})
            }
            lines.push(ctx.Entity(kind + " up-right (" + i + "," + j + ")", kind, {
                cells: diag,
                cells_underneath: diag_underneath,
                status: "NOT-READY"
            }))
        }
    }

    for (let i = 0; i <= ROWS - len; i++) {
        for (let j = len - 1; j < COLS; j++) {
            let diag = []
            let diag_underneath = []
            for (let k = 0; k < len; k++) {
                diag.push({row: i + k, col: j - k, edge: k == 0 || k == (len-1) ? true : false})
                diag_underneath.push({row: i + k - 1, col: j - k, edge: k == 0 || k == (len-1) ? true : false})
            }
            lines.push(ctx.Entity(kind + " up-left (" + i + "," + j + ")", kind, {
                cells: diag,
                cells_underneath: diag_underneath,
                status: "NOT-READY"
            }))
        }
    }
    return lines
}
let fours = createLines(4, "four")

let numOfPlys = ctx.Entity("num of plys", "", {num: 0})
let gameOngoing = ctx.Entity("game ongoing")

//endregion

//region Context population - strategies
// const fives = createLines(5, "five")


// TODO is it possible to split to two?
ctx.populateContext(cells.concat(columns).concat(fours).concat([numOfPlys, gameOngoing]))
//endregion


//region Queries - basic game
ctx.registerQuery("Cell.All", function (entity) {
    return entity.type.equals("cell")
})

ctx.registerQuery("Column.All", function (entity) {
    return entity.type.equals("column")
})

ctx.registerQuery("Four.All", function (entity) {
    return entity.type.equals("four")
})

ctx.registerQuery("Game ongoing", function (entity) {
    return entity.id.equals("game ongoing")
})

ctx.registerQuery("Game over", function (entity) {
    return entity.id.equals("game over")
})

//endregion

/*
//region Queries - strategies
ctx.registerQuery("Five.NotBad", function (entity) {
    return entity.type.equals("five") && !entity.status.equals("BAD")
})

ctx.registerQuery("Five.Ready", function (entity) {
    return entity.type.equals("five") && entity.status.equals("READY")
})
//endregion
 */

//region Effects - basic game
ctx.registerEffect("Coin", function (data) {
    let cell = ctx.getEntityById(buildCellId(data.row, data.col))
    cell.color = data.color
    //TODO update NOT-READY ?
    ctx.updateEntity(cell)

    if (data.row < ROWS - 1) {
        let cellAbove = ctx.getEntityById(buildCellId(data.row + 1, data.col))
        cellAbove.status = "READY"
        ctx.updateEntity(cell)
    }

    let numOfPlys = ctx.getEntityById("num of plys")
    numOfPlys.num++
    bp.log.info("Num of plys: " + numOfPlys.num)
    ctx.updateEntity(numOfPlys)
    if (numOfPlys.num >= ROWS * COLS) {
        // maybe we have a race condition with a win, thus, only it's only a 'potential' draw
        sync({request: Event("Potential draw")})
    }
})

function gameOver(type, data) {
    ctx.removeEntity(ctx.Entity("game ongoing"))
    ctx.insertEntity(ctx.Entity("game over", type, data))
}

ctx.registerEffect("Win", function (data) {
    gameOver("win", data)
})

ctx.registerEffect("Draw", function (data) {
    gameOver("draw", {})
})
//endregion

/*
//region Effects - strategies
ctx.registerEffect("Five is ready", function (data) {
    const five = ctx.getEntityById(data)
    five.status = "READY"
    ctx.updateEntity(five)
})

ctx.registerEffect("Five is bad", function (data) {
    const five = ctx.getEntityById(data)
    five.status = "BAD"
    ctx.updateEntity(five)
})

ctx.registerEffect("Remove cell from five", function (data) {
    const five = ctx.getEntityById(data.id)
    let newCells = []
    for (let i = 0; i < five.cells.length; i++) {
        let cell = five.cells[i]
        if (cell.row != data.coin.row || cell.col != data.coin.col)
            newCells.push(cell)
    }
    five.cells = newCells
    ctx.updateEntity(five)
})

//endregion

 */
