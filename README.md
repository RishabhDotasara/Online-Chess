# Online Chess Game

## Overview
This project is an online chess game that includes real-time multiplayer gameplay and a queue-based matchmaking system. The game is built using Next.js, Socket.IO, Firebase, and Redis for efficient real-time experiences.

The project is fully containerized using Docker, making it easy to set up and run locally with Docker Compose.

## Features
- **Real-time multiplayer chess:** Play live matches against other players.
- **Queue-based matchmaking system:** Players are matched based on a queue, ensuring fair matchups. No rank based matchmaking is introduced yet.

## Prerequisites
- Docker: [Install Docker](https://docs.docker.com/get-docker/)
- Docker Compose: [Install Docker Compose](https://docs.docker.com/compose/install/)

## Setup

### Using Docker Compose (Recommended)
1. Clone this repository:
   ```bash
   git clone https://github.com/RishabhDotasara/Online-Chess.git

2. Navigate to the project directory
   ```bash
   cd Online-Chess

3. Use Docker Compose to build and run the services
   ```bash
   docker-compose up --build

### Using Image from DockerHub

1. Pull the Image
   ```bash
   docker pull rishabhdotasara/online-chess

2. Run the services
   ```bash
   docker-compose up -d


### Access the Application locally

   Go to http://localhost:3000 to see the app running.
