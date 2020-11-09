const express = require('express');
const router = express.Router();
const bodyParser = require("body-parser");
const config = require('config')

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

const storage = require("./lib/storage");

const port = config.server.port;

const app = express()
var jsonParser = bodyParser.json()
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ type: 'application/*+json' }))

app.listen(port,  () => {console.log("Started on PORT " + port);} )

const processingTimout = config.offerProcessingTimeoutSec;

function handleTimeout(connectionId) {
    if(!storage.getOfferResponse(connectionId)) {
        storage.addToQueue(connectionId);
    }
}

//
//   Handle offer 
//
app.post('/connections', jsonParser, function(req, res) {
    logger.info( "offer Received .. " )

    const connectionId = storage.addConnection(req.body);

    res.status(201).json({connectionId:connectionId});
});


//
//   Handle client polling for offer response
//
app.get('/connections/:connectionId/answer', function(req, res) {
    logger.info( "get offer response Received .. " )

    const connectionId = req.params.connectionId;

    const offerResp = storage.getOfferResponse(connectionId);

    if(!offerResp) {
        res.status(404).json({err:"response not exist"});
    } else {
        res.status(200).json(offerResp);
    }

});

app.post('/connections/:connectionId/answer', jsonParser, function(req, res) {
    logger.info( "offer response Received .. " )

    const connectionId = req.params.connectionId;
    const offerResp = req.body;

    if(!storage.saveOfferResponse(connectionId, offerResp)) {
        res.status(404).json({err:"offer not exist"});
    } else {
        res.status(201).json(offerResp);
    }

});

app.get('/connections/:connectionId/offer', function(req, res) {
    const connectionId = req.params.connectionId;
    logger.info( "get offer Received .. connection id:  " + connectionId );

    const offer = storage.getOffer(connectionId);

    if(!offer) {
        res.status(404).json({err:"offer not exist"});
    } else {
        res.status(200).json(offer);
    }

});

//
//   Handle trans container trquest to get unserved offer
//
app.get('/queue', function(req, res) {
    logger.info( "get unserved offer request Received .. " )

    const connectionId = storage.getWaitingOffer();

    if (!connectionId) {
        res.status(404).json({err:"all offers are currently served"});
    } else {
        res.status(200).json({connectionId:connectionId});
        setTimeout(handleTimeout, processingTimout*1000, connectionId);
    }
});

app.post('/connections/:connectionId/ice', jsonParser, function(req, res) {
    logger.info( "offer response Received .. " )

    const connectionId = req.params.connectionId;
    const ice = req.body;

    if(!storage.saveIceCandidate(connectionId, ice)) {
        res.status(404).json({err:"offer not exist"});
    } else {
        res.status(201).json(offerResp);
    }

});

