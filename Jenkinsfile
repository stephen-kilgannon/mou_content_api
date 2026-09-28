pipeline {
  agent { label 'metrics-of-you-deploy' }

  options {
    disableConcurrentBuilds()
    timestamps()
  }

  triggers {
    pollSCM('H/2 * * * *')
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build image') {
      steps {
        sh '''
          set -eu
          : "${GIT_COMMIT:?Jenkins did not provide GIT_COMMIT}"
          docker build --pull -t "metrics-of-you-content-api:${GIT_COMMIT}" .
        '''
      }
    }

    stage('Deploy') {
      steps {
        sh '''
          set -eu
          : "${DEPLOY_ROOT:?Set DEPLOY_ROOT in the Jenkins agent environment}"
          export CONTENT_API_IMAGE="metrics-of-you-content-api:${GIT_COMMIT}"
          docker run --rm \
            -v /var/run/docker.sock:/var/run/docker.sock \
            -v "$DEPLOY_ROOT:/deploy" \
            -e CONTENT_API_IMAGE \
            -w /deploy \
            docker:29.1.3-cli \
            sh -ec 'apk add --no-cache docker-cli-compose >/dev/null; docker compose --project-name metrics-of-you -f docker-compose.yaml up -d --no-deps --force-recreate --wait --wait-timeout 120 content-api'
        '''
      }
    }
  }

  post {
    failure {
      sh '''
        if [ -n "${DEPLOY_ROOT:-}" ]; then
          docker run --rm \
            -v /var/run/docker.sock:/var/run/docker.sock \
            -v "$DEPLOY_ROOT:/deploy" \
            -w /deploy \
            docker:29.1.3-cli \
            sh -ec 'apk add --no-cache docker-cli-compose >/dev/null; docker compose --project-name metrics-of-you -f docker-compose.yaml logs --tail 100 content-api' || true
        fi
      '''
    }
  }
}