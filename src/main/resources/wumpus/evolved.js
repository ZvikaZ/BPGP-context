// the following 3 are before player has taken gold:

// note the different priorities
// player - go to unvisited cell without danger: 70
// player - go to unvisited cell with no known danger: 60
// player - return to visited cell : 50


// go to cells that are near the player, and the player isn't aware of any danger in them
ctx.bthread("player - go to unvisited cell with no known danger", "Cell.NearWithoutKnownDanger_NoGold", function (cell) {
    while(true) {
        let plan = planToNear(cell)
        // bp.log.info(player.row + ":" + player.col + "," + player.facing + " no known danger nearby: " + cell.row + ":" + cell.col + ". direction: " + direction(player, cell) + ". plan: " + plan)
        sync({request: Event("Plan", {plan: plan}), waitFor: bp.all}, 60)
    }
})

// go to cells that are near the player, we haven't visited before, and we are sure that aren't dangerous - be an explorer, but safely
ctx.bthread("player - go to unvisited cell without danger", "Cell.NearUnvisitedNoDanger_NoGold", function (cell) {
    while(true) {
        let plan = planToNear(cell)
        // bp.log.info(player.row + ":" + player.col + "," + player.facing + " clean nearby: " + cell.row + ":" + cell.col + ". direction: " + direction(player, cell) + ". plan: " + plan)
        sync({request: Event("Plan", {plan: plan}), waitFor: bp.all}, 70)
    }
})

// go to cells that are near the player, we have already visited (and therefore, are safe) - boring, but might prove useful to open new frontiers from there
ctx.bthread("player - return to visited cell", "Cell.NearVisited_NoGold", function (cell) {
    while(true) {
        let plan = planToNear(cell)
        // bp.log.info(player.row + ":" + player.col + "," + player.facing + " visited nearby: " + cell.row + ":" + cell.col + ". direction: " + direction(player, cell) + ". plan: " + plan)
        sync({request: Event("Plan", {plan: plan}), waitFor: bp.all}, 50)
    }
})
