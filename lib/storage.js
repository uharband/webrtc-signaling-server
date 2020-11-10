
const FIFO = require('fifo');
const { nanoid } = require("nanoid");

class OffersStorage {
    constructor() {
        this.waitingOffers = new FIFO();
        this.connectionMap = new Map();
    };

    addConnection(offer) {
        const connection = {offer: offer, ice:[]};
        const connectionId = connection.offer.deviceId + nanoid(10);
        this.connectionMap.set(connectionId, connection);
        this.waitingOffers.push(connectionId);
        return connectionId;
    };

    getWaitingOffer() {
        return this.waitingOffers.pop();
    };

    getOffer(connectionId) {
        return (this.connectionMap.get(connectionId) && this.connectionMap.get(connectionId).offer);
    }


    saveOfferResponse(connectionId, offerResponse) {
        const connection = this.connectionMap.get(connectionId);
        if(connection) {
            connection.offerResponse = offerResponse;
            this.connectionMap.set(connectionId, connection);
            return true;
        }
        return false;
    };

    addCandidate(connectionId, ice) {
        const connection = this.connectionMap.get(connectionId);
        if(connection) {
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
        return (this.connectionMap.get(connectionId) && this.connectionMap.get(connectionId).offerResponse);
    };


    addToQueue(connectionId) {
        this.waitingOffers.push(connectionId);
    }
}

module.exports = new OffersStorage();