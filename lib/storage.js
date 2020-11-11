const config = require('config');
const FIFO = require('fifo');
const { nanoid } = require("nanoid");

const connectionIdleTimeoutSec = config.connectionIdleTimeoutSec;

class OffersStorage {
    constructor() {
        this.waitingOffers = new FIFO();
        this.connectionMap = new Map();
    };

    addConnection(offer) {
        const now = new Date().getTime();
        const connection = {offer: offer, ice:[], status: "created", keepalive:now};
        const connectionId = connection.offer.deviceId + nanoid(10);
        this.connectionMap.set(connectionId, connection);
        this.waitingOffers.push(connectionId);
        return connectionId;
    };

    yieldConnection(connectionId) {
        const connection = this.connectionMap.get(connectionId);
        if(connection) {
            connection.status = "timeout";
        }
    }

    dropConnection(connectionId) {
        this.connectionMap.delete(connectionId);
    }

    getWaitingOffer() {
        const connectionId = this.waitingOffers.pop();
        if (!connectionId) {
            return false;
        }
        const now = new Date().getTime();

        const connection = this.connectionMap.get(connectionId);
        if(connection && connection.keepalive + connectionIdleTimeoutSec*1000 >= now ) {
            return connectionId;
        }
        return this.getWaitingOffer();
    };

    getOffer(connectionId) {
        return (this.connectionMap.get(connectionId) && this.connectionMap.get(connectionId).offer);
    }


    saveOfferResponse(connectionId, offerResponse) {
        const connection = this.connectionMap.get(connectionId);
        if(connection && connection.status !== "timeout") {
            connection.offerResponse = offerResponse;
            this.connectionMap.set(connectionId, connection);
            return true;
        }
        return false;
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

    getOfferResponse(connectionId) {
        const connection = this.connectionMap.get(connectionId);
        if(connection) {
            const now = new Date().getTime();
            connection.keepalive = now;
            return connection.offerResponse;
        }
        return false;
    };


    addToQueue(connectionId) {
        this.waitingOffers.push(connectionId);
    }
}

module.exports = new OffersStorage();