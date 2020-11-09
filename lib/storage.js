
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

    setConnectionIceCandidate(connectionId, ice) {
        const connection = this.connectionMap.get(connectionId);
        if(connection) {
            conection.ice.push(({state:"new", content: ice}));
            this.connectionMap.set(connectionId, connection);
            return true;
        }
        return false;
    };

    getConnectionIceCandidate(connectionId) {
        const connection = this.connectionMap.get(connectionId);
        if(connection) {
            const ice = connection.ice;
        }


    };

    getOfferResponse(connectionId) {
        return (this.connectionMap.get(connectionId) && this.connectionMap.get(connectionId).offerResponse);
    };

    handleOfferProcessingTimeout(offer){
        this.saveOffer(offer);
    }

    addToQueue(connectionId) {
        this.waitingOffers.push(connectionId);
    }
}

module.exports = new OffersStorage();