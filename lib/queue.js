const config = require('config');
const sqsApi = require("./sqs");
const log4js = require("log4js");
const log4jsConfig = {
    "appenders" : {
        "queue" : {
            "type": "console", "layout": {
                "type": "pattern", "pattern": "%[%d{ISO8601_WITH_TZ_OFFSET} %p %c -%] %m", "tokens": {}
            }
        }
    },
    "categories": {"default": { "appenders": ["queue"], "level": "info" }}
};
log4js.configure(log4jsConfig, {});
const logger = log4js.getLogger("queue");

const queue = config.queue;

class Queue {
    static instance;

    constructor() {
    }

    static getInstance() {
        logger.info("Storage get instance.");
        if (!Queue.instance) {
            Queue.instance = new Queue();
            (async () => {
                await Queue.instance.init();
            })();
        }
        return Queue.instance.queue;
    }

    init() {
        if (queue === "sqs") {
            this.queue = sqsApi.getInstance();
        } else {
            //this.db = localdbApi.createInstance();
        }
    }
}

module.exports.getInstance = Queue.getInstance;