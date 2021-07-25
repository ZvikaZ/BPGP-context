function near(a, b) {
    return  (a.row == b.row && ((a.col == b.col + 1) || (a.col == b.col -1))) ||
            (a.col == b.col && ((a.row == b.row + 1) || (a.row == b.row -1)))
}

// what should be the direction of a, in order to move forward to b, assuming near(a,b)
function direction(a, b) {
    if (a.row < b.row)
        return 0
    else if (a.row > b.row)
        return 180
    else if (a.col < b.col)
        return 90
    else
        return 270
}

// return plan from player to b, assuming near(player,b)
function shortPlan(player, b) {
    if (!near(player, b))
        return null

    let delta = direction(player, b) - player.facing
    if (delta < 0)
        delta += 360
    let result = []
    if (delta == 0) {
        // pass
    } else if (delta == 90) {
        result.push('turn-right')
    } else if (delta == 180) {
        result.push('turn-right')
        result.push('turn-right')
    } else if (delta == 270) {
        result.push('turn-left')
    } else {
        error()
    }
    result.push('forward')
    return result
}

function createReversedPlan(actions_history) {
    let plan = ['turn-left', 'turn-left']
    for (let i = actions_history.length; i >= 0; i--) {
        let action = actions_history[i]
        if (action == 'turn-right')
            plan.push('turn-left')
        else if (action == 'turn-left')
            plan.push('turn-right')
        else if (action == 'forward')
            plan.push('forward')
    }
    return plan
}


function playerInCell(player, cell) {
    return cell.row == player.row && cell.col == player.col
}

const AnyPlay = bp.EventSet("Play", function (evt) {
    return evt.name.equals("Play")
})

const AnyPlan = bp.EventSet("Plan", function (evt) {
    return evt.name.equals("Plan")
})


///////////////////////////////////////////////////////////
///////////            rules                 //////////////
///////////////////////////////////////////////////////////


ctx.bthread("wumpus - eat", "Wumpus.Alive", function (wumpus) {
    while (true) {
        let player = ctx.getEntityById("player")
        if (wumpus.row == player.row && wumpus.col == player.col)
            sync({request: Event("Wumpus lunch")}, 1000)
        sync({waitFor: AnyPlay})
    }
})

ctx.bthread("wumpus - smell", "Wumpus.Alive", function (wumpus) {
    while (true) {
        let player = ctx.getEntityById("player")
        if (near(wumpus, player))
            sync({request: Event("Stench")}, 1000)
        sync({waitFor: AnyPlay})
    }
})

ctx.bthread("wumpus - scream", "Wumpus.Dead", function (wumpus) {
    sync({request: Event("Scream")}, 1000)
})

ctx.bthread("gold - glitter", "Cell.Gold", function (gold) {
    while (true) {
        let player = ctx.getEntityById("player")
        if (playerInCell(player, gold))
            sync({request: Event("Glitter")}, 1000)
        sync({waitFor: AnyPlay})
    }
})

ctx.bthread("pit - fall", "Pit.All", function (pit) {
    while (true) {
        let player = ctx.getEntityById("player")
        if (playerInCell(player, pit))
            sync({request: Event("Fell in pit")}, 1000)
        sync({waitFor: AnyPlay})
    }
})

ctx.bthread("pit - breeze", "Pit.All", function (pit) {
    while (true) {
        let player = ctx.getEntityById("player")
        if (near(pit, player))
            sync({request: Event("Breeze")}, 1000)
        sync({waitFor: AnyPlay})
    }
})

ctx.bthread("Game over", "Game over", function (entity) {
    bp.log.info("Game over: " + entity.type + ", score: " + entity.score)
    sync({block: bp.eventSets.all})
})


///////////////////////////////////////////////////////////
///////////            printing              //////////////
///////////////////////////////////////////////////////////

bthread("boardPrinter", function() {
    let board = []
    for (var i = 0; i < ROWS; i++) {
        let row = []
        for (var j = 0; j < COLS; j++) {
            row.push('_')
        }
        board.push(row)
    }

    while (true) {
        sync({waitFor: AnyPlay});
        let player = ctx.getEntityById("player")
        let x = player.row - 1
        let y = player.col - 1
        let facing = player.facing
        if (facing == 0)
            board[x][y] = '^'
        else if (facing == 90)
            board[x][y] = '>'
        else if (facing == 180)
            board[x][y] = 'V'
        else if (facing == 270)
            board[x][y] = '<'

        bp.log.info("--------------------")
        for (var i = ROWS - 1; i >= 0; i--) {
            bp.log.info(board[i].join(''))
        }
        bp.log.info("--------------------")
    }
})

///////////////////////////////////////////////////////////
///////////            strategies            //////////////
///////////////////////////////////////////////////////////

ctx.bthread("Grab gold", "Gold.Ready", function (gold) {
    while (true) {
        sync({waitFor: Event("Glitter")});
        sync({request: Event("Play", {id: 'grab'})}, 100)
    }
})

ctx.bthread("Return to start", "Gold.Taken", function (kb) {
    //TODO take shortest path, instead of return as we came...
    let plan = createReversedPlan(kb.actions_history)
    sync({request: Event("Plan", {plan: plan}), waitFor: AnyPlan}, 100)
})

ctx.bthread("Leave with gold", "Cell.Opening", function (cell) {
    while(true) {
        let player = ctx.getEntityById("player")
        let kb = ctx.getEntityById("kb")
        if (kb.has_gold && cell.row == player.row && cell.col == player.col)
            sync({request: Event("Play", {id: 'climb'})}, 90)
        sync({waitFor: AnyPlay})
    }
})

//TODO when to shoot?

ctx.bthread("player - no known danger nearby", "Cell.Danger.Unknown", function (cell) {
    while(true) {
        let player = ctx.getEntityById("player")
        if (near(player, cell)) {
            let plan = shortPlan(player, cell)
            bp.log.info(player.row + ":" + player.col + "," + player.facing + " no known danger nearby: " + cell.row + ":" + cell.col + ". direction: " + direction(player, cell) + ". plan: " + plan)
            sync({request: Event("Plan", {plan: plan}), waitFor: AnyPlan}, 60)
        }
        sync({waitFor: AnyPlay})
    }
})

//TODO clean/visited - one of them should be probably similar to the other...
ctx.bthread("player - clean nearby", "Cell.Danger.Clean", function (cell) {
    while(true) {
        let player = ctx.getEntityById("player")
        if (near(player, cell)) {
            let plan = shortPlan(player, cell)
            bp.log.info(player.row + ":" + player.col + "," + player.facing + " clean nearby: " + cell.row + ":" + cell.col + ". direction: " + direction(player, cell) + ". plan: " + plan)
            sync({request: Event("Plan", {plan: plan}), waitFor: AnyPlan}, 70)
        }
        sync({waitFor: AnyPlay})
    }
})

ctx.bthread("player - return to visited cell", "Cell.Danger.Visited", function (cell) {
    while(true) {
        let player = ctx.getEntityById("player")
        if (near(player, cell)) {
            let plan = shortPlan(player, cell)
            bp.log.info(player.row + ":" + player.col + "," + player.facing + " visited nearby: " + cell.row + ":" + cell.col + ". direction: " + direction(player, cell) + ". plan: " + plan)
            sync({request: Event("Plan", {plan: plan}), waitFor: AnyPlan}, 50)
            // bp.log.info("Requested plan: " + plan)
        }
        sync({waitFor: AnyPlay})
    }
})

bthread("execute plan", function() {
    while (true) {
        let e = sync({waitFor: AnyPlan})
        let plan = e.data.plan
        bp.log.info("execute plan, got: " + plan)
        for (var i = 0; i < plan.length; i++) {
            let e = sync({request: Event("Play", {id: plan[i]})}, 40)
            bp.log.info("Executed step #" + i + " of plan: " + plan)
            bp.log.info(e)
        }
        bp.log.info("Finished executing plan: " + plan)
    }
})

