//'use strict';
const config = require('config');
var log4js = require("log4js");


const log4jsConfig = {
    "appenders" : {
        "dynamodb" : {
            "type": "console", "layout": {
                "type": "pattern", "pattern": "%[%d{ISO8601_WITH_TZ_OFFSET} %p %c -%] %m", "tokens": {}
            }
        }
    },
    "categories": {"default": { "appenders": ["dynamodb"], "level": "info" }}
};

log4js.configure(log4jsConfig, {});
var logger = log4js.getLogger("dynamodb");

const dynamoose = require("dynamoose");

dynamoose.aws.sdk.config.update({
    region: config.aws.sdk.region
});
//dynamoose.aws.ddb.local("http://localhost:8008");



class DynamodbApi {
    static instance;
    constructor() {}
    async createModel() {
        this.Connections = dynamoose.model(config.aws.dynamodb.tableName, {
            "id": {
                type: String,
                hashKey: true
            },
            "type": {
                type: String
            },
            "deviceId": {
                type: String,
            },
            "offer": String,
            "debugOffer": String,
            "offerResponse": String,
            "debugOfferResponse": String,
            "peerConnectionStatus": String,
            "keepalive": { type: Date},
            "offerGetTime": { type: Date},
            "status": String
        });
    }

    static getInstance() {
        logger.info("dynamodb get instance.");
        if (!DynamodbApi.instance) {
            DynamodbApi.instance = new DynamodbApi();
            (async  () => {
                await DynamodbApi.instance.init();
            })();
        }
        return DynamodbApi.instance;
    }

    async init() {
        await this.createModel();
        await this.createTable();
    }

    async addConnection(connectionId, offer, deviceId, keepalive, status, type) {
        logger.info(keepalive);
        const connection = new this.Connections({"id" : connectionId, "offer": JSON.stringify(offer), "deviceId": deviceId, "keepalive": keepalive, "status": status, "type": type});
        const res = await connection.save();
        logger.info(res);
        logger.info("Save operation was successful.");
        return res;
    }

    async getConnection(connectionId) {
        try{
             const res =  await this.Connections.query("id").eq(connectionId).exec();
             logger.info(res);
             return res[0];
        } catch (error) {
            logger.error(error);
            throw {errorCode: 503, error: "trying to get connection that not exist " + error};
        }
    }

    async createTable() {
        try{
            const res = await this.Connections.table.create.request();
            logger.info(res);
            logger.info( "connection table created " );
        }
        catch (error) {
            logger.error( "connection table creation failed" );
            logger.error(error);
            throw {errorCode: 500, error: "create table failed on: " + error};
        }
    }


    async getCount () {
        const res = await this.Connections.scan().count().exec();
        logger.info(res);
        return res;
    }

    async updateConnection(connectionId, update) {
        logger.info(update);
        logger.info(connectionId);
        try {
            const res = await this.Connections.query("id").eq(connectionId).exec();
            if ((res || []).length === 0 ) {
                throw {errorCode: 500, error: "Trying to update connection that not exist"}
            }
            await this.Connections.update({"id": connectionId}, update);

        } catch (err) {
            if(err.errorCode) {
                throw err;
            } else{
                throw {errorCode: 500, error: "queue receive message error: " + err};
            }
        }


    }

    async getConnectionIdByDeviceId(deviceId, startAt){
        let  res;
        try {
            if(startAt){
                res = await this.Connections.scan("deviceId").eq(deviceId).startAt(startAt).exec();
            } else{
                res = await this.Connections.scan("deviceId").eq(deviceId).exec();
            }

        } catch (err) {
            if(err.errorCode) {
                throw err;
            } else{
                throw {errorCode: 500, error: "error looking for connection with deviceId " + deviceId + ". " + err};
            }
        }
        if ((res || []).length === 0 && res.lastKey === undefined ) {
            throw {errorCode: 503, error: "did not find an existing connection with deviceId " + deviceId}
        } else if ((res || []).length === 0 && res.lastKey !== undefined ){
            return this.getConnectionIdByDeviceId(deviceId, res.lastKey)
        }

        return res[0].id;
    }


}

module.exports.getInstance = DynamodbApi.getInstance;
