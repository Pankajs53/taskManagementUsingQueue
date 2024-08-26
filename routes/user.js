const express  = require("express");

const router = express.Router();

const {handleQueueRequest,getAllTasks}  = require("../controller/task")


router.post("/task",handleQueueRequest);

router.post("/getData",getAllTasks);

module.exports= router;