'use strict';
const config = require('config');
var log4js = require("log4js");


const log4jsConfig = {
    "appenders" : {
        "storage" : {
            "type": "console", "layout": {
                "type": "pattern", "pattern": "%[%d{ISO8601_WITH_TZ_OFFSET} %p %c -%] %m", "tokens": {}
            }
        }
    },
    "categories": {"default": { "appenders": ["storage"], "level": "info" }}
};

log4js.configure(log4jsConfig, {});
var logger = log4js.getLogger("storage");

const dynamodbApi = require("./dynamodb");
const localdbApi = require("./localdb");

const database = config.database;

class Storage {
    static instance;
    constructor() {
    }

    static getInstance() {
        logger.info("Storage get instance.");
        if (!Storage.instance) {
            Storage.instance = new Storage();
            (async  () => {
                await Storage.instance.init();
            })();
        }
        return Storage.instance.db;
    }

    init() {
        if(database === "dynamodb") {
            this.db = dynamodbApi.getInstance();
        } else {
            //this.db = localdbApi.createInstance();
        }
    }
}

module.exports.getInstance = Storage.getInstance;
