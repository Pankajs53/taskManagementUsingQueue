const {
    Worker, isMainThread, parentPort, workerData,
} = require('node:worker_threads');


const redisClient = require("./redisConnect")


const { getAllQueueList } = require("../controller/task")


// Function that spawns a new worker thread
// suppose u want to make n worker thread then we will call this function n times
const workerSolve = (queueName) => {
    console.log("Inside worker solve function", queueName);
    return new Promise((resolve, reject) => {
        const worker = new Worker("./worker.js", {
            workerData: {queueName}
        });

        worker.on('message', resolve);
        worker.on('error', reject);

        worker.on('exit', (code) => {
            if (code !== 0)
                reject(new Error(`Worker stopped with exit code ${code}`));
        });
    });
};


// function to getList of all Queues in remove perform the task within queue
const performQueueTask = async (req, res) => {
    try {
        const allQueueList = await getAllQueueList();
        
        // Filter out the 'waiting-Queue'
        const queueList = allQueueList.filter((queue)=>{
             return queue != "waiting-Queue"
        })
        console.log("GOT ALL QUEUE LIST",queueList)
        for (const queueName of queueList) {
            workerSolve(queueName)
                .then((message) => console.log(message))
                .catch((error) => console.error(error));
        }

    } catch (error) {
        console.log("Error in performQueueTask",error)
    }
}


// suppose u want to make n worker thread then we will call this function n times
const workerSolve2 = (queueName) => {
    console.log("Inside worker 2 solve function", queueName);
    return new Promise((resolve, reject) => {
        const worker = new Worker("./worker2.js", {
            workerData: {queueName}
        });

        worker.on('message', resolve);
        worker.on('error', reject);

        worker.on('exit', (code) => {
            if (code !== 0)
                reject(new Error(`Worker stopped with exit code ${code}`));
        });
    });
};

// create a new task which use waiting-queue and pop task from waiting-queue and push the task in their respective queue
const pushPopWaitingQueue = async() =>{
    try{
        const allQueses = await getAllQueueList();

        const waitingQueue = allQueses.filter((currQueue) =>{
            return currQueue === "waiting-Queue"
        })

        if (waitingQueue.length === 0) {
            console.log("No waiting queue found.");
            return;
        }

        console.log("Here--------------")
        console.log(waitingQueue[0])

        await workerSolve2(waitingQueue[0])

        // console.log("Name of waiting quee is->",waitingQueue[0]);

        // // Get the number of tasks in the waiting queue
        // const waitingQueueLength = await redisClient.llen(waitingQueue[0]);        

        // // loop over the queue
        // for(let i=0; i<waitingQueueLength; i++){
        //     const taskString = await redisClient.lpop(waitingQueue);

        //     console.log(
        //         "Popped -> ", taskString
        //     )
        //     if (!taskString) {
        //         console.log("No more tasks in the waiting queue");
        //         break;
        //     }

        //     const task = JSON.parse(taskString);
        //     const targetQueue = task.queueName;

        //     if(!allQueses.includes(targetQueue)){
        //         console.log(`Target queue ${targetQueue} does not exist`);
        //         continue;
        //     }

        //     console.log("STARTING PUSHING FROM WAIT QUE--------------------------------------------------------------")
        //     // Push the task to its respective queue
        //     await redisClient.lpush(targetQueue, taskString);
        //     console.log(`Task moved to ${targetQueue}`);
        //     console.log("ENDING PUSHING FROM WAIT QUE--------------------------------------------------------------")
        // }


    }catch(error){
        console.log("Error in pushPopWaitingQueue",error)
    }
}




module.exports = {performQueueTask,pushPopWaitingQueue};