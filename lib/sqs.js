const config = require('config');

const log4js = require("log4js");


const log4jsConfig = {
    "appenders" : {
        "sqs" : {
            "type": "console", "layout": {
                "type": "pattern", "pattern": "%[%d{ISO8601_WITH_TZ_OFFSET} %p %c -%] %m", "tokens": {}
            }
        }
    },
    "categories": {"default": { "appenders": ["sqs"], "level": "info" }}
};

log4js.configure(log4jsConfig, {});
const logger = log4js.getLogger("sqs");

const { SQSClient, CreateQueueCommand, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand} = require("@aws-sdk/client-sqs");

const params = {
    QueueName: "ElyashivTest", //SQS_QUEUE_URL
};

class SqsApi {
    static instance;
    constructor() {
    }
    static getInstance() {
        logger.info("SqsApi get instance.");
        if (!SqsApi.instance) {
            SqsApi.instance = new SqsApi();
            (async  () => {
                await SqsApi.instance.init();
            })();
        }
        return SqsApi.instance;
    }


    async init () {
        const params = {
            QueueName: config.aws.sqs.queueName,
            MessageRetentionPeriod: 60,
            VisibilityTimeout: 60,
            ReceiveMessageWaitTimeSeconds: 20
        };
        try {
            const sqs = new SQSClient(config.aws.sdk.region);
            logger.info("Trying to create/Connect queue " + config.aws.sqs.queueName);
            const data = await sqs.send(new CreateQueueCommand(params));
            logger.info("Got. Queue URL: " + data.QueueUrl);
            this.queueUrl = data.QueueUrl;
        } catch (err) {
            logger.error("Error", err);
        }
    }

    async enqueue(connectionId) {
        const params = {
            QueueUrl: QueueUrl,
            MessageBody: connectionId
        }
        try {
            const data = await sqs.send(new SendMessageCommand(mparams));
            logger.info("Success, message sent. MessageID:", data.MessageId);
            return true;
        } catch (err) {
            logger.info("Error", err);
            throw Error("Sqs send message failed ")
        }
    }

    async dequeue() {
        const receiveParam = {
            AttributeNames: ["SentTimestamp"],
            MaxNumberOfMessages: 1,
            MessageAttributeNames: ["All"],
            QueueUrl: this.queueUrl
        };
        try {
            const data = await sqs.send(new ReceiveMessageCommand(receiveParam));
            if (data.Messages) {
                var deleteParams = {
                    QueueUrl: this.queueUrl,
                    ReceiptHandle: data.Messages[0].ReceiptHandle,
                };
                try {
                    const data = await sqs.send(new DeleteMessageCommand({}));
                } catch (err) {
                    logger.info("Message Deleted", data);
                }
            } else {
                logger.info("No messages to delete");
            }
            return data.Messages[0].body;
        } catch (err) {
            logger.info("Receive Error", err);
            throw Error("Failed to pool for connection id");
        }
    }
}

module.exports.getInstance = SqsApi.getInstance;