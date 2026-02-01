/**
 * Generate self-signed SSL cert for local HTTPS (required for cross-origin cookies on localhost).
 * Uses Node only — no OpenSSL required (works on Windows).
 * Run: node scripts/gen-cert.js  (or npm run certs)
 * Then set USE_HTTPS=true and restart the backend.
 */
const fs = require('fs');
const path = require('path');
const selfsigned = require('selfsigned');

const certDir = path.join(__dirname, '..', 'cert');
const keyPath = path.join(certDir, 'key.pem');
const certPath = path.join(certDir, 'cert.pem');

if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

const attrs = [{ name: 'commonName', value: 'localhost' }];
const notAfter = new Date();
notAfter.setDate(notAfter.getDate() + 365);
const opts = {
  keySize: 2048,
  algorithm: 'sha256',
  notAfterDate: notAfter,
  extensions: [
    { name: 'basicConstraints', cA: false },
    { name: 'keyUsage', digitalSignature: true, keyEncipherment: true },
    { name: 'extKeyUsage', serverAuth: true },
    {
      name: 'subjectAltName',
      altNames: [
        { type: 2, value: 'localhost' },
        { type: 7, ip: '127.0.0.1' },
        { type: 7, ip: '::1' },
      ],
    },
  ],
};

selfsigned
  .generate(attrs, opts)
  .then((pems) => {
    fs.writeFileSync(keyPath, pems.private);
    fs.writeFileSync(certPath, pems.cert);
    console.log('Created cert/key in Backend/cert/. Set USE_HTTPS=true and run: npm run dev:https');
  })
  .catch((err) => {
    console.error('Failed to generate certificate:', err.message);
    process.exit(1);
  });
