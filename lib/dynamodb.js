//'use strict';

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
    accessKeyId: 'AKID',
    secretAccessKey: 'SECRET',
    region: 'us-east-1'
});
dynamoose.aws.ddb.local("http://localhost:8008");



class DynamodbApi {
    static instance;
    constructor() {}
    async createModel() {
        this.Connections = dynamoose.model("connections", {
            "id": {
                type: String,
                hashKey: true
            }, "deviceId": {
                type: String,
            },
            "offer": String,
            "offerResponse": String,
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

    async addConnection(connectionId, offer, deviceId, keepalive, status) {
        logger.info(keepalive);
        const connection = new this.Connections({"id" : connectionId, "offer": JSON.stringify(offer), "deviceId": deviceId, "keepalive": keepalive, "status": status});
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
            throw new Error("Connection not Exist in Db");
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
        }
    }


    async getCount () {
        const res = await this.Connections.scan().count().exec();
        logger.info(res);
        return res;
    }

    async updateConnection(connectionId, update) {
        logger.info(update);
        try {
            const res = await this.Connections.update({"id": connectionId}, update);
            logger.info(res);
            return res;
        } catch (err) {
            logger.error (err);
            //throw Error("Connection update failed");
        }


    }


}

module.exports.getInstance = DynamodbApi.getInstance;