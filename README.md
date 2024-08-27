# Task Management System

## Overview

This project is a task management system designed to handle and process tasks for multiple users. Each user has their own queue, and tasks are processed in a First-In-First-Out (FIFO) order within these queues. The system is capable of handling high volumes of tasks and incorporates various mechanisms to ensure smooth operation:

- **Task Queuing**: Tasks are assigned to user-specific queues. If a client submits more than one request per second, or if there are more than 20 tasks in 60 seconds, the excess tasks are placed in a waiting queue.
- **Task Processing**: Tasks are processed by a cron job that runs every minute. Each queue is managed by worker threads to ensure that task processing does not affect the main thread.
- **Queue Management**: Another cron job is responsible for moving tasks from the waiting queue to their respective user queues.

## Setup

### Docker

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd <repository-directory>

2. **Build and Run the Project**:
   ```bash
   docker-compose up --build

## Kubernetes
The Kubernetes setup includes two ReplicaSets to ensure high availability and scalability of the application.
Deployment Configuration: This file defines the deployment and the number of replicas to ensure the application is running with the desired number of instances.
Service Configuration: This file exposes the application to the outside world by defining a Kubernetes Service.

## Testing

To test the task management system, use Postman or any other API client to make requests to the following endpoint:

  API ENDPOINTS:
```bash
  POST http://localhost:3000/api/v1/task

REQUEST BODY:
```bash
  {
    "user_id": "user1",
    "task": "go to gym"
}  


## Logs
Check the taskLogs.txt file to view the logs of processed tasks.

## Environment Variables

The environment variables are provided explicitly in an .env file. Note that this file does not contain sensitive data.


