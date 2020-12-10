'use strict';

const config = require('config');
const FIFO = require('fifo');
const { nanoid } = require("nanoid");
const queue = require("./queue");
const storage = require("./storage");
const utils = require("./utils");


const log4js = require("log4js");


const log4jsConfig = {
    "appenders" : {
        "connectionManager" : {
            "type": "console", "layout": {
                "type": "pattern", "pattern": "%[%d{ISO8601_WITH_TZ_OFFSET} %p %c -%] %m", "tokens": {}
            }
        }
    },
    "categories": {"default": { "appenders": ["connectionManager"], "level": "info" }}
};

log4js.configure(log4jsConfig, {});
const logger = log4js.getLogger("connectionManager");

const connectionIdleTimeoutSec = config.connectionIdleTimeoutSec;
const processingTimout = config.offerProcessingTimeoutSec;
const connectionTypes = config.connectionTypes;

class ConnectionManager {
    static instance;
    constructor() {

    };
    static async getInstance() {
        logger.info("connection manager get instance.");
        if (!ConnectionManager.instance) {
            ConnectionManager.instance = new ConnectionManager();
            await ConnectionManager.instance.init();

        }
        return ConnectionManager.instance;
    }

    async init () {
        this.queue = await queue.getInstance();
        this.storage = await storage.getInstance();
    }

    async addConnection(connection, connectionType, clientConnectionId) {

        if(!connectionTypes.indexOf(connectionType) < 0 ) {
            throw {errorCode: 503, error: "Unsupported connection type in url pat parameter"};
        }
        if(connectionType === "application" && !clientConnectionId) {
            throw {errorCode: 503, error: "Request for a new connection with type application needs to supply the client connection id"};
        }

        const now = new Date().getTime();
        const deviceId = connection.deviceId;


        const connectionId = connectionType === "client" ? deviceId + nanoid(10) : utils.createApplicationConnectionIdFromClientId(clientConnectionId);

        await this.storage.addConnection(connectionId, connection, deviceId, now, "created", connectionType);
        await this.queue.enqueue(connectionId, connectionType);


        return connectionId;
    };

    async yieldConnection(connectionId) {
        await this.storage.updateConnection(connectionId, {status: "timeout"});
    }

    dropConnection(connectionId) {
        this.connectionMap.delete(connectionId);
    }

    async getWaitingOffer(connectionType) {
        const connectionId = await this.queue.dequeue(connectionType);

        const connection = await this.storage.getConnection(connectionId);
        const now = new Date().getTime();

        if (Date.parse(connection.keepalive) + connectionIdleTimeoutSec*1000 < now ){
            throw {errorCode: 503, error: "got offer from queue but client not poll for it for a while, try again"}
        } else if (connection.status !== "created") {
            throw {errorCode: 503, error: "got offer from queue but status was not as expected, try again"}
        }

        setImmediate(async ()=>{
            try {
                await this.storage.updateConnection(connectionId, {"status": "allocated"});
            } catch (error) {
                logger.error ( "Failed to set connection keep alive for connection: " + connectionId + " error: " + utils.stringifyError(error));
            }
        });

        return connectionId;
    };

    async getOffer(connectionId) {
        const connection = await this.storage.getConnection(connectionId);
        const offer = connection && connection.offer && JSON.parse(connection.offer);
        const now = new Date().getTime();
        if (offer) {
            await this.setOfferTime( connectionId, now);
        }
        return offer;
    }


    async saveOfferResponse(connectionId, offerResponse) {
        const connection = await this.storage.getConnection(connectionId);
        const now = new Date().getTime();
        if(connection) {
            if (Date.parse(connection.offerGetTime) + processingTimout*1000 >= now) {
                await this.storage.updateConnection(connectionId, {offerResponse: JSON.stringify(offerResponse), status: "offerResponse"});
            }
            else {
                throw {errorCode: 500, error: "offer processing time expire"};
            }

        }
    };

    addCandidate(connectionId, ice) {
        const connection = this.connectionMap.get(connectionId);
        if(connection) {
            const now = new Date().getTime();
            connection.keepalive = now;
            connection.ice.push(({state:"new", content: ice}));
            this.connectionMap.set(connectionId, connection);
            return true;
        }
        return false;
    };

    async setKeepalive(connectionId, time) {

        await this.storage.updateConnection(connectionId, {"keepalive": time});
    }
    async setOfferTime(connectionId, time) {
        await this.storage.updateConnection(connectionId, {"offerGetTime": time});
    }

    getCandidate(connectionId) {
        const connection = this.connectionMap.get(connectionId);
        if(connection) {
           const candidate = connection.ice.find( (candidate) => {return candidate.state === "new" });
           if (candidate) {
               candidate.state = "retrieve";
               return  candidate.content;
           }
        }

        return false;
    };

    async getOfferResponse(connectionId) {
        const connection = await this.storage.getConnection(connectionId);
        const offerResponse =  connection && connection.offerResponse && JSON.parse(connection.offerResponse);
        if(!offerResponse) {
            throw {errorCode: 404, message: "offer response not yet arrived keep polling"};
        }
        const now = new Date().getTime();
        setImmediate(async ()=>{
            try {
                await this.setKeepalive( connectionId, now);
            } catch (error) {
                logger.error ( "Failed to set connection keep alive for connection: " + connectionId + " error: " + utils.stringifyError(error));
            }
        });
        if(connection.type === "application") {
            const clientConnectionId = utils.getClientConnectionIdFromApplicationId(connectionId);
            await this.storage.updateConnection(clientConnectionId, {"peerConnectionStatus": "connected"});
        } else if (connection.type === "client") {
            if(connection.peerConnectionStatus !== "connected") {
                throw {errorCode: 404, message: "Connection Not yet fully established keep polling"};
            }
        }

        return offerResponse;
    };

}

module.exports.getInstance = ConnectionManager.getInstance;
