This is a webrtc signaling server for the hyperscale ptoject

To use :

checkout this repo

Then:

install the NPM modules

```npm install

Then run the server

```node server.js

Then run the client

```node client.js




You should see the clients negotiate and connect.




What's happening :

(1) Server Starts and waits for incoming json on :
- '/setup' : requires an offer, responds with an answer
- '/ice'   : ice candidates for a connection being negotiated
- '/health' : doesn't do anything yet

(2) Client starts and :
- creates an offer, which it passes to server on '/setup'
- receives an answer json, which it sets to be the remote session entity

(3) Client starts to determine ice candidates
- passed to server on /ice
- server negotiates and connects to client

Right now- no video flows because I cannot get the server to create a MediaTrack object.

Effectively https://github-chf01.synamedia.com/hyperscale/web-rtc-server, is an attempt to do the same a server.js but in C, using gstremer with a real source
