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


class ConnectionManager {
    static instance;
    constructor() {

    };
    static getInstance() {
        logger.info("connection manager get instance.");
        if (!ConnectionManager.instance) {
            ConnectionManager.instance = new ConnectionManager();
            (async  () => {
                await ConnectionManager.instance.init();
            })();
        }
        return ConnectionManager.instance;
    }

    init () {
        this.waitingOffers = new FIFO();
        this.connectionMap = new Map();
        this.storage = storage.getInstance();
        this.queue = queue.getInstance();
    }

    async addConnection(connection) {
        const now = new Date().getTime();
        const deviceId = connection.deviceId;
        const connectionId = deviceId + nanoid(10);

        //this.connectionMap.set(connectionId, connection);

        await this.storage.addConnection(connectionId, connection, deviceId, now, "created");
        await this.queue.enqueue(connectionId);


        return connectionId;
    };

    async yieldConnection(connectionId) {
        await this.storage.updateConnection(connectionId, {status: "timeout"});
    }

    dropConnection(connectionId) {
        this.connectionMap.delete(connectionId);
    }

    async getWaitingOffer() {
        const connectionId = await this.queue.dequeue();

        const connection = await this.storage.getConnection(connectionId);
        const now = new Date().getTime();

        if (Date.parse(connection.keepalive) + connectionIdleTimeoutSec*1000 < now ){
            throw {errorCode: 404, error: "got offer from queue but client not poll for it for a while try call for other"}
        }
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
                await this.storage.updateConnection(connectionId, {offerResponse: JSON.stringify(offerResponse)});
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
        const now = new Date().getTime();
        setImmediate(async ()=>{
            try {
                await this.setKeepalive( connectionId, now);
            } catch (error) {
                logger.error ( "Failed to set connection keep alive for connection: " + connectionId + " error: " + utils.stringifyError(error));
            }
        });
        if(!offerResponse) {
            throw {errorCode: 404, message: "offer response not yet arrived keep polling"};
        }
        return offerResponse;
    };

}

module.exports.getInstance = ConnectionManager.getInstance;
