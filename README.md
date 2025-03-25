# InSpectra-Backend
Backend for InSpectra

# What is InSpectra
InSpectra is an AI-driven Web Application designed for efficient and accurate damage detection in 3D models of infrastructure. By leveraging advancements in integrated deep learning technologies, the system addresses the challenges of inspecting large-scale structures.

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