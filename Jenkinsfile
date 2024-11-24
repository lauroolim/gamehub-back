pipeline {
    agent any

    environment {
        GCP_PROJECT_ID = 'gamehub-gcp'
        GCLOUD_CREDS = credentials('gcloud-creds')
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        IMAGE_NAME = "gcr.io/${GCP_PROJECT_ID}/gamehub:${IMAGE_TAG}"
        CLOUD_RUN_SERVICE = 'gamehub-back'
        REGION = 'us-central1'
    }

    stages {
        stage('Verificar versão') {
            steps {
                sh 'gcloud version'
            }
        }
        stage('Autenticar') {
            steps {
                sh 'gcloud auth activate-service-account --key-file="$GCLOUD_CREDS"'
                sh 'gcloud config set project $GCP_PROJECT_ID'
                sh 'gcloud auth configure-docker'
            }
        }
        stage('Construir imagem') {
            steps {
                script {
                    app = docker.build("$IMAGE_NAME")
                }
            }
        }
        stage('Push da imagem') {
            steps {
                script {
                    docker.withRegistry('https://gcr.io') {
                        app.push("$IMAGE_TAG")
                        app.push('latest')
                    }
                }
            }
        }
        stage('Instalar serviço') {
            steps {
                sh 'gcloud run services replace service.yaml --platform=managed --region=$REGION'
            }
        }
    }

    post {
        always {
            sh 'docker system prune -f || true'
            cleanWs()
        }
    }
}