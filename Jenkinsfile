pipeline {
    agent any

    environment {
        GCP_PROJECT_ID = 'gamehub-gcp'
        GCP_SERVICE_ACCOUNT_KEY = credentials('gcloud-creds')
        IMAGE_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(7)}"
        IMAGE_NAME = "gcr.io/${GCP_PROJECT_ID}/gamehub:${IMAGE_TAG}"
        CLOUD_RUN_SERVICE = 'gamehub-back'
        REGION = 'us-central1'
    }

    stages {
        stage('Checkout') {
            steps {
                cleanWs()
                checkout scm
            }
        }

        stage('Install Google Cloud SDK') {
            steps {
                sh '''
                    curl https://sdk.cloud.google.com | bash
                    exec -l $SHELL
                    echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
                    curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -
                    sudo apt-get update && sudo apt-get install google-cloud-cli
                '''
            }
        }

        stage('Authenticate') {
            steps {
                withCredentials([file(credentialsId: 'gcloud-creds', variable: 'GOOGLE_APPLICATION_CREDENTIALS')]) {
                    sh '''
                        gcloud auth activate-service-account --key-file=$GOOGLE_APPLICATION_CREDENTIALS
                        gcloud config set project $GCP_PROJECT_ID
                        gcloud config set compute/region $REGION
                        gcloud auth configure-docker
                    '''
                }
            }
        }

        stage('Build & Test') {
            steps {
                script {
                    sh 'docker build --target development .'
                    // Aqui você pode adicionar testes
                }
            }
        }

        stage('Build Production Image') {
            steps {
                script {
                    dockerImage = docker.build("${IMAGE_NAME}", "--target production .")
                }
            }
        }

        stage('Push to Container Registry') {
            steps {
                sh 'docker push ${IMAGE_NAME}'
            }
        }

        stage('Deploy to Cloud Run') {
            steps {
                sh '''
                    gcloud run deploy ${CLOUD_RUN_SERVICE} \
                    --image ${IMAGE_NAME} \
                    --region ${REGION} \
                    --platform managed \
                    --allow-unauthenticated \
                    --set-env-vars="NODE_ENV=production" \
                    --memory=512Mi \
                    --cpu=1 \
                    --port=3000
                '''
            }
        }
    }

    post {
        always {
            cleanWs()
            sh 'docker system prune -f'
        }
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}