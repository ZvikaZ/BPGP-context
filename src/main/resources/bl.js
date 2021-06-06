for (var i = 0; i < allFives.length; i++) {
    (function (line) {
        bthread('FiveHandler.' + buildLine(line), 'Five.AllReady.' + buildLine(line),
            function (entity) {
                while (true) {
                    bp.log.info("ZZ FiveHandler - does '" + buildLine(line) + "' exist? " + ctx_has(buildLine(line)))
                    bp.log.info("ZZ FiveHandler - requesting: " + entity.id)
                    bp.log.info(entity)
                    // bp.log.info(entity.center.map(cell => putInCol(cell.col, "Yellow")))
                    // sync({request: entity.center.map(cell => putInCol(cell.col, "Yellow"))}, 80)
                    // sync({request: line.map(cell => putInCol(cell.col, "Yellow"))}, 80)
                    sync({return: putInCol(0, "Yellow")})
                }
            })
    })(allFives[i])
}
