
const request = require('request');

//const serverUri = "http://rdkucs1.il.nds.com:57778/";
const serverUri = "http://localhost:9090/";


function getOfferResponse(connectionId) {
    console.log("requesting offer for connection id: " + connectionId)
    request.get(serverUri + 'connections/' + connectionId + '/' + 'offer', (err, res, body) => {
        if (res.statusCode !== 200 || err) {
            console.log(err);
            setTimeout(getOfferResponse, 100, connectionId);
        }
        console.log("Got an offer from signaling server");
        console.log(JSON.stringify(body));
    });
};


function getOffer() {
    console.log("Looking for a new offer")
    request.get(serverUri + 'queue', (err, res, body) => {
        if (res.statusCode !== 200 || err) {setTimeout(getOffer, 10000); return console.log(body); }
        var response = JSON.parse(body)
        console.log("Got a connection id from the signaling server id: " + response.connectionId);
        setTimeout(getOfferResponse, 5000, response.connectionId);
    });
};

getOffer();