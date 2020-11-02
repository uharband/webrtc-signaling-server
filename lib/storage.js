
const FIFO = require('fifo');


class OffersStorage {
    constructor() {
        this.waitingOffers = new FIFO();
        this.connectionMap = new Map();
    };

    addConnection(connection, connectionId) {
        this.connectionMap.set(connectionId, connection);
        this.waitingOffers.push(connectionId);
    };

    getWaitingOffer() {
        return this.waitingOffers.pop();
    };

    getOffer(connectionId) {
        return (this.connectionMap.get(connectionId) && this.connectionMap.get(connectionId).offer);
    }

    saveOfferResponse(connectionId, offerResponse) {
        this.offerResponseMap[connectionId].offerResponse = offerResponse;
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