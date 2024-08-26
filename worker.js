const {
    Worker, isMainThread, parentPort, workerData,
} = require('node:worker_threads');
const redisClient = require("./utils/redisConnect")
const fs = require('fs');
const path = require('path');


const performTask = async (queueName) => {
    try {

        console.log("PROCESSING TASK QUEUE WORKER STARTED ---------------------------------------------------------------------")
        console.log("Performing task for", queueName);
       
        // Get the length of the queue
        const totalTask = await redisClient.llen(queueName);

        for (let i = 0; i < totalTask; i++) {
            // Process each task
            const currTaskString = await redisClient.lpop(queueName);
            console.log("Curr Task is")

            if (currTaskString) {
                const currTask = JSON.parse(currTaskString);
                console.log("Curr Task is",currTaskString)
                const logMessage = `Performing Task ${currTask.task} at time ${new Date().toISOString()}\n`;
                console.log(logMessage)

                // ADD the log message to info.txt
                fs.appendFileSync(path.join(__dirname, 'taskLogs.txt'), logMessage, 'utf8');

                console.log(logMessage.trim());
            }
        }

        console.log("PROCESSING WAITING QUEUE WORKER ENDED ---------------------------------------------------------------------")
         

    } catch (error) {
        console.error("Error in performTask worker function:", error);
    }
}


// Worker thread logic
if (!isMainThread) {
    const { queueName} = workerData;
        performTask(queueName).then(() => {
            // Notify the main thread when the worker has finished processing
            parentPort.postMessage('Worker finished execution');
        });
}