'use strict';

var log4js = require("log4js");


const log4jsConfig = {
    "appenders" : {
        "localdb" : {
            "type": "console", "layout": {
                "type": "pattern", "pattern": "%[%d{ISO8601_WITH_TZ_OFFSET} %p %c -%] %m", "tokens": {}
            }
        }
    },
    "categories": {"default": { "appenders": ["localdb"], "level": "info" }}
};

log4js.configure(log4jsConfig, {});
var logger = log4js.getLogger("localdb");

class LocalDb {
    constructor() {

    }

    async addConnection(connectionId, deviceId, offer, keepalive, status) {

    }

    async getConnection(connectionId) {

    }

}