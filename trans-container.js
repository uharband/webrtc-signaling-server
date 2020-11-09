
const request = require('request');

//const serverUri = "http://rdkucs1.il.nds.com:57778/";
const serverUri = "http://localhost:9090/";


function getOffer(connectionId) {
    console.log("requesting offer for connection id: " + connectionId)
    request.get(serverUri + 'connections/' + connectionId + '/' + 'offer', (err, res, body) => {
        if (res.statusCode !== 200 || err) {
            console.log(err);
            setTimeout(getOfferResponse, 2000, connectionId);
        }
        console.log("Got an offer from signaling server");
        console.log(JSON.stringify(body));

        sendOfferResponse(connectionId)
    });
};

function sendOfferResponse(connectionId) {
    const sdp ="v=0\r\no=- 5259690038522163586 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=msid-semantic: WMS\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\nc=IN IP4 0.0.0.0\r\nb=AS:30\r\na=ice-ufrag:sZ/d\r\na=ice-pwd:Dv79CJ5M1YutC8olkrbL1lMi\r\na=ice-options:trickle\r\na=fingerprint:sha-256 E8:0D:1B:4F:2B:DF:EB:55:A4:E7:8C:8B:9A:51:1A:FA:8A:5A:6C:71:46:22:67:66:42:F6:88:4A:82:A9:A2:E6\r\na=setup:active\r\na=mid:0\r\na=sctp-port:5000\r\na=max-message-size:262144\r\n";
    var offer = {type: "answer", sdp: sdp};
    request.post(serverUri + 'connections/' + connectionId + '/' + 'answer', { json: true ,body:offer}, (err, res, body) => {
        if (err) { setTimeout(getConnection, 5000, connectionId);return console.log(err); }
        console.log(connectionId);
    });
};


function getConnection() {
    console.log("Looking for a connection to serve")
    request.get(serverUri + 'queue', (err, res, body) => {
        if (res.statusCode !== 200 || err) {setTimeout(getOffer, 10000); return console.log(body); }
        var response = JSON.parse(body)
        console.log("Got a connection id from the signaling server id: " + response.connectionId);
        setTimeout(getOffer, 5000, response.connectionId);
    });
};

getConnection();