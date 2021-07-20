//TODO draw board

const ROWS = 4
const COLS = 4

let gameOngoing = ctx.Entity("game ongoing")

let score = ctx.Entity("score", "", {val: 0})
let arrows = ctx.Entity("arrows", "", {val: 1})

//TODO: randomize wumpus location
let wumpus = ctx.Entity("wumpus", "", {
    status: 'alive',
    row: 3,
    col: 1
})

//TODO: randomize gold location
let gold = ctx.Entity("gold", "", {
    status: 'ready',
    row: 3,
    col: 2
})

//TODO: randomize pits locations
let pits = []
pits.push(ctx.Entity("pit1", "pit", { row: 1, col: 3 }))
pits.push(ctx.Entity("pit2", "pit", { row: 3, col: 3 }))
pits.push(ctx.Entity("pit3", "pit", { row: 4, col: 4 }))

let player = ctx.Entity("player", "", {
    row: 1,
    col: 1,
    facing: 90
})

// player's knowledge base
let kb = ctx.Entity("kb", "", {
    wumpus: 'alive',
    has_gold: false,
    actions_history: []
})


let cells = []
for (let i = 1; i <= ROWS; i++)
    for (let j = 1; j <= COLS; j++)
        cells.push(ctx.Entity("cell:" + i + "," + j, "cell",{
            row: i,
            col: j,
            Breeze: false,
            Stench: false,
            Pit: "unknown",
            Wumpus: "unknown"
        }))


ctx.populateContext(pits.concat(cells).concat(
    [gameOngoing, score, arrows, wumpus, gold, player, kb]))


///////////////////////////////////////////////



ctx.registerQuery("Wumpus.Alive", function (entity) {
    return entity.id.equals("wumpus") && entity.status.equals("alive")
})

ctx.registerQuery("Pit.All", function (entity) {
    return entity.type.equals("pit")
})

ctx.registerQuery("Cell.Gold", function (entity) {
    return entity.id.equals("gold")
})

ctx.registerQuery("Gold.Ready", function (entity) {
    return entity.id.equals("kb") && !entity.has_gold
})

ctx.registerQuery("Gold.Taken", function (entity) {
    return entity.id.equals("kb") && entity.has_gold
})

ctx.registerQuery("Game ongoing", function (entity) {
    return entity.id.equals("game ongoing")
})

ctx.registerQuery("Game over", function (entity) {
    return entity.id.equals("game over")
})

ctx.registerQuery("Player", function (entity) {
    return entity.id.equals("player")
})

ctx.registerQuery("Cell.All", function (entity) {
    return entity.type.equals("cell")
})

ctx.registerQuery("Cell.Opening", function (entity) {
    return entity.id.equals("cell:1,1")
})

function updateScore(delta) {
    let score = ctx.getEntityById("score")
    score.val += delta
    ctx.updateEntity(score)
}

function gameOver(type) {
    let score = ctx.getEntityById("score")
    ctx.removeEntity(ctx.Entity("game ongoing"))
    ctx.insertEntity(ctx.Entity("game over", type, {score: score.val}))
    bp.log.info("Game over: " + type + ", score: " + score.val)
    sync({block: bp.eventSets.all})

}

ctx.registerEffect("Play", function (action) {
    let kb = ctx.getEntityById("kb")
    updateKb(kb, action.id)

    updateScore(-1)
    let player = ctx.getEntityById("player")
    if (action.id.equals("forward")) {
        if (player.facing == 90 && player.col < COLS)
            player.col++
        else if (player.facing == 270 && player.col > 1)
            player.col--
        else if (player.facing == 0 && player.row < ROWS)
            player.row++
        else if (player.facing == 180 && player.row > 1)
            player.row--
        else
            sync({request: Event("Bump")}, 1000)
        ctx.updateEntity(player)
    } else if (action.id.equals("turn-right")) {
        player.facing += 90
        if (player.facing >= 360)
            player.facing -= 360
        ctx.updateEntity(player)
    } else if (action.id.equals("turn-left")) {
        player.facing -= 90
        if (player.facing < 0)
            player.facing += 360
        ctx.updateEntity(player)
    } else if (action.id.equals("grab")) {
        let gold = ctx.getEntityById("gold")
        if (gold.status.equals("ready") && gold.row == player.row && gold.col == player.col) {
            gold.status = "taken"
            ctx.updateEntity(gold)
            updateScore(1000);
            sync({request: Event("Took gold")}, 1000)
        }
    } else if (action.id.equals("shoot")) {
        let arrows = ctx.getEntityById("arrows")
        let wumpus = ctx.getEntityById("wumpus")
        if (arrows.val > 0) {
            arrows.val--
            ctx.updateEntity(arrows)
            updateScore(-10);
            if (
                (player.facing == 0 && player.col == wumpus.col && player.row < wumpus.row) ||
                (player.facing == 180 && player.col == wumpus.col && player.row > wumpus.row) ||
                (player.facing == 90 && player.row == wumpus.row && player.col < wumpus.col) ||
                (player.facing == 270 && player.row == wumpus.row && player.col > wumpus.col)
            ) {
                wumpus.status = "dead"
                ctx.updateEntity(wumpus)
                sync({request: Event("Scream")}, 1000)
            }
        }
    } else if (action.id.equals("climb")) {
        if (player.row == 1 && player.col == 1) {
            gameOver("climbed")
        }
    } else {
        bp.log.info("Unrecognized action: " + action.id)
        exit() // 'exit' is undefined - but anyway, it achieves its goal...
    }

    sync({request: Event("Action done", {
        id: action.id,
        player: player,
        kb: kb
    })}, 2000)
})

ctx.registerEffect("Wumpus lunch", function (effect) {
    updateScore(-1000);
    gameOver("wumpus lunch")
})

ctx.registerEffect("Fell in pit", function (effect) {
    updateScore(-1000);
    gameOver("fell in pit")
})

// TODO is there a better solution?
ctx.registerEffect("Start", function (effect) {
    sync({request: Event("Action done", {
        id: null,
        player: ctx.getEntityById("player"),
        kb: ctx.getEntityById("kb"),
    })}, 2000)
})

///////////////////////////////////////////////////////////
///////////            strategies            //////////////
///////////////////////////////////////////////////////////

ctx.registerQuery("Cell.Danger.Unknown", function (entity) {
    return entity.type.equals("cell") && entity.Pit == "unknown" && entity.Wumpus == "unknown"
})

ctx.registerQuery("Cell.Danger.Clean", function (entity) {
    return entity.type.equals("cell") && entity.Pit == "clean" && entity.Wumpus == "clean"
})

ctx.registerQuery("Cell.Danger.Visited", function (entity) {
    return entity.type.equals("cell") && entity.Pit == "visited" && entity.Wumpus == "visited"
})

//////////////////


ctx.registerEffect("Scream", function (effect) {
    let kb = ctx.getEntityById("kb")
    kb.wumpus = 'dead'
    ctx.updateEntity(kb)
})

ctx.registerEffect("Took gold", function (effect) {
    let kb = ctx.getEntityById("kb")
    kb.has_gold = true
    ctx.updateEntity(kb)
})

ctx.registerEffect("Breeze", function (effect) {
    updateIndication("Breeze")
    updateDangers( "Pit")
})

ctx.registerEffect("Stench", function (effect) {
    updateIndication("Stench")
    updateDangers( "Wumpus")
})

////////////////////////////////////

function updateKb(kb, id) {
    kb.actions_history.push(id)
    ctx.updateEntity(kb)
    updateVisited("Pit")
    updateVisited("Wumpus")
    updateNoIndications(kb)

    //TODO remove?
    if (kb.actions_history.length > 200) {
        bp.log.info("stuck in infinite loop, exiting")
        exit(1)
    }
}

function updateNoIndications(kb) {
// ctx.registerEffect("Action done", function (effect) {
    let player = ctx.getEntityById("player")
    let cell = ctx.getEntityById("cell:" + player.row + "," + player.col)
    if (!cell.Breeze) {
        bp.log.info("No Breeze indication in cell, cleaning its neighbors")
        bp.log.info(cell)
        cleanDanger("Pit", player.row + 1, player.col)
        cleanDanger("Pit", player.row - 1, player.col)
        cleanDanger("Pit", player.row, player.col + 1)
        cleanDanger("Pit", player.row, player.col - 1)
    }
    if (!cell.Stench) {
        bp.log.info("No Stench indication in cell, cleaning its neighbors")
        bp.log.info(cell)
        cleanDanger("Wumpus", player.row + 1, player.col)
        cleanDanger("Wumpus", player.row - 1, player.col)
        cleanDanger("Wumpus", player.row, player.col + 1)
        cleanDanger("Wumpus", player.row, player.col - 1)
    }
}


function updateIndication(ind) {
    let player = ctx.getEntityById("player")
    let cell = ctx.getEntityById("cell:" + player.row + "," + player.col)
    cell[ind] = true
    ctx.updateEntity(cell)
}

function updateDangers(danger) {
    let player = ctx.getEntityById("player")
    updateDanger(danger, player.row + 1, player.col)
    updateDanger(danger, player.row - 1, player.col)
    updateDanger(danger, player.row, player.col + 1)
    updateDanger(danger, player.row, player.col - 1)
}

//TODO update other safe cells
function updateVisited(danger) {
    let player = ctx.getEntityById("player")
    let cell = ctx.getEntityById("cell:" + player.row + "," + player.col)
    cell[danger] = "visited"
    ctx.updateEntity(cell)
}

function updateDanger(danger, row, col) {
    if (row >= 1 && row <= ROWS && col >= 1 && col <= COLS) {
        let cell = ctx.getEntityById("cell:" + row + "," + col)
        if (cell[danger] == "unknown") {
            cell[danger] = "possible"
        } else if (cell[danger] == "visited" || cell[danger] == "possible" || cell[danger] == "clean")  {
            // pass
        } else {
            bp.log.info("Unhandled: " + cell[danger])
            bp.log.info(cell)
            exit(1)
        }
        ctx.updateEntity(cell)
    }
}

function cleanDanger(danger, row, col) {
    if (row >= 1 && row <= ROWS && col >= 1 && col <= COLS) {
        let cell = ctx.getEntityById("cell:" + row + "," + col)
        if (cell[danger] == "unknown" || cell[danger] == "possible") {
            cell[danger] = "clean"
        } else if (cell[danger] == "visited" || cell[danger] == "clean") {
            // pass
        } else {
            bp.log.info("Unhandled: " + cell[danger])
            bp.log.info(cell)
            exit(1)
        }
        bp.log.info(cell)
        ctx.updateEntity(cell)
    }
}


