allFives.forEach(function (line) {
    bthread('FiveHandler.' + buildLine(line), 'Five.AllReady.' + buildLine(line),
        function (entity) {
            bp.log.info("ZZ FiveHandler - requesting:")
            bp.log.info(entity.center.map(cell => putInCol(cell.col, "Yellow")))
            sync({request: entity.center.map(cell => putInCol(cell.col, "Yellow"))}, 80)
        })
})
