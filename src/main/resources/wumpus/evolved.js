// the following 3 are before player has taken gold:

// note the different priorities
// player - go to unvisited cell without danger: 70
// player - go to unvisited cell with no known danger: 60
// player - return to visited cell : 50


// // go to cells that are near the player, and the player isn't aware of any danger in them
// ctx.bthread("player - go to unvisited cell with no known danger", "Cell.NearWithoutKnownDanger_NoGold", function (cell) {
//     while(true) {
//         let plan = planToNear(cell)
//         // bp.log.info(player.row + ":" + player.col + "," + player.facing + " no known danger nearby: " + cell.row + ":" + cell.col + ". direction: " + direction(player, cell) + ". plan: " + plan)
//         sync({request: Event("Plan", {plan: plan}), waitFor: ContextChanged}, 60)
//     }
// })
//
// // go to cells that are near the player, we haven't visited before, and we are sure that aren't dangerous - be an explorer, but safely
// ctx.bthread("player - go to unvisited cell without danger", "Cell.NearUnvisitedNoDanger_NoGold", function (cell) {
//     while(true) {
//         let plan = planToNear(cell)
//         // bp.log.info(player.row + ":" + player.col + "," + player.facing + " clean nearby: " + cell.row + ":" + cell.col + ". direction: " + direction(player, cell) + ". plan: " + plan)
//         sync({request: Event("Plan", {plan: plan}), waitFor: ContextChanged}, 70)
//     }
// })
//
// // go to cells that are near the player, we have already visited (and therefore, are safe) - boring, but might prove useful to open new frontiers from there
// ctx.bthread("player - return to visited cell", "Cell.NearVisited_NoGold", function (cell) {
//     while(true) {
//         let plan = planToNear(cell)
//         // bp.log.info(player.row + ":" + player.col + "," + player.facing + " visited nearby: " + cell.row + ":" + cell.col + ". direction: " + direction(player, cell) + ". plan: " + plan)
//         sync({request: Event("Plan", {plan: plan}), waitFor: ContextChanged}, 50)
//     }
// })

// ctx.bthread("player - go to safe, unvisited, cell", "Cell.UnVisitedSafeToVisit", function (cell) {
//     while(true) {
//         let plan = createPlanTo(cell)
//         let e = sync({request: Event("Plan", {plan: plan}), waitFor: ContextChanged}, 80 - manhattanDistanceFromPlayer(cell))
//         // bp.log.info("go to safe: " + cell.row + ":" + cell.col + ". executed plan: " + plan)
//     }
// })
//
// ctx.bthread("player - go to possibly dangerous, unvisited, cell", "Cell.UnVisitedPossibleDangerRoute", function (cell) {
//     while(true) {
//         let plan = createPlanTo(cell)
//         let e = sync({request: Event("Plan", {plan: plan}), waitFor: ContextChanged}, 70)
//         // bp.log.info("go to possible danger: " + cell.row + ":" + cell.col + ". executed plan: " + plan)
//     }
// })
//

// ctx.bthread("GeneratedBT", "Cell.UnVisitedPossibleDangerRoute", function (entity) {
//     while(true) {
//         sync({request: Event("Plan", {plan: createPlanTo(entity)}), waitFor: ContextChanged}, 64 - manhattanDistanceFromPlayer(entity))
//
//     }
// })

// ctx.bthread("GeneratedBT", "Cell.UnVisitedPossibleDangerRoute", function (entity) {
//     while(true) {
//         // bp.log.info("player at: " + getCellCords(ctx.getEntityById("player")))
//         // bp.log.info(getCellCords(entity) + " : " + createPlanTo(entity) + ", " + manhattanDistanceFromPlayer(entity))
//         // // bp.log.info(64 - manhattanDistanceFromPlayer(entity))
//         // bp.log.info(entity)
//         let player = ctx.getEntityById("player")
//         let playerCell = getCellEntity(player.row, player.col)
//         bp.ASSERT(playerCell.hasPlayer, "ERROR: GeneratedBT: playerCell.hasPlayer is false!")
//         bp.log.info(playerCell)
//         bp.log.info(entity)
//         bp.log.info(ctx.getEntityById("kb"))
//
//         sync({request: Event("Plan", {plan: createPlanTo(entity)}), waitFor: ContextChanged}, (70 - manhattanDistanceFromPlayer(entity)))
//
//     }
// })
// ctx.bthread("GeneratedBT", "Cell.NearWithoutKnownDanger_NoGold", function (entity) {
//     while(true) {
//         // bp.log.info(2 + getCellCords(entity) + createPlanTo(entity))
//         sync({request: Event("Plan", {plan: createPlanTo(entity)}), waitFor: ContextChanged}, 68 - manhattanDistanceFromPlayer(entity))
//
//     }
// })


ctx.bthread("GeneratedBT", "Cell.UnVisitedSafeToVisit", function (entity) {
    while(true) {
        sync({request: Event("Plan", {plan: createPlanTo(entity)}), waitFor: ContextChanged}, 68 - manhattanDistanceFromPlayer(entity))

    }
})
ctx.bthread("GeneratedBT", "Cell.UnVisitedSafeToVisit", function (entity) {
    while(true) {
        sync({request: Event("Plan", {plan: createPlanTo(entity)}), waitFor: ContextChanged}, 57 - manhattanDistanceFromPlayer(entity))

    }
})
ctx.bthread("GeneratedBT", "Cell.NearUnvisitedNoDanger_NoGold", function (entity) {
    while(true) {
        sync({request: Event("Plan", {plan: createPlanTo(entity)}), waitFor: ContextChanged}, 53 - manhattanDistanceFromPlayer(entity))

    }
})
