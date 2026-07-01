// api/lynk-webhook.js
// Vercel serverless function that receives the "payment success" webhook
// from Lynk.id and, if the purchased product matches this app, provisions
// a Firebase Auth account for the buyer and triggers Firebase's own
// "set your password" email — no third-party email service needed.
//
// IMPORTANT — before going live:
// 1. Trigger one real (or test) webhook from your Lynk.id dashboard and
//    check the Vercel function logs (`console.log(JSON.stringify(payload))`
//    below) to confirm the actual field names/shape Lynk.id sends you.
//    Lynk.id's own webhook docs are the source of truth — this file guesses
//    a reasonable shape based on public integration examples, but you MUST
//    verify it against your own dashboard before relying on it.
// 2. Confirm the exact signature header name/algorithm Lynk.id uses for
//    your account (shown in Lynk.id > Settings > Integrations > Webhooks)
//    and adjust verifySignature() if needed.

const crypto = require("crypto");
const { getAdminApp, admin } = require("../lib/firebaseAdmin");

// Vercel: turn off the default JSON body parser so we can read the RAW
// request body — required for correct HMAC signature verification.
module.exports.config = {
  api: { bodyParser: false },
};

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

// Verify the request really came from Lynk.id.
// Adjust the header name / algorithm here to match what Lynk.id actually
// sends for your account (see docs link in the comment above).
function verifySignature(rawBody, headers) {
  const secret = process.env.LYNK_WEBHOOK_SECRET;
  if (!secret) return { ok: false, reason: "LYNK_WEBHOOK_SECRET not configured" };

  const headerName = (process.env.LYNK_SIGNATURE_HEADER || "x-signature").toLowerCase();
  const signature = headers[headerName];
  if (!signature) return { ok: false, reason: `Missing ${headerName} header` };

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  const sigBuf = Buffer.from(signature, "utf8");
  const expBuf = Buffer.from(expected, "utf8");
  const valid =
    sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);

  return valid ? { ok: true } : { ok: false, reason: "Signature mismatch" };
}

// Pull { email, name, productTitle, refId } out of whatever shape Lynk.id
// actually sends. Tries a few plausible nesting paths — replace with the
// exact path once you've confirmed it from real payload logs (step 1 above).
function extractOrderInfo(payload) {
  const d = payload?.data?.message_data || payload?.data || payload;

  const customer = d?.customer || d?.buyer || {};
  const items = d?.items || d?.products || [];
  const firstItem = Array.isArray(items) ? items[0] : items;

  return {
    email: (customer.email || d.email || payload.email || "").trim().toLowerCase(),
    name: customer.name || d.name || "",
    productTitle: firstItem?.title || firstItem?.name || d.product_title || "",
    productId: firstItem?.id || firstItem?.product_id || d.product_id || "",
    refId: d.ref_id || payload.ref_id || "",
  };
}

// Only provision access for the specific product(s) this app sells.
// Set LYNK_PRODUCT_MATCH in env vars, comma-separated, e.g.
//   LYNK_PRODUCT_MATCH=AdsBrief Studio,adsbrief-studio-prod-id
function matchesThisProduct({ productTitle, productId }) {
  const raw = process.env.LYNK_PRODUCT_MATCH || "";
  const needles = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (needles.length === 0) return true; // no filter configured = accept all

  const haystacks = [productTitle, productId].map((s) => String(s || "").toLowerCase());
  return needles.some((n) => haystacks.some((h) => h.includes(n)));
}

function randomPassword() {
  return crypto.randomBytes(18).toString("base64url"); // never emailed; just an initial secret
}

// Ask Firebase's Identity Toolkit to send its own hosted "reset password"
// email (customizable under Firebase Console > Authentication > Templates).
// This uses the public Web API key, not the Admin SDK, and is what makes
// this free — no SendGrid/Resend account required.
async function sendSetPasswordEmail(email) {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey) throw new Error("Missing FIREBASE_WEB_API_KEY env var");

  const body = { requestType: "PASSWORD_RESET", email };
  if (process.env.APP_URL) {
    // Brings the user straight back to the app after they set a password.
    body.continueUrl = process.env.APP_URL;
  }

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`sendOobCode failed: ${res.status} ${errText}`);
  }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let rawBody;
  try {
    rawBody = await readRawBody(req);
  } catch (err) {
    res.status(400).json({ error: "Could not read body" });
    return;
  }

  const sigCheck = verifySignature(rawBody, req.headers);
  if (!sigCheck.ok) {
    console.warn("Lynk webhook signature rejected:", sigCheck.reason);
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch (err) {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }

  // Uncomment while testing to see the exact shape Lynk.id sends you:
  // console.log("Lynk webhook payload:", JSON.stringify(payload));

  const order = extractOrderInfo(payload);

  if (!order.email) {
    console.warn("Lynk webhook: no email found in payload", JSON.stringify(payload));
    res.status(200).json({ ok: true, skipped: "no-email" });
    return;
  }

  if (!matchesThisProduct(order)) {
    // Purchase of one of the OTHER Lynk.id products — ignore it here.
    res.status(200).json({ ok: true, skipped: "different-product" });
    return;
  }

  try {
    getAdminApp();
    const auth = admin.auth();

    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(order.email);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        userRecord = await auth.createUser({
          email: order.email,
          password: randomPassword(),
          displayName: order.name || undefined,
          emailVerified: true, // they proved ownership by receiving the reset link
        });
      } else {
        throw err;
      }
    }

    await sendSetPasswordEmail(order.email);

    console.log(`Provisioned/reset access for ${order.email} (ref: ${order.refId})`);
    res.status(200).json({ ok: true, uid: userRecord.uid });
  } catch (err) {
    console.error("Lynk webhook processing error:", err);
    // Still return 200 so Lynk.id doesn't endlessly retry a payload that
    // will keep failing for the same reason; the error is logged for you
    // to investigate in Vercel's function logs.
    res.status(200).json({ ok: false, error: err.message });
  }
};
