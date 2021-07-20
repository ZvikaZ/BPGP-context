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
    if (delta == 0) {
        result = []
    } else if (delta == 90) {
        result = ['turn-right']
    } else if (delta == 180) {
        result = ['turn-right', 'turn-right']
    } else if (delta == 270) {
        result = ['turn-left']
    } else {
        error()
    }
    result.push('forward')
    return result
}


function playerInCell(e, cell) {
    let player = e.data.player
    return cell.row == player.row && cell.col == player.col
}

const AnyPlay = bp.EventSet("Play", function (evt) {
    return evt.name.equals("Play")
})

const AnyPlan = bp.EventSet("Plan", function (evt) {
    return evt.name.equals("Plan")
})

const AnyActionDone = bp.EventSet("Action done", function (evt) {
    return evt.name.equals("Action done")
})

///////////////////////////////////////////////////////////
///////////            rules                 //////////////
///////////////////////////////////////////////////////////


// bthread("EnforceTurns", function() {
//     while (true) {
//         sync({ waitFor: AnyPlay});
//         sync({ waitFor: AnyActionDone, block: [AnyPlay]})
//     }
// });


ctx.bthread("wumpus - eat", "Wumpus.Alive", function (wumpus) {
    while (true) {
        let e = sync({waitFor: AnyActionDone})
        let player = e.data.player
        if (wumpus.row == player.row && wumpus.col == player.col)
            sync({request: Event("Wumpus lunch")}, 1000)
    }
})

ctx.bthread("wumpus - smell", "Wumpus.Alive", function (wumpus) {
    while (true) {
        let e = sync({waitFor: AnyActionDone})
        let player = e.data.player
        if (near(wumpus, player))
            sync({request: Event("Stench")}, 1000)
    }
})

ctx.bthread("gold - glitter", "Cell.Gold", function (gold) {
    while (true) {
        let e = sync({waitFor: AnyActionDone})
        if (playerInCell(e, gold))
            sync({request: Event("Glitter")}, 1000)
    }
})

ctx.bthread("pit - fall", "Pit.All", function (pit) {
    while (true) {
        let e = sync({waitFor: AnyActionDone})
        if (playerInCell(e, pit))
            sync({request: Event("Fell in pit")}, 1000)
    }
})

ctx.bthread("pit - breeze", "Pit.All", function (pit) {
    while (true) {
        let e = sync({waitFor: AnyActionDone})
        let player = e.data.player
        if (near(pit, player))
            sync({request: Event("Breeze")}, 1000)
    }
})

bthread("Start", function () {
    sync({request: Event("Start")}, 1000)
})

///////////////////////////////////////////////////////////
///////////            printing              //////////////
///////////////////////////////////////////////////////////

bthread("boardPrinter", function() {
    board = []
    for (var i = 0; i < ROWS; i++) {
        row = []
        for (var j = 0; j < COLS; j++) {
            row.push('_')
        }
        board.push(row)
    }

    while (true) {
        let e = sync({waitFor: AnyActionDone});
        let action = e.data.id
        let x = e.data.player.row - 1
        let y = e.data.player.col - 1
        let facing = e.data.player.facing
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
});

ctx.bthread("leave", "Cell.Opening", function (cell) {
    while(true) {
        let e = sync({waitFor: AnyActionDone})
        let player = e.data.player
        if (e.data.kb.has_gold && cell.row == player.row && cell.col == player.col)
            sync({request: Event("Play", {id: 'climb'})}, 90)
    }
})

//TODO when to shoot?

// ctx.bthread("player - default", "Cell.All", function (cell) {
//     while(true) {
//         let e = sync({waitFor: AnyActionDone})
//         if (playerInCell(e, cell))
//             sync({request: Event("Play", {id: 'forward'})}, 10)
//     }
// })

ctx.bthread("player - no known danger nearby", "Cell.Danger.Unknown", function (cell) {
    while(true) {
        let e = sync({waitFor: AnyActionDone})
        if (near(e.data.player, cell)) {
            let plan = shortPlan(e.data.player, cell)
            bp.log.info(e.data.player.row + ":" + e.data.player.col + "," + e.data.player.facing + " no known danger nearby: " + cell.row + ":" + cell.col + ". direction: " + direction(e.data.player, cell) + ". plan: " + plan)
            sync({request: Event("Plan", {plan: plan}), waitFor: AnyPlan}, 50)
            // bp.log.info("Requested plan: " + plan)
        }
    }
})

bthread("execute plan", function() {
    while (true) {
        let e = sync({waitFor: AnyPlan})
        let plan = e.data.plan
        bp.log.info("execute plan, got: " + plan)
        for (var i = 0; i < plan.length; i++) {
            let e = sync({request: Event("Play", {id: plan[i]})}, 60)
            bp.log.info("Executed step #" + i + " of plan: " + plan)
            bp.log.info(e)
        }
        bp.log.info("Finished executing plan: " + plan)
    }
})

