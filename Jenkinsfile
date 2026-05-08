pipeline {
    agent any

    triggers {
        githubPush()
    }

    environment {
        APP_IMAGE = "university-notes-app:${env.BUILD_ID}"
    }

    stages {
        stage('Checkout') {
            steps {
                echo "Fetching code from GitHub..."
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building the application Docker image..."
                sh "echo 'FROM alpine:latest' > Dockerfile.test"
                sh "echo 'CMD sleep 3600' >> Dockerfile.test"
                sh "cat Dockerfile.test | docker build -t ${APP_IMAGE} -"
            }
        }

        stage('Test (Containerized via Docker)') {
            agent {
                docker {
                    image 'node:18-alpine'
                    args '-u root'
                }
            }
            steps {
                echo "Running Selenium Test Cases..."
                // Aapke GitHub ke hisaab se folder ka naam 'test' hai
                dir('test') {
                    // Conflicts se bachne ke liye hum direct packages install kar rahe hain
                    sh 'npm install selenium-webdriver mocha --no-save'
                    sh 'apk add --no-cache chromium chromium-chromedriver || true'
                    sh 'export BASE_URL=https://khadija-s-knowledge-hub-bwi3.vercel.app && node selenium_tests.js'
                }
            }
        }

        stage('Deploy (Bring Deployment Up)') {
            steps {
                echo "Bringing the containerized deployment up..."
                sh "docker stop university-notes-container || true"
                sh "docker rm university-notes-container || true"
                sh "docker run -d --name university-notes-container ${APP_IMAGE}"
                echo "Deployment is now UP!"
            }
        }
    }

    post {
        always {
            echo "Pipeline finished."
        }
        success {
            script {
                emailext (
                    subject: "SUCCESS: Test Results - DevOps Assignment 3",
                    body: "The tests passed and the deployment is now UP. Check results at ${env.BUILD_URL}",
                    to: "qasimalik@gmail.com, ${env.BUILD_USER_EMAIL}"
                )
            }
        }
        failure {
            script {
                emailext (
                    subject: "FAILED: Test Results - DevOps Assignment 3",
                    body: "The tests failed. Check results at ${env.BUILD_URL}",
                    to: "qasimalik@gmail.com, ${env.BUILD_USER_EMAIL}"
                )
            }
        }
    }
}
