# Use the official Node.js 16 image
FROM node:16

# Set the working directory inside the container
WORKDIR "/app"

# Update package lists, upgrade packages, and clean up
RUN apt-get update \
    && apt-get dist-upgrade -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && echo 'Finished installing dependencies'

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code to the working directory
COPY . .

# Set environment variables with default values
ENV NODE_ENV=production
ENV PORT=3000

# Expose the application's port
EXPOSE 3000

# Switch to a non-root user for security
USER node

# Define the default command to start the application
CMD ["npm", "start"]
