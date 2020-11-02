
var FIFO = require('fifo');

class OffersStorage {
    constructor() {
        this.waitingOffes = new FIFO();
        this.offerResponseMap = new Map();

    };

    saveOffer(offer) {
        this.waitingOffes.push(offer)
    };

    getWaitingOffer() {
        return this.waitingOffes.pop();
    };

    saveOfferResponse(connectionId, offerResponse) {
        this.offerResponseMap[connectionId] = offerResponse;
    };

    getOfferResponse(connectionId) {
        return (this.offerResponseMap.get(connectionId));
    };
}

module.exports = new OffersStorage()