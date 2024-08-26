const express = require("express");
const app = express();
const cron = require("node-cron")
const {performQueueTask,pushPopWaitingQueue} = require("./utils/worker-side")

const taskRoutes = require("./routes/user");

require('dotenv').config()
const PORT = process.env.PORT || 5000;
app.use(express.json());


// route
app.use("/api/v1",taskRoutes)


app.listen(PORT,()=>{
    console.log(`Listing on PORT ${PORT}`)
})

app.get("/",(req,res)=>{
    return res.json({
        success:true,
        message:'SERVER AP AND RUNNING...'
    })
})



// Cron job to run every 5 seconds
cron.schedule('*/55 * * * * *', () => {
    console.log('Running a task every 30 seconds');
    performQueueTask();
});


cron.schedule('*/60 * * * * *', () => {
    console.log('Running a task every 40 seconds');
    pushPopWaitingQueue();
});



