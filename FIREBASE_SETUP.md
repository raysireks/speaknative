# Firebase Setup Guide

To enable automated deployments via GitHub Actions, you need to configure a few secrets in your GitHub repository.

## Prerequisites

1.  **Firebase Project**: Ensure you have a Firebase project created in the [Firebase Console](https://console.firebase.google.com/).
2.  **Firebase CLI**: Ensure you have the Firebase CLI installed locally (`npm install -g firebase-tools`).

## Steps

### 1. Get Service Account Key

To allow GitHub Actions to deploy to your Firebase project, you need a Service Account with the correct permissions.

1.  Run the following command in your terminal to generate a token suitable for CI/CD (or use a Google Cloud Service Account for better security, which is what the action recommends, but for simplicity, we'll assume the Service Account JSON method which `google-github-actions/auth` or `FirebaseExtended` often use, but specific to `FirebaseExtended/action-hosting-deploy` it uses `firebaseServiceAccount`):

    Actually, for `FirebaseExtended/action-hosting-deploy`, the recommended way is using a Service Account JSON.

    1. Go to the [Google Cloud Console](https://console.cloud.google.com/iam-admin/serviceaccounts) for your project.
    2. Select your project.
    3. Click **Create Service Account**.
    4. Name it `github-action-deploy`.
    5. Grant it the **Firebase App Hosting Admin** role (and **Cloud Functions Admin** + **Service Account User** if deploying functions).
        - *Note: For full deployment including functions, you might need broader permissions or finer-grained ones.*
    6. Click **Done**.
    7. In the list, click the three dots for the new service account -> **Manage keys**.
    8. **Add key** -> **Create new key** -> **JSON**.
    9. A `.json` file will download. **Keep this safe!**

### 2. Add Secret to GitHub

1.  Go to your GitHub repository.
2.  Navigate to **Settings** > **Secrets and variables** > **Actions**.
3.  Click **New repository secret**.
4.  **Name**: `FIREBASE_SERVICE_ACCOUNT_SPEAKNATIVE`
5.  **Value**: Paste the entire contents of the downloaded JSON file.
6.  Click **Add secret**.

## Project ID

The current configuration uses `speaknative-8ce5c` as the project ID. You MUST change this in `.firebaserc` and `.github/workflows/deploy-firebase.yml` to your actual Firebase project ID.

## Local Deployment

To deploy manually from your machine:

1.  Login to Firebase:
    ```bash
    firebase login
    ```
2.  Deploy:
    ```bash
    npm run deploy
    ```
