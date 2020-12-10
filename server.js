'use strict';

const express = require('express');
const router = express.Router();
const bodyParser = require("body-parser");
const config = require('config');
const cors = require('cors');
const app = express();
var log4js = require("log4js");


const log4jsConfig = {
    "appenders" : {
        "server" : {
        "type": "console", "layout": {
            "type": "pattern", "pattern": "%[%d{ISO8601_WITH_TZ_OFFSET} %p %c -%] %m", "tokens": {}
         }
        },
    },
    "categories": {"default": { "appenders": ["server"], "level": "info" }}
};

log4js.configure(log4jsConfig, {});
var logger = log4js.getLogger("server");
var connectionManager;
(
    async () => {
        connectionManager = await require("./lib/connectionManager").getInstance();
})().then( () => {
    logger.info("starting server");

    const port = config.server.port;

    app.listen(port, () => {
        logger.info("Started on PORT " + port);
    });
    app.use(sigPath, router);
}).catch((error) => {logger.error("Server init Error --- exit"); process.exit(1);});



var jsonParser = bodyParser.json();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ type: 'application/*+json' }));
app.use(cors());


app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl} [REQ]`);

    res.on('finish', () => {
        logger.info(`${req.method} ${req.originalUrl} [RES]`);
    });

    next()
})

const apiVersion = '1.0';
const sigPath = '/signaling/' + apiVersion;

//
//   Handle offer 
//
router.post('/:connectionType/connections', jsonParser, async function(req, res) {
    const connectionType = req.params.connectionType;
    const appConnectionId = req.query.connectionId;

    try {
        const connectionId = await connectionManager.addConnection(req.body, connectionType, appConnectionId);
        res.status(201).json({connectionId:connectionId});
    } catch (error){
        res.status(error.errorCode? error.errorCode : 503).json(error);
    }
});


//
//   Handle client polling for offer response
//
router.get('/connections/:connectionId/answer', async function(req, res) {
    const connectionId = req.params.connectionId;

    try{
        const offerResp = await connectionManager.getOfferResponse(connectionId);
        res.status(200).json(offerResp);
    } catch (error) {
        res.status(error.errorCode? error.errorCode : 503).json(error);
    }
});

router.post('/connections/:connectionId/answer', jsonParser, async function(req, res) {
    const connectionId = req.params.connectionId;
    const offerResp = req.body;
    try{
        await connectionManager.saveOfferResponse(connectionId, offerResp);
        res.status(201).json(offerResp);
    } catch (error) {
        res.status(error.errorCode? error.errorCode : 503).json(error);
    }
});

router.get('/connections/:connectionId/offer', async function(req, res) {
    const connectionId = req.params.connectionId;
    try{
        const offer = await connectionManager.getOffer(connectionId);
        res.status(200).json(offer);
    } catch (error) {
        res.status(error.errorCode? error.errorCode : 503).json(error);
    }
});

//
//   Handle trans container trquest to get unserved offer
//
router.get('/:connectionType/queue', async function(req, res) {
    const connectionType = req.params.connectionType;

    try{
        const connectionId = await connectionManager.getWaitingOffer(connectionType);
        res.status(200).json({connectionId:connectionId});
    } catch (error) {
        res.status(error.errorCode? error.errorCode : 503).json(error);
    }

});


/*
router.post('/connections/:connectionId/ice', jsonParser, function(req, res) {
    logger.info( "post ice request Received .. " );

    const connectionId = req.params.connectionId;
    const ice = req.body;

    if(!connectionManager.addCandidate(connectionId, ice)) {
        res.status(404).json({err:"offer not exist"});
    } else {
        res.sendStatus(201);
    }
});


router.get('/connections/:connectionId/ice', function(req, res) {
    logger.info( "get ice request Received .. " )

    const connectionId = req.params.connectionId;
    const candidate = connectionManager.getCandidate(connectionId);

    if(!candidate) {
        res.status(404).json({err:"offer not exist"});
    } else {
        res.status(200).json(candidate);
    }
});

*/
