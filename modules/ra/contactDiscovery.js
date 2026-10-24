const NON_BUSINESS_EMAIL_HOSTS = new Set([
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "live.com",
  "outlook.com",
  "yahoo.com",
  "icloud.com",
  "protonmail.com",
  "proton.me",
]);

const RECRUITMENT_CONTEXT = /\b(apply|application|careers?|contact|email|hiring|recruit(?:er|ing|ment)?|talent acquisition|send (?:your )?(?:cv|resume|application))\b/i;

function findPublishedHiringChannels(description, evidenceUrl, provider, checkedAt) {
  const text = String(description || "");
  const channels = [];
  const seen = new Set();
  const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

  for (const match of text.matchAll(emailPattern)) {
    const email = match[0].toLowerCase();
    const domain = email.split("@")[1];
    if (NON_BUSINESS_EMAIL_HOSTS.has(domain) || /^(?:no-?reply|do-?not-?reply)@/i.test(email) || seen.has(email)) {
      continue;
    }

    const start = Math.max(0, match.index - 140);
    const end = Math.min(text.length, match.index + email.length + 140);
    const context = text.slice(start, end);
    if (!RECRUITMENT_CONTEXT.test(context)) continue;

    seen.add(email);
    channels.push({
      contactName: null,
      contactTitle: null,
      contactType: "OFFICIAL_RECRUITMENT_CHANNEL",
      email,
      professionalProfileUrl: null,
      officialContactUrl: null,
      sourceProvider: provider,
      evidenceUrl,
      checkedAt,
      verificationStatus: "VERIFIED_RECRUITMENT_CHANNEL",
      confidenceExplanation: "This business email was explicitly published in the live employer ATS vacancy in a recruitment, application, or hiring context. No person or employer email pattern was inferred.",
    });
  }

  return channels;
}

module.exports = { findPublishedHiringChannels };
