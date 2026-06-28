import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs"
import type {S3Event} from 'aws-lambda'


const client = new SQSClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
const ecsClient = new ECSClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

async function init() {
    const command = new ReceiveMessageCommand({
        QueueUrl: process.env.QUEUE_URL,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 10,
    });

    while (true) {
        const {Messages} = await client.send(command);

        if (!Messages) {
        console.log("No Message in Queue");
        continue;
        }

        try{
            for (const message of Messages) {
                const { MessageId, Body } = message;
                console.log("Message Received", { MessageId, Body });

                if (!Body) continue;

                //validate and parse the event 
                const event = JSON.parse(Body) as S3Event;
                // Ignore the test event
                if ("Service" in event && "Event" in event) {
                    if (event.Event === "s3:TestEvent") {
                        await client.send(new DeleteMessageCommand({
                        QueueUrl: process.env.QUEUE_URL, 
                        ReceiptHandle: message.ReceiptHandle,
                        }))
                        continue;
                    }
                }

                // Spin the docker container
                for (const record of event.Records) {
                    const { s3 } = record;
                    const {  bucket,  object:{key} } = s3;

                    const runTaskCommand = new RunTaskCommand({
                        taskDefinition: process.env.TASK_ARN,
                        cluster: process.env.CLUSTER_ARN,
                        launchType: 'FARGATE',
                        networkConfiguration: {
                            awsvpcConfiguration: {
                                assignPublicIp: "ENABLED",
                                securityGroups: [process.env.SECURITY_GROUP],
                                subnets: [process.env.SUBNET1 , process.env.SUBNET2 , process.env.SUBNET3],
                            },
                        },
                        overrides: {
                            containerOverrides: [
                                {
                                    name: "video-transcoder",
                                    environment: [
                                        { name: 'BUCKET_NAME', value: bucket.name },
                                        { name: 'KEY', value: key },
                                    ]
                                }
                            ]
                        }
                    })
                    await ecsClient.send(runTaskCommand);

                    //delete the message from queue
                    await client.send(new DeleteMessageCommand({
                        QueueUrl: process.env.QUEUE_URL, 
                        ReceiptHandle: message.ReceiptHandle,
                    }))
                }
            }
        }
        catch(err) {
            console.error(err);
        }  
    }
}

init();