pipeline {
    agent any

    environment {
        CLOUDSDK_CORE_PROJECT = 'gamehub-gcp'
        GCLOUD_CREDS = credentials('gcloud-creds')
        CLIENT_EMAIL='jenkins-gcloud@gamehub-gcp.iam.gserviceaccount.com'
        IMAGE_NAME = "gcr.io/${GCP_PROJECT_ID}/gamehub:${IMAGE_TAG}"
        CLOUD_RUN_SERVICE = 'gamehub-back'
    }

    stages {
    stage('Verify version') {
      steps {
        sh '''
          gcloud version
        '''
      }
    }
    stage('Authenticate') {
      steps {
        sh '''
          gcloud auth activate-service-account --key-file="$GCLOUD_CREDS"
        '''
      }
    }
    stage('Install service') {
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
      sh 'gcloud auth revoke $CLIENT_EMAIL'
    }
  }
}