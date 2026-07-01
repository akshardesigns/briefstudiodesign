// lib/firebaseAdmin.js
// Singleton Firebase Admin SDK init, reused across warm serverless invocations.

const admin = require("firebase-admin");

function getAdminApp() {
  if (admin.apps.length) return admin.app();

  // FIREBASE_SERVICE_ACCOUNT env var must contain the FULL JSON contents of
  // the service account key file, as a single-line string (see README-SETUP.md).
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT env var");
  }
  const serviceAccount = JSON.parse(raw);

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = { admin, getAdminApp };
