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
                    echo 'Deploying application using Docker Compose (Part II)...'
                    // We use the volume-based compose file for Part II
                    sh 'docker-compose -f docker-compose.jenkins.yml up -d'
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
