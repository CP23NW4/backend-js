# Use a base image with Node.js pre-installed
FROM node:latest

# Create and set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available) to the working directory
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy all files from the current directory to the working directory in the container
COPY . .

# Expose the port your app runs on
EXPOSE 8090

# Command to run your application
CMD ["node", "src/app.js"]
