# ai-rpg
this is a website that lets you experience a real-time table-top RPG either alone, or with up to 4 players, while an AI is controlling the game. it was made using the MERN stack.

## how does it work?
it uses OpenAI's API for both generating the story, and the summary of the story.
first, when the player joins a room, AI is going to generate an initial story (that is randomized) where the player can decide his next steps. after AI receives the user's input, it generates the continuation of the story based on the player's prompt. 
after a specific amount of messages, a summary for long-term memory is going to be made in order to save tokens. the memories are saved in the 1st message after the instructions. the memories save mostly everything thats needed, but it's prompt can be easily tweaked.

## good to know
since the front-end isn't done yet, the site may break on mobile devices.
i might come back to this project later and upgrade it with some new features.

## how to setup
### client side
1. go to the /client folder
2. type npm i
3. start it with npm start
### server side
1. go to the /server folder
2. type npm i
3. setup .env file
4. start the server (nodemon)
### .env template
ORIGIN=http://localhost:3000

PORT=5000

OPENAI_API_KEY=
