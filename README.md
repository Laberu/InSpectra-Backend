# InSpectra-Backend
Backend for InSpectra

# What is InSpectra
InSpectra is a tool developed to simplify the process of object detection in videos, making it accessible to a wider audience. 
It aims to address the challenges users face in identifying and tracking objects within videos, offering a user-friendly solution with robust detection capabilities.

## To set up this project.
Run as locally
1. Run ``` npm install ``` to download dependencies of this project.
2. Run ```npm start``` to start applocation

Run as Container
1. Run ```docker build -t inspectra:prod .``` to build images for docker.
2. Run ```docker run -p 3000:3000 inspectra:prod``` to run the container.

Set .env file
1. Run ```node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"``` to random token for `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET`

### dev mode
1. ```npm run dev```
or 
1. Run ```docker build -t inspectra:dev -f Dockerfile.dev .``` to build images for docker.
2. Run ```docker run -p 3000:3000 -v $(pwd):/usr/src/app inspectra:dev``` to run the container.

### debug mode
1. ```npm run debug```
or
1. Run ```docker build -t inspectra:debug -f Dockerfile.dev .``` to build images for docker.
2.Run ```docker run -p 3000:3000 -p 9229:9229 -v $(pwd):/usr/src/app inspectra:debug``` to run the container.

The server will run on ```localhost:3000```
  
## To stop the container
1. Run ```docker ps``` to check container status.
2. Run ```docker stop <CONTAINER ID>``` with CONTAINER ID you need to stop.
3. Run ```docker rm <CONTAINER ID>``` to remove your container.

### To clear disk
1. Run ```docker system prune --all``` to clear everything.