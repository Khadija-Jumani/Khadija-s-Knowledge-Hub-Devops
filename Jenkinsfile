pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Deploy (Part II)') {
            steps {
                script {
                    echo 'Deploying with Volume Mapping (As requested by Sir)...'
                    // We stop any old ones first to free up memory
                    sh 'docker-compose -f docker-compose.jenkins.yml down || true'
                    // We start the new one
                    sh 'docker-compose -f docker-compose.jenkins.yml up -d'
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline execution finished.'
        }
    }
}
