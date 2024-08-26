const { json } = require("express");
const { performTask
} = require("../utils/worker-side")

const redisClient = require("../utils/redisConnect")

const MAX_TASKS_PER_MINUTE = 20;
const TIME_WINDOW_SECONDS = 60;
const TASK_INTERVAL_SECONDS = 1; // Time interval between tasks (1 second)


// Utility function to convert ISO date string to seconds
function isoToSeconds(isoDateString) {
    const date = new Date(isoDateString);
    return Math.floor(date.getTime() / 1000);
}


// Function to handle 1-second task limitation
const handle1SecLimitation = async (redisClient, queueName, task) => {
    try {
        // get the time of last task and current time and compare them
        const currTime = new Date().toISOString();
        const currTimeSecond = isoToSeconds(currTime);


        const lastTaskString = await redisClient.lindex(queueName, 0);

        // if no task found 
        let lastTaskTimeSecond = currTimeSecond;

        if (lastTaskString) {
            const lastTask = JSON.parse(lastTaskString)
            console.log("Last task", lastTask)
            const lastTaskTime = lastTask.time;
            lastTaskTimeSecond = isoToSeconds(lastTaskTime)
        }

        const timeGapSeconds = Math.abs(currTimeSecond - lastTaskTimeSecond);
        console.log(timeGapSeconds)
        if (timeGapSeconds <= TASK_INTERVAL_SECONDS) {
            const newTask = {
                task:task,
                time: currTime,
                queueName: queueName
            }

            await redisClient.lpush("waiting-Queue", JSON.stringify(newTask));
            console.log('Task added to the queue');
            return true;
        } else {
            console.log('Task interval exceeded');
            return false;
        }
    } catch (error) {
        console.error('Error handling task limitation per second:', error);
        throw error;
    }
};


// Function to handle the 20 tasks per minute limitation
const handleOneMinute20TaskLimitation = async (redisClient, queueName, task, taskListCount) => {
    try {

        if (taskListCount < MAX_TASKS_PER_MINUTE) {
            return false;
        }

        // get the first task and curr time and compre
        const currTime = new Date().toISOString();
        const currTimeSecond = isoToSeconds(currTime);

        const firstTaskString = await redisClient.lindex(queueName, -1);
        let firstTaskInSecond = currTimeSecond;
        console.log(firstTaskString)

        if (firstTaskString) {
            const firstTask = JSON.parse(firstTaskString);
            const firstTaskTime = firstTask.time;
            console.log(firstTaskTime)
            firstTaskInSecond = isoToSeconds(firstTaskTime)
        }

        // now compare time
        const timeGapInSeconds = Math.abs(currTimeSecond - firstTaskInSecond);
        console.log("Time for 20 task,->", timeGapInSeconds)

        if (taskListCount >= MAX_TASKS_PER_MINUTE && timeGapInSeconds <= 60) {
            const newTask = {
                task:task,
                time: currTime,
                queueName: queueName
            }

            await redisClient.lpush("waiting-Queue", JSON.stringify(newTask));
            console.log('Task added to the queue');
            return true;
        }


        return false;


    } catch (error) {
        console.error('Error handling task limitation Per minute:', error);
        throw error;
    }

};


// Main function to handle queue requests
const handleQueueRequest = async (req, res) => {
    try {
        const { user_id, task } = req.body;

        const queueName = `${user_id}-Queue`;

        const allLists = await getAllQueueList();
        console.log("ALL queue ares", allLists)

        console.log("Queue name is", queueName)

        const taskIs = {
            time: new Date().toISOString(),
            task: task
        };

        const taskListCount = await redisClient.llen(queueName);

        console.log("TASK NO IS -> ", taskListCount)
        if (taskListCount === 0) {
            await redisClient.lpush(queueName, JSON.stringify(taskIs));
            return res.status(200).json({
                success: true,
                message: "Task Created"
            });
        }

        // check if we have more than 1 task per second
        const morethan2TaskPerSecond = await handle1SecLimitation(redisClient, queueName, task);
        if (morethan2TaskPerSecond) {
            // it means than more than 1 task was received in 1 second
            return res.status(403).json({
                success: false,
                message: "Cannot make two task within 1 second. Added the task in common queue. For Later execution"
            })
        }


        // check if there are more 20 task within one  minute
        const morethan20TaskPerMinute = await handleOneMinute20TaskLimitation(redisClient, queueName, task, taskListCount);
        if (morethan20TaskPerMinute) {
            // it means than more than 1 task was received in 1 second
            return res.status(403).json({
                success: false,
                message: "Cannot make more than 20 task per minute. Added the task in common queue. For Later execution"
            })
        }

        await redisClient.lpush(queueName, JSON.stringify(taskIs));

        return res.status(200).json({
            success: true,
            message: `Created Task ${task} for ${user_id}`
        });

    } catch (error) {
        console.error("Error in handleQueueRequest:", error);
        return res.status(500).json({
            success: false,
            message: "Server error in handling the queue request"
        });
    }
};

// function to check all the task of queue
const getAllTasks = async (req, res) => {
    try {

        const { queueName } = req.body;
        // Retrieve all tasks from the Redis list
        const tasks = await redisClient.lrange(queueName, 0, -1);
        const processedTasks = [];
        console.log(tasks)
        for (const taskString of tasks) {
            try {
                // Parse the task from JSON
                const task = JSON.parse(taskString);
                console.log("Task:", task);

                // Optionally, process each task here
                // For example, converting the task timestamp to seconds
                if (task.time) {
                    const taskTimeInSeconds = isoToSeconds(task.time);
                    console.log("Task time in seconds:", taskTimeInSeconds);
                }

                processedTasks.push(task);
            } catch (parseError) {
                console.error('Error parsing task JSON:', parseError);
                // Handle JSON parsing error (e.g., log it, continue processing, etc.)
            }
        }

        // Return the processed tasks or perform additional operations
        return res.status(200).json({
            success: true,
            data: processedTasks
        });

    } catch (error) {
        console.error('Error retrieving tasks from Redis:', error);
        throw error;
    }
};

// Function to get the list of all queues (keys) in Redis
const getAllQueueList = async () => {
    try {
        const keys = await redisClient.keys('*Queue');
        // console.log("Keys are  ->",keys)
        // if(keys){
        //     return keys;
        // }else{
        //     return [];
        // }
        return keys;
    } catch (error) {
        console.error("Error in getAllQueueList:", error);
        throw error;
    }
};


module.exports = { handleQueueRequest, getAllTasks,getAllQueueList };
