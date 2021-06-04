bthread('FiveHandler', 'Five.AllReady',
    function (entity) {
        bp.log.info("ZZ FiveHandler")
        bp.log.info(entity)
        // sync({request: Event('hot', entity)})
    })
