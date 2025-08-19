# ML exercise counter and DJ

A web tool that uses ML libraries to track exercise execution and apply audio filter during reps.

## Goal

Allow audio processing and rep count based on different types of exercises and their rate of execution.

## Usage

Hit "Start" to play sound and curl your indicator finger to mix the music with a cutoff audio filter.

## Installation

1. Clone this repo

2. Create a .env file or copy from .env.example ```cp .env.example .env```

3. Run the app (default port is 3000) ```npm install && npm run dev```

4. Open your browser at http://localhost:3000

## Roadmap

* Demo (finger curl) - DONE
* Boxing - TODO
* Deadlift - TODO
* Other exercises...

## Tech

* Node.js
* Express.js
* Javascript
* HTML
* CSS
* Coolify (PaaS)

## Libraries

* @mediapipe/tasks-vision (ML)
* cors
* dotenv
* express
* nodemon
