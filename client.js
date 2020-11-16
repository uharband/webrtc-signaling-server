
const request = require('request');

//const serverUri = "http://rdkucs1.il.nds.com:57778/";
const serverUri = "http://localhost:9090/signaling/1.0/";

function postCandidate(connectionId, params) {

    if (!params.iteration) {
        params.iteration = 1;
        params.timeout = 1000;
    } else {
        params.iteration++;
        params.timeout += 1000;
    }

    if (params.iteration > 10) {
        return;
    }

    var ice = {candidate: params.iteration.toString()};
    request.post(serverUri + 'connections/' + connectionId + '/ice', { json: true ,body:ice}, (err, res, body) => {

        if (res.statusCode !== 201 || err) {
            console.log(err);
            console.log("error while sending candidate");
            setTimeout(postCandidate, 1000, connectionId, params);
        } else {
            console.log("candidate sent will sent new one soon");
            console.log(JSON.stringify(body));
            setTimeout(postCandidate, params.timeout, connectionId, params);
        }
    });
};

function getOfferResponse(connectionId) {
    request.get(serverUri + 'connections/'+ connectionId + '/' + 'answer', (err, res, body) => {
        if (res.statusCode !== 200 || err) {
            console.log(err);
            setTimeout(getOfferResponse, 5000, connectionId);
        } else {
            console.log(JSON.stringify(body));
            //postCandidate(connectionId,  {});
        }

        return;
    });
};


function sendOffer() {
    const sdp ="v=0\r\no=- 5164509177096042454 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=msid-semantic: WMS\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:nFVD\r\na=ice-pwd:u7mXKFTowGoYLH4jZy7MuFWO\r\na=ice-options:trickle\r\na=fingerprint:sha-256 A3:68:64:31:C9:3D:08:86:2E:79:41:4C:C0:56:CB:F0:D3:1C:74:D8:08:30:1E:07:7D:AE:01:A8:A5:36:8A:9B\r\na=setup:actpass\r\na=mid:0\r\na=sctp-port:5000\r\na=max-message-size:262144\n";
    var offer = {type: "offer", sdp: sdp, deviceId: "EZDEVICE1"};
    request.post(serverUri + 'connections', { json: true ,body:offer}, (err, res, body) => {
        if (err) { return console.log(err); }
        console.log(body.connectionId);
        setTimeout(getOfferResponse, 2000, body.connectionId);
        return;
    });
};

sendOffer();