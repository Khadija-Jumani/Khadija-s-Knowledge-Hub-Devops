# Khadija's Knowledge Hub - Kubernetes Deployer for Windows PowerShell
$ErrorActionPreference = "Stop"

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "    Khadija's Knowledge Hub - Kubernetes Deployer     " -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Cyan

# Check if minikube is running
Write-Host "`n[1/6] Checking Minikube status..." -ForegroundColor Yellow
$status = minikube status --format '{{.Host}}'
if ($status -ne "Running") {
    Write-Host "Error: Minikube is not running!" -ForegroundColor Red
    Write-Host "Please start minikube first using: minikube start" -ForegroundColor Green
    exit 1
}
Write-Host "✔ Minikube is running." -ForegroundColor Green

# Configure shell to use Minikube's Docker daemon
Write-Host "`n[2/6] Configuring shell to use Minikube's Docker daemon..." -ForegroundColor Yellow
& minikube docker-env | Invoke-Expression
Write-Host "✔ Shell docker-env configured successfully." -ForegroundColor Green

# Build the Web Application Docker image inside Minikube
Write-Host "`n[3/6] Building Web application Docker image..." -ForegroundColor Yellow
docker build -t khadijajumani/knowledge-hub:latest .
Write-Host "✔ Docker image built successfully inside Minikube context." -ForegroundColor Green

# Apply Kubernetes manifests
Write-Host "`n[4/6] Applying Kubernetes manifests from k8s/..." -ForegroundColor Yellow
kubectl apply -f k8s/db-pvc.yaml
kubectl apply -f k8s/db-deployment.yaml
kubectl apply -f k8s/db-service.yaml
kubectl apply -f k8s/web-deployment.yaml
kubectl apply -f k8s/web-service.yaml
kubectl apply -f k8s/hpa.yaml
Write-Host "✔ Manifests applied successfully." -ForegroundColor Green

# Wait for resources to be ready
Write-Host "`n[5/6] Waiting for Web and Database pods to be running..." -ForegroundColor Yellow
Write-Host "Waiting for database deployment..."
kubectl rollout status deployment/db-deployment --timeout=120s
Write-Host "Waiting for web server deployment..."
kubectl rollout status deployment/web-deployment --timeout=120s
Write-Host "✔ All pods are up and running!" -ForegroundColor Green

# Enable Metrics Server if not already enabled (required for HPA)
Write-Host "`n[6/6] Verifying Kubernetes Metrics Server for HPA..." -ForegroundColor Yellow
$addons = minikube addons list
if ($addons -match "metrics-server: disabled") {
    Write-Host "Enabling metrics-server addon..."
    minikube addons enable metrics-server
} else {
    Write-Host "metrics-server is already enabled."
}
Write-Host "✔ Metrics Server verified." -ForegroundColor Green

Write-Host "`n======================================================" -ForegroundColor Cyan
Write-Host "         Deployment Completed Successfully!            " -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "`nTo check the running resources, execute:"
Write-Host "  kubectl get all,pvc,hpa" -ForegroundColor Green
Write-Host "`nTo establish the secure tunnels (open in two separate terminal sessions):"
Write-Host "  1. Web Service Tunnel: minikube service web-service --url" -ForegroundColor Yellow
Write-Host "  2. Minikube Dashboard: minikube dashboard --url" -ForegroundColor Yellow
Write-Host "`nEnjoy your cloud-native application deployment!"
Write-Host "======================================================" -ForegroundColor Cyan
