# Remove the container if there is already a container with name identity-reconciliation-contaier
docker rm identity-reconciliation-contaier

# Build the image identity-reconciliation
docker build -t identity-reconciliation .

# Run the container
docker run -it -p 3307:3306 -p 3000:3000 --name identity-reconciliation-contaier  identity-reconciliation