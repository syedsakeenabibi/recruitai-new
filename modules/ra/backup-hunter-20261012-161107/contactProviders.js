"use strict";

const BUSINESS_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PERSONAL_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "hotmail.com",
  "outlook.com", "icloud.com", "proton.me"
]);

function normalizeContact(input, sourceProvider) {
  if (!input || typeof input !== "object") return null;

  const email = String(input.email || "").trim().toLowerCase();
  const domain = email.split("@")[1];

  if (!BUSINESS_EMAIL.test(email) || PERSONAL_DOMAINS.has(domain)) {
    return null;
  }

  return {
    contactName: String(input.contactName || "").trim() || null,
    contactTitle: String(input.contactTitle || "").trim() || null,
    contactType: "EMPLOYER_CONTACT",
    email,
    professionalProfileUrl: input.professionalProfileUrl || null,
    sourceProvider,
    verificationStatus: "UNVERIFIED",
    checkedAt: new Date().toISOString()
  };
}

async function discoverEmployerContacts({ companyName, jobTitle, location }) {
  if (!companyName || !jobTitle) return [];

  // Authorized provider integrations will be added here.
  // Do not fabricate contacts or guess email addresses.
  // Never scrape private websites or bypass paid credits.
  void location;

  return [];
}

module.exports = {
  normalizeContact,
  discoverEmployerContacts
};
