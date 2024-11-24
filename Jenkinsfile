pipeline {
    agent any

    environment {
        GCP_PROJECT_ID = 'gamehub-gcp'
        GCP_SERVICE_ACCOUNT_KEY = credentials('gcloud-creds')
        IMAGE_NAME = "gcr.io/${GCP_PROJECT_ID}/gamehub:${BUILD_ID}"
        CLOUD_RUN_SERVICE = 'gamehub-back' 
        REGION = 'us-central1' 
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Authenticate') {
            steps {
                sh '''
                    gcloud auth activate-service-account --key-file=$GCP_SERVICE_ACCOUNT_KEY
                    gcloud config set project $GCP_PROJECT_ID
                    gcloud config set compute/region $REGION
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    dockerImage = docker.build("$IMAGE_NAME")
                }
            }
        }

        stage('Push to Container Registry') {
            steps {
                sh '''
                    gcloud auth configure-docker
                    docker push $IMAGE_NAME
                '''
            }
        }

        stage('Deploy to Cloud Run') {
            steps {
                sh '''
                    gcloud run deploy $CLOUD_RUN_SERVICE \
                    --image $IMAGE_NAME \
                    --region $REGION \
                    --platform managed \
                    --allow-unauthenticated
                '''
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}