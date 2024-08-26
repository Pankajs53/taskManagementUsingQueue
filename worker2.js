const {
    Worker, isMainThread, parentPort, workerData,
} = require('node:worker_threads');
const redisClient = require("./utils/redisConnect")
const fs = require('fs');
const path = require('path');


const processWaitingQueue = async () => {
    try {
        
        console.log("PROCESSING WAITING QUEUE WORKER STARTED ---------------------------------------------------------------------")
        const { queueName } = workerData;

        if (!queueName) {
            console.log("No queue name provided.");
            return;
        }

        console.log("Processing queue:", queueName);

        // Get the number of tasks in the waiting queue
        const waitingQueueLength = await redisClient.llen(queueName);

        for (let i = 0; i < waitingQueueLength; i++) {
            const taskString = await redisClient.lpop(queueName);

            console.log("TASK STRING IS ------------------------------->",taskString)

            if (!taskString) {
                console.log("No more tasks in the waiting queue.");
                break;
            }

            const task = JSON.parse(taskString);
            const targetQueue = task.queueName;

            // Push the task to its respective queue
            await redisClient.lpush(targetQueue, taskString);
            console.log(`Task moved to ${targetQueue}`);
            console.log("PROCESSING WAITING QUEUE WORKER END ---------------------------------------------------------------------")
        }

        parentPort.postMessage('Done');
    } catch (error) {
        console.error("Error in worker:", error);
        parentPort.postMessage({ error: error.message });
    }
};


// Worker thread logic
if (!isMainThread) {
    const {queueName} = workerData;

    if (queueName) {
        processWaitingQueue(queueName).then(() => {
            // Notify the main thread when the worker has finished processing
            parentPort.postMessage('Worker processWaitingQueue finished execution');
        });;
    }
}