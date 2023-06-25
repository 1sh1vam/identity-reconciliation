# Use an official Node.js runtime as the base image
FROM node:16

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the app source code
COPY . .

# Expose the ports for both MySQL and the Node.js server
EXPOSE 3306 3000

# Install and configure MySQL
RUN apt-get update && apt-get install -y default-mysql-server
RUN service mysql start && mysql -u root -e "CREATE DATABASE bite_speed"

# Start MySQL and the Node.js server
CMD service mysql start && mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'root@123';" && npm start