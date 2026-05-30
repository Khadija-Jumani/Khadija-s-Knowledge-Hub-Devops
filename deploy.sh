#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Color codes for output
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}======================================================${NC}"
echo -e "${GREEN}    Khadija's Knowledge Hub - Kubernetes Deployer     ${NC}"
echo -e "${CYAN}======================================================${NC}"

# Check if minikube is running
echo -e "\n${YELLOW}[1/6] Checking Minikube status...${NC}"
if ! minikube status &>/dev/null; then
    echo -e "${RED}Error: Minikube is not running!${NC}"
    echo -e "Please start minikube first using: ${GREEN}minikube start --driver=docker${NC}"
    exit 1
fi
echo -e "${GREEN}✔ Minikube is running.${NC}"

# Configure shell to use Minikube's Docker daemon
echo -e "\n${YELLOW}[2/6] Configuring shell to use Minikube's Docker daemon...${NC}"
eval $(minikube docker-env)
echo -e "${GREEN}✔ Shell docker-env configured successfully.${NC}"

# Build the Web Application Docker image inside Minikube
echo -e "\n${YELLOW}[3/6] Building Web application Docker image...${NC}"
docker build -t khadijajumani/knowledge-hub:latest .
echo -e "${GREEN}✔ Docker image built successfully inside Minikube context.${NC}"

# Apply Kubernetes manifests
echo -e "\n${YELLOW}[4/6] Applying Kubernetes manifests from k8s/...${NC}"
kubectl apply -f k8s/db-pvc.yaml
kubectl apply -f k8s/db-deployment.yaml
kubectl apply -f k8s/db-service.yaml
kubectl apply -f k8s/web-deployment.yaml
kubectl apply -f k8s/web-service.yaml
kubectl apply -f k8s/hpa.yaml
echo -e "${GREEN}✔ Manifests applied successfully.${NC}"

# Wait for resources to be ready
echo -e "\n${YELLOW}[5/6] Waiting for Web and Database pods to be running...${NC}"
echo "Waiting for database deployment..."
kubectl rollout status deployment/db-deployment --timeout=120s
echo "Waiting for web server deployment..."
kubectl rollout status deployment/web-deployment --timeout=120s
echo -e "${GREEN}✔ All pods are up and running!${NC}"

# Enable Metrics Server if not already enabled (required for HPA)
echo -e "\n${YELLOW}[6/6] Verifying Kubernetes Metrics Server for HPA...${NC}"
if minikube addons list | grep -q "metrics-server: disabled"; then
    echo "Enabling metrics-server addon..."
    minikube addons enable metrics-server
else
    echo "metrics-server is already enabled."
fi
echo -e "${GREEN}✔ Metrics Server verified.${NC}"

echo -e "\n${CYAN}======================================================${NC}"
echo -e "${GREEN}         Deployment Completed Successfully!            ${NC}"
echo -e "${CYAN}======================================================${NC}"
echo -e "\nTo check the running resources, execute:"
echo -e "  ${GREEN}kubectl get all,pvc,hpa${NC}"
echo -e "\nTo establish the secure tunnels (open in two separate terminal sessions):"
echo -e "  1. Web Service Tunnel: ${YELLOW}minikube service web-service --url${NC}"
echo -e "  2. Minikube Dashboard: ${YELLOW}minikube dashboard --url${NC}"
echo -e "\nEnjoy your cloud-native application deployment!"
echo -e "${CYAN}======================================================${NC}"
