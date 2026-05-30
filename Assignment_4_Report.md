# COMSATS UNIVERSITY ISLAMABAD
### Department of Computer Science
**Course:** DevOps for Cloud Computing (Spring 2026)  
**Assignment - 4:** Deploying Web Application over Kubernetes Cluster  
**Marks:** 10  

---

## 👤 Student Metadata
* **Student Name:** [Your Name Here]
* **Registration Number:** [Your Reg ID Here (e.g., CIIT/FA20-BCS-000/ISB)]
* **Class Section:** BCS-7 / BDS-7 / BAI-6 (Select one)
* **Instructor Name:** Qasim Malik

---

## 🌐 Tunnel URLs (For Form Submission)
Provide your active secure tunnel URLs generated in your evaluation environment here:
* **Web Application URL:** `http://localhost:3000` (or your Ngrok / EC2 public IP link)
* **Kubernetes Dashboard URL:** `http://localhost:8001` (or your Ngrok / EC2 public IP link)

---

## 1. Application Overview

For this assignment, a lightweight, premium single-page version of **Khadija's Knowledge Hub** was created. The application consists of:
1. **Frontend (User Interface)**: Built using HTML5, CSS3, and JavaScript, designed with a modern dark-theme glassmorphism style. It displays real-time connection status to MongoDB, the active pod hostname (which reveals load balancing in action when scaled), uptime, and a dynamic notes repository interface.
2. **Backend Server**: Built using Node.js and Express. It connects to MongoDB, serves API endpoints to fetch, add, or delete resources, and polls connection health.
3. **Database Server**: A MongoDB instance that acts as the backend storage server for the web application notes.

---

## 2. Technical Architecture & Component Details

The deployment configuration uses a modular, cloud-native architecture on a Minikube cluster:
- **Persistent Volume Claim (PVC)**: Claims 1Gi storage to keep MongoDB data persistent across pod restarts.
- **NodePort Services**: Both the web application and the database server are exposed using NodePort services, enabling direct communication within and outside the cluster.
- **Autoscaler (HPA)**: A Horizontal Pod Autoscaler is deployed to automatically monitor CPU utilization of the web server and scale replicas from 1 to 5 dynamically.

---

## 3. Docker Image & Configuration

### Dockerfile
This file is optimized using a lightweight Node.js Alpine base image, minimizing the container attack surface and memory usage.

```dockerfile
# Use lightweight official Node alpine image
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy dependency manifests
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy application source code and public assets
COPY server.js ./
COPY public/ ./public/

# Expose the application port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the Node.js web server
CMD ["node", "server.js"]
```

---

## 4. Kubernetes Manifests

### A. Database Storage Claim (`db-pvc.yaml`)
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: db-pvc
  labels:
    app: database
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
```

### B. Database Deployment (`db-deployment.yaml`)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: db-deployment
  labels:
    app: database
spec:
  replicas: 1
  selector:
    matchLabels:
      app: database
  template:
    metadata:
      labels:
        app: database
    spec:
      containers:
        - name: mongodb
          image: mongo:6.0
          ports:
            - containerPort: 27017
              name: mongodb
          volumeMounts:
            - name: db-storage
              mountPath: /data/db
      volumes:
        - name: db-storage
          persistentVolumeClaim:
            claimName: db-pvc
```

### C. Database Service (`db-service.yaml`)
```yaml
apiVersion: v1
kind: Service
metadata:
  name: db-service
  labels:
    app: database
spec:
  type: NodePort
  ports:
    - port: 27017
      targetPort: 27017
      nodePort: 32017
  selector:
    app: database
```

### D. Web Deployment (`web-deployment.yaml`)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-deployment
  labels:
    app: web
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web-server
          image: khadijajumani/knowledge-hub:latest
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 3000
              name: http
          env:
            - name: MONGO_URI
              value: "mongodb://db-service:27017/knowledgehub"
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "200m"
              memory: "256Mi"
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 10
```

### E. Web Service (`web-service.yaml`)
```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-service
  labels:
    app: web
spec:
  type: NodePort
  ports:
    - port: 3000
      targetPort: 3000
      nodePort: 30080
  selector:
    app: web
```

### F. Horizontal Pod Autoscaler (`hpa.yaml`)
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-hpa
  labels:
    app: web
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-deployment
  minReplicas: 1
  maxReplicas: 5
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 50
```

---

## 5. Deployment Steps & Screenshots

Follow these exact steps to run and test the application on your AWS EC2 instance. Insert your screenshots in the boxes provided.

### Step 1: Starting Minikube
Verify that minikube starts successfully on your EC2 instance.
```bash
minikube start --driver=docker
```
> **[📷 PLACE SCREENSHOT: MINIKUBE RUNNING]**  
> *(Show terminal output of `minikube start` or `minikube status` showing all components running)*

---

### Step 2: Building and Packaging the Application Image
Configure your environment to compile the image directly inside Minikube's Docker daemon.
```bash
eval $(minikube docker-env)
docker build -t khadijajumani/knowledge-hub:latest .
```
> **[📷 PLACE SCREENSHOT: DOCKER IMAGE BUILD]**  
> *(Show terminal output of `docker build -t...` compiling the node-alpine base image)*

---

### Step 3: Applying Manifests to the Cluster
Deploy storage claims, database configs, node ports, and the autoscaler.
```bash
kubectl apply -f k8s/
```
> **[📷 PLACE SCREENSHOT: KUBECTL APPLY OUTPUT]**  
> *(Show the output lines indicating created pvc, deployments, services, and hpa)*

---

### Step 4: Verifying Deployments and PVC Mounting
Ensure all pods are in `Running` status, services are bound to the NodePorts, and the PVC is successfully bound.
```bash
kubectl get all,pvc,hpa
```
> **[📷 PLACE SCREENSHOT: KUBECTL STATUSES]**  
> *(Show output of `kubectl get all,pvc,hpa` confirming running pods, active services, PVC bound status, and HPA targets)*

---

### Step 5: Establishing Tunnels and Exposing Services
Launch secure service tunnels from Minikube (run these in separate terminal tabs).
```bash
# Tunnel 1: Expose Web App
minikube service web-service --url

# Tunnel 2: Expose Dashboard
minikube dashboard --url
```
Use SSH local port forwarding from your local computer to access these tunnels externally:
```bash
# On your local machine:
ssh -i key.pem -N -L 3000:localhost:30080 ubuntu@EC2-IP
ssh -i key.pem -N -L 8001:localhost:DASHBOARD_PORT ubuntu@EC2-IP
```
> **[📷 PLACE SCREENSHOT: ACTIVE TUNNELS IN TERMINAL]**  
> *(Show terminal instances holding active tunnel sessions)*

---

### Step 6: Verifying Web Application & Database Integration
Open `http://localhost:3000` (or your public IP address) to verify that the frontend displays the connection to MongoDB, the Pod name, and successfully saves notes.
> **[📷 PLACE SCREENSHOT: RUNNING WEB APPLICATION]**  
> *(Show the Knowledge Hub web dashboard with active database connection, uptime counter, and sample DevOps notes created in the DB)*

---

### Step 7: Verifying Minikube Dashboard
Open `http://localhost:8001` (or your dashboard tunnel URL) to inspect the Kubernetes cluster status.
> **[📷 PLACE SCREENSHOT: MINIKUBE DASHBOARD]**  
> *(Show the Minikube Dashboard displaying web-deployment, db-deployment, and replica sets)*

---

### Step 8: Simulating Load & Verifying HPA Autoscaling
1. Monitor HPA scaling:
   ```bash
   kubectl get hpa -w
   ```
2. Generate traffic from a load pod:
   ```bash
   kubectl run -i --tty load-generator --rm --image=busybox:1.28 --restart=Never -- /bin/sh -c "while true; do wget -q -O- http://web-service:3000/api/health; done"
   ```
3. Observe the web application pods scaling up.
> **[📷 PLACE SCREENSHOT: HPA AUTOSCALING ACTION]**  
> *(Show the command line output or dashboard screenshot proving the replicas scaling from 1 to 5 under load)*
