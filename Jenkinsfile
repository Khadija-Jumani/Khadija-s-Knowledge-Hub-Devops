pipeline {
    agent any

    environment {
        DOCKER_HUB_USER = 'khadijajumani'
    }

    stages {
        stage('Checkout') {
            steps {
                // This step fetches the code from GitHub
                checkout scm
            }
        }

        stage('Build Image') {
            steps {
                script {
                    echo 'Building Docker Image for validation...'
                    sh 'docker build -t ${DOCKER_HUB_USER}/knowledge-hub:latest .'
                }
            }
        }

        stage('Deploy with Docker Compose') {
            steps {
                script {
                    echo 'Deploying application using Optimized Production Image...'
                    // Using the optimized compose file (Uses pre-built image)
                    sh 'docker-compose -f docker-compose.jenkins.yml up -d --remove-orphans'
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline execution finished.'
        }
        success {
            echo 'Deployment successful! App running on port 3001.'
        }
        failure {
            echo 'Deployment failed. Please check logs.'
        }
    }
}
