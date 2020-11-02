
const request = require('request');

//const getOfferUri = "http://rdkucs1.il.nds.com:57778/connections";
const serverUri = "http://localhost:9090/";


function getOfferResponse(connectionId) {
    console.log(connectionId)
    request.get(serverUri + 'connections/' + connectionId + '/' + 'offer', (err, res, body) => {
        if (res.statusCode !== 200 || err) {
            console.log(err);
            setTimeout(getOfferResponse, 100, connectionId);
        }
        console.log(JSON.stringify(body));
    });
};


function getOffer() {
    request.get(serverUri + 'queue', (err, res, body) => {
        if (err) { return console.log(err); }
        var response = JSON.parse(body)
        console.log(response.connectionId);
        setTimeout(getOfferResponse, 5000, response.connectionId);
    });
};

getOffer();