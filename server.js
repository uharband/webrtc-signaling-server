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
        }
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
        console.log("Started on PORT " + port);
    });
    app.use(sigPath, router);
}).catch((error) => {logger.error("Server init Error --- exit"); process.exit(1);});



var jsonParser = bodyParser.json();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ type: 'application/*+json' }));
app.use(cors());

const apiVersion = '1.0';
const sigPath = '/signaling/' + apiVersion;





function handleTimeout(connectionId) {
    if(!connectionManager.getOfferResponse(connectionId)) {
        connectionManager.yieldConnection(connectionId);
    }
}


//
//   Handle offer 
//
router.post('/connections', jsonParser, async function(req, res) {
    logger.info( "offer Received .. " );

    try {
        const connectionId = await connectionManager.addConnection(req.body);
        res.status(201).json({connectionId:connectionId});
    } catch (err){
        res.status(503).json({Error:err});
    }
});


//
//   Handle client polling for offer response
//
router.get('/connections/:connectionId/answer', async function(req, res) {
    logger.info( "get offer response Received .. " );

    var connectionId = req.params.connectionId;

    const offerResp = await connectionManager.getOfferResponse(connectionId);

    if(!offerResp) {
        res.status(404).json({err:"response not exist"});
        try {
            var now = new Date().getTime();
            setImmediate(async ()=>{
                await connectionManager.setKeepalive( connectionId, now);
            })
        } catch(err) {
            logger.error(err);
        }
    } else {
        res.status(200).json(offerResp);
    }

});

router.post('/connections/:connectionId/answer', jsonParser, async function(req, res) {
    logger.info( "offer response Received .. " );

    const connectionId = req.params.connectionId;
    const offerResp = req.body;

    if(!connectionManager.saveOfferResponse(connectionId, offerResp)) {
        res.status(404).json({err:"offer not exist"});
    } else {
        res.status(201).json(offerResp);
    }

});

router.get('/connections/:connectionId/offer', async function(req, res) {
    const connectionId = req.params.connectionId;
    logger.info( "get offer Received .. connection id:  " + connectionId );

    const offer = await connectionManager.getOffer(connectionId);

    if(!offer) {
        res.status(404).json({err:"offer not exist"});
    } else {
        res.status(200).json(offer);
        try {
            var now = new Date().getTime();
            setImmediate(async ()=>{
                await connectionManager.setOfferTime( connectionId, now);
            })
        } catch(err) {
            logger.error(err);
        }
    }

});

//
//   Handle trans container trquest to get unserved offer
//
router.get('/queue', async function(req, res) {
    logger.info( "get unserved offer request Received .. " );

    try{
        const connectionId = await connectionManager.getWaitingOffer();
        res.status(200).json({connectionId:connectionId});
        setTimeout(handleTimeout, processingTimout*1000, connectionId);
    } catch (error) {
        res.status(404).json({err:"all offers are currently served"});
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
