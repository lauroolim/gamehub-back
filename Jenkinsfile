pipeline {
    agent any

    environment {
        GCP_PROJECT_ID = 'gamehub-gcp'
        GCLOUD_CREDS = credentials('gcloud-creds') 
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        IMAGE_NAME = "gcr.io/${GCP_PROJECT_ID}/site:latest"
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

        stage('Build and Push Docker Image') {
            steps {
                script {
                    def dockerImageTag = "us-central1-docker.pkg.dev/gamehub-gcp/site:latest" 
                    docker.build(dockerImageTag, "-f Dockerfile .")
                    docker.withRegistry('https://us-central1-docker.pkg.dev', 'gcloud-creds') {
                        docker.image(dockerImageTag).push()
                    }
                }
            }
        }
        
        stage('Instalar serviço') {
            steps {
                sh '''
                    gcloud run services replace service.yaml --platform='managed' --region='us-central1'
                '''
            }
        }
        stage('Allow allUsers') {
            steps {
                sh '''
                gcloud run services add-iam-policy-binding hello --region='us-central1' --member='allUsers' --role='roles/run.invoker'
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