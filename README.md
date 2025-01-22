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
1. Run following command
    ```
    docker compose up --build
    ```

Set .env file
1. Run ```node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"``` to random token for `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET`

The server will run on ```localhost:3000```
  
## To stop the container
1. Run following command
    ```
    docker-compose down
    ```

### To clear disk
1. Run ```docker system prune --all``` to clear everything.