pipeline {
    agent any

    options {
        skipStagesAfterUnstable()
        timestamps()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Runtime Info') {
            steps {
                script {
                    if (isUnix()) {
                        sh '''
                            set -e
                            node -v
                            npm -v
                        '''
                    } else {
                        bat '''
                            node -v
                            npm -v
                        '''
                    }
                }
            }
        }

        stage('Install dependencies') {
            steps {
                script {
                    if (isUnix()) {
                        sh '''
                            set -e
                            npm install --no-audit --no-fund
                        '''
                    } else {
                        bat '''
                            npm install --no-audit --no-fund
                        '''
                    }
                }
            }
        }

        stage('Build frontend') {
            steps {
                script {
                    if (isUnix()) {
                        sh '''
                            set -e
                            npm run build
                        '''
                    } else {
                        bat '''
                            npm run build
                        '''
                    }
                }
            }
        }

        stage('Archive build output') {
            steps {
                archiveArtifacts artifacts: 'dist/**', fingerprint: true, onlyIfSuccessful: true
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}