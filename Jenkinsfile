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
                sh '''
                    gcloud auth activate-service-account --key-file="$GCLOUD_CREDS"
                    gcloud config set project $GCP_PROJECT_ID
                    gcloud auth configure-docker
                '''
            }
        }
        stage('Construir imagem') {
            steps {
                script {
                    def dockerImageTag = "${IMAGE_NAME}"
                    docker.build(dockerImageTag, "-f Dockerfile .")
                }
            }
        }
        stage('Push da imagem') {
            steps {
                script {
                    docker.withRegistry('https://gcr.io', 'gcloud-creds') {
                        docker.image("${IMAGE_NAME}").push()
                    }
                }
            }
        }
        stage('Instalar serviço') {
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
            sh 'docker system prune -f || true'
            cleanWs()
        }
    }
}