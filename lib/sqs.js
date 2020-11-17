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

const { SQSClient,  CreateQueueCommand, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand} = require("@aws-sdk/client-sqs");




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
            Attributes: {
                MessageRetentionPeriod: 60, VisibilityTimeout: 60, ReceiveMessageWaitTimeSeconds: 20
            }
        };
        try {

            // Create SQS service object
            this.sqs = new SQSClient(config.aws.sdk.region);
            logger.info("Trying to create/Connect queue " + config.aws.sqs.queueName);
            const data = await this.sqs.send(new CreateQueueCommand(params));
            logger.info("Got. Queue URL: " + data.QueueUrl);
            this.queueUrl = data.QueueUrl;
        } catch (err) {
            logger.error("Error", err);
            throw {errorCode :503, error: "queue init error: " + err};
        }
    }

    async enqueue(connectionId) {
        const params = {
            QueueUrl: this.queueUrl,
            MessageBody: connectionId
        }
        try {
            const data = await this.sqs.send(new SendMessageCommand(params));
            logger.info("Success, message sent. MessageID:", data.MessageId);
            return true;
        } catch (err) {
            logger.info("Error", err);
            throw {errorCode:500, error: "queue send message failed queue error: " + err};
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
            const data = await this.sqs.send(new ReceiveMessageCommand(receiveParam));
            if (data.Messages) {
                var deleteParams = {
                    QueueUrl: this.queueUrl,
                    ReceiptHandle: data.Messages[0].ReceiptHandle,
                };
                try {
                    const data = await this.sqs.send(new DeleteMessageCommand(deleteParams));
                } catch (err) {
                    logger.info("Message not Deleted", data);
                }
                return data.Messages[0].Body;
            } else {
                logger.info("No messages");
                throw {errorCode: 404, error: "no connections available to serve right now try again later"};
            }

        } catch (err) {
            logger.info("Receive Error", err);
            if(err.errorCode) {
                throw err;
            } else{
                throw {errorCode: 500, error: "queue receive message error: " + err};
            }

        }
    }
}

module.exports.getInstance = SqsApi.getInstance;