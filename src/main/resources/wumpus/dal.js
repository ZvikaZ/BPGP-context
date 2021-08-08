// Achiya: cell {id, i,j, has:[pit/wumpus/gold],hasplayer=false, probpit, probwumpus,probgold}

// danger (Wumpus/Pit) states
// -------------
// "unknown" means that we don't know anything about the cell - that's the initial state
// "possible" means that we got an indication (Stench/Breeze) in an adjacent cell, thus, it's possible that this cell has that danger
// "clean" means that we're sure that the cell doesn't have this specific danger, because of reasoning(*) - and we haven't been in the cell
// "visited" means we've already been to the cell (and as a side effect, it's also clean)
// (*) see updateNoIndications(..)


function assert(cond) {
    bp.ASSERT(cond,"ERROR: Assertion failed!")
}

// return all cell entities that are near 'cell'
function getNearCells(cell) {
    let result = []
    if (cell.row > 1)
        result.push(getCellFromCtx(cell.row - 1, cell.col))
    if (cell.row < ROWS)
        result.push(getCellFromCtx(cell.row + 1, cell.col))
    if (cell.col > 1)
        result.push(getCellFromCtx(cell.row, cell.col - 1))
    if (cell.col < COLS)
        result.push(getCellFromCtx(cell.row, cell.col + 1))
    return result
}

// return cell entity at row,col
function getCellFromCtx(row, col) {
    return ctx.getEntityById("cell:" + row + "," + col)
}

///////////////////////////////////////////////////////////////////

const ROWS = 4
const COLS = 4
const MAX_ACTIONS = (ROWS * COLS) * (ROWS * COLS)

let gameStatus = ctx.Entity("game status", "", {val: "ongoing"})

let score = ctx.Entity("score", "", {val: 0})

// amount of arrows player has
let arrows = ctx.Entity("arrows", "", {val: 1})

// player's location and direction
let player = ctx.Entity("player", "", {
    row: 1,
    col: 1,
    facing: 90
})

// player's knowledge base - what he knows about the world and his actions
let kb = ctx.Entity("kb", "", {
    wumpus: 'alive',
    player_has_gold: false,
    actions_history: []
})


let cells = []
for (let i = 1; i <= ROWS; i++)
    for (let j = 1; j <= COLS; j++)
        cells.push(ctx.Entity("cell:" + i + "," + j, "cell",{
            row: i,
            col: j,

            // has* mean that there are actually there, regardless of player's knowledge
            hasPlayer: i==1 && j==1,
            //TODO: randomize these
            hasPit: (i==1 && j==3) || (i==3 & j==3) || (i==4 && j==4),
            hasGold: i==3 && j==2,
            hasWumpus: i==3 && j==1,

            // from here below, it's the player's subjective knowledge
            Breeze: false,
            Stench: false,
            Pit: "unknown",
            Wumpus: "unknown"
        }))


ctx.populateContext(cells.concat(
    [gameStatus, score, arrows, kb, player]))

///////////////////////////////////////////////

ctx.registerQuery("Player.Has.Gold", function (entity) {
    return entity.id.equals("kb") && entity.player_has_gold
})

ctx.registerQuery("Player.In.Cell.With.Gold", function (entity) {
    //TODO do we need 'glitter'?
    return entity.type.equals("cell") && entity.hasGold && entity.hasPlayer
})

ctx.registerQuery("Game ongoing", function (entity) {
    return entity.id.equals("game status") && entity.val.equals("ongoing")
})

ctx.registerQuery("Game over", function (entity) {
    return entity.id.equals("game status") && entity.val.equals("finished")
})


///////////////////////////////////////////////


function updateScore(delta) {
    let score = ctx.getEntityById("score")
    score.val += delta
    ctx.updateEntity(score)
}

// game is over, either because player has died, or because he climbed out
function gameOver(reason) {
    let score = ctx.getEntityById("score")
    let gameStatus = ctx.getEntityById("game status")
    gameStatus.val = "finished"
    gameStatus.reason = reason
    gameStatus.score = score.val
    ctx.updateEntity(gameStatus)

}

// update cell with required changes after player's action (or at game's start)
function updateCellStatus(action) {
    let player = ctx.getEntityById("player")
    let cell = getCellFromCtx(player.row, player.col)
    assert(cell.hasPlayer)

    // update things that are in this cell
    if (cell.hasPit) {
        updateScore(-1000);
        gameOver("fell in pit")
    }

    if (cell.hasWumpus) {
        updateScore(-1000);
        gameOver("Wumpus lunch")
    }

    // update things that are in near cells
    let nearCells = getNearCells(cell)
    for (let i = 0; i < nearCells.length; i++) {
        let nearCell = nearCells[i]
        if (nearCell.hasPit) {
            updateIndication("Breeze")
            updateDangers("Pit")
        }
        if (nearCell.hasWumpus) {
            updateIndication("Stench")
            updateDangers("Wumpus")
        }
    }
    updateKb(action.id)
}

ctx.registerEffect("Start", function (effect) {
    updateCellStatus("");
})

// the 'core' of the game - handle player's actions
ctx.registerEffect("Play", function (action) {
    let player = ctx.getEntityById("player")

    // each turn costs 1 point
    updateScore(-1)

    // bp.log.info("registerEffect start: Play: " + action.id + ". player on " + player.row + ":" + player.col + ", facing: " + player.facing)

    if (action.id.equals("forward")) {
        let cell = getCellFromCtx(player.row, player.col)
        cell.hasPlayer = false
        ctx.updateEntity(cell)

        if (player.facing == 90 && player.col < COLS)
            player.col++
        else if (player.facing == 270 && player.col > 1)
            player.col--
        else if (player.facing == 0 && player.row < ROWS)
            player.row++
        else if (player.facing == 180 && player.row > 1)
            player.row--
        // if needed, we can add an 'else ... trigger bump'
        ctx.updateEntity(player)

        cell = getCellFromCtx(player.row, player.col)
        cell.hasPlayer = true
        ctx.updateEntity(cell)
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
        let cell = getCellFromCtx(player.row, player.col)
        if (cell.hasGold) {
            cell.hasGold = false
            ctx.updateEntity(cell)
            updateScore(1000);
            updateGoldTaken()
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
                // TODO do we need "scream"?
                wumpus.status = "dead"
                ctx.updateEntity(wumpus)
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
    updateCellStatus(action);
})


///////////////////////////////////////////////////////////
///////////            strategies            //////////////
///////////////////////////////////////////////////////////

// TODO (BUG): I'd like it to be "Cells.Near.Player.Without.Known.Danger"
// i.e., return all cells that are near the player, and the player isn't aware of any danger in them
// However, adding the && cellNearPlayer(entity) fails, with:
// 'Cannot call this function within an effect function'
//
// return all cells that player isn't aware of any danger in them
ctx.registerQuery("Cell.Unvisited.Unknown.Danger", function (entity) {
    function cellNearPlayer(cell) {
        let player = ctx.getEntityById("player")
        return near(cell, player)
    }

    return entity.type.equals("cell") && entity.Pit == "unknown" && entity.Wumpus == "unknown" //TODO fails: && cellNearPlayer(entity)
})

// same problem as "Cell.Unvisited.Unknown.Danger"
//
// return all cells that player hasn't been to, and he knows that are clean from danger
ctx.registerQuery("Cell.Unvisited.No.Danger", function (entity) {
    return entity.type.equals("cell") && entity.Pit == "clean" && entity.Wumpus == "clean"
})

// same problem as "Cell.Unvisited.Unknown.Danger"
//
// return all cells that player has already visited (and therefore, are also clean)
ctx.registerQuery("Cell.Visited", function (entity) {
    return entity.type.equals("cell") && entity.Pit == "visited" && entity.Wumpus == "visited"
})


////////////////////////////////////

// update player's knowledge about specific indication in his location (because of danger in near cell)
// ind is either "Breeze" or "Stench"
function updateIndication(ind) {
    let player = ctx.getEntityById("player")
    let cell = getCellFromCtx(player.row, player.col)
    cell[ind] = true
    ctx.updateEntity(cell)
}

// update player's knowledge base due to being in his current location
function updateKb(id) {
    let kb = ctx.getEntityById("kb")

    // save the action - to be able to return back to start after taking gold - in same way, and for debugging
    kb.actions_history.push(id)
    ctx.updateEntity(kb)

    // mark the cell as 'visited', therefore it doesn't have "Pit" or "Wumpus"
    updateVisited("Pit")
    updateVisited("Wumpus")

    // check if we can clean near cells because of absent indications
    updateNoIndications(kb)

    if (kb.actions_history.length > MAX_ACTIONS) {
        bp.log.info("stuck in infinite loop, exiting")
        exit(1)
    }
}

// if there isn't specific indication in player's location, mark near cells as clean from the corresponding danger
function updateNoIndications(kb) {
    let player = ctx.getEntityById("player")
    let cell = getCellFromCtx(player.row, player.col)
    if (!cell.Breeze) {
        bp.log.info("No Breeze indication in cell " + player.row + "," + player.col + ", cleaning its neighbors")
        // bp.log.info(cell)
        cleanDanger("Pit", player.row + 1, player.col)
        cleanDanger("Pit", player.row - 1, player.col)
        cleanDanger("Pit", player.row, player.col + 1)
        cleanDanger("Pit", player.row, player.col - 1)
    }
    if (!cell.Stench) {
        bp.log.info("No Stench indication in cell " + player.row + "," + player.col + ", cleaning its neighbors")
        // bp.log.info(cell)
        cleanDanger("Wumpus", player.row + 1, player.col)
        cleanDanger("Wumpus", player.row - 1, player.col)
        cleanDanger("Wumpus", player.row, player.col + 1)
        cleanDanger("Wumpus", player.row, player.col - 1)
    }
}


// update player's knowledge that specific 'danger' in cells near to player is "possible" - only if it was "unknown" before
// danger is either "Pit" or "Wumpus"
function updateDangers(danger) {
    let player = ctx.getEntityById("player")
    updateDanger(danger, player.row + 1, player.col)
    updateDanger(danger, player.row - 1, player.col)
    updateDanger(danger, player.row, player.col + 1)
    updateDanger(danger, player.row, player.col - 1)
}

// update player's knowledge that specific 'danger' in row,col is "possible" - only if it was "unknown" before
// danger is either "Pit" or "Wumpus"
// reminder: see the danger states comment at the beginning of the file
function updateDanger(danger, row, col) {
    if (row >= 1 && row <= ROWS && col >= 1 && col <= COLS) {
        let cell = getCellFromCtx(row, col)
        if (cell[danger] == "unknown") {
            cell[danger] = "possible"
        } else if (cell[danger] == "visited" || cell[danger] == "possible" || cell[danger] == "clean")  {
            // pass
        } else {
            bp.log.info("Unhandled: " + cell[danger])
            bp.log.info(cell)
            exit(1)
        }
        // bp.log.info("updateDanger: " + danger + " at " + row + "," + col + " to " + cell[danger])
        ctx.updateEntity(cell)
    }
}

// update player's knowledge that specific 'danger' in row,col is "clean" (if it wasn't already visited)
// danger is either "Pit" or "Wumpus"
// reminder: see the danger states comment at the beginning of the file
function cleanDanger(danger, row, col) {
    if (row >= 1 && row <= ROWS && col >= 1 && col <= COLS) {
        let cell = getCellFromCtx(row, col)
        if (cell[danger] == "unknown" || cell[danger] == "possible") {
            cell[danger] = "clean"
        } else if (cell[danger] == "visited" || cell[danger] == "clean") {
            // pass
        } else {
            bp.log.info("Unhandled: " + cell[danger])
            bp.log.info(cell)
            exit(1)
        }
        // bp.log.info(cell)
        ctx.updateEntity(cell)
    }
}

// update player's knowledge that specific 'danger' in row,col is "visited"
// danger is either "Pit" or "Wumpus"
// reminder: see the danger states comment at the beginning of the file
function updateVisited(danger) {
    let player = ctx.getEntityById("player")
    let cell = getCellFromCtx(player.row, player.col)
    cell[danger] = "visited"
    bp.log.info("updateVisited: " + danger + " at " + player.row + "," + player.col + " to " + cell[danger])
    ctx.updateEntity(cell)
}

// update player's KB was the fact that he has the gold
function updateGoldTaken() {
    let kb = ctx.getEntityById("kb")
    kb.player_has_gold = true
    ctx.updateEntity(kb)
}

