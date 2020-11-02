const express = require('express');
const router = express.Router();
const bodyParser = require("body-parser");

const { nanoid } = require("nanoid");
const storage = require("./lib/storage");

const port = 9090;

const app = express()
var jsonParser = bodyParser.json()
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ type: 'application/*+json' }))


app.listen(port,  () => {console.log("Started on PORT 57778");} )

//
//   Handle offer 
//
app.post('/connections', jsonParser, function(req,res){
    console.log( "offer Received .. " )

    const offer = req.body;
    const connectionId = offer.deviceId + nanoid(10);
    offer.connectionId = connectionId;

    storage.saveOffer(offer);

    res.send({connectionId:connectionId});
});