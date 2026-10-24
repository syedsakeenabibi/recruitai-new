"use strict";

const SKILLS = [
  "JavaScript", "TypeScript", "React", "Node.js", "Python",
  "Java", "SQL", "AWS", "Azure", "Docker", "Kubernetes",
  "CNC", "Machining", "HVAC", "Refrigeration",
  "Electrical", "Mechanical", "PLC", "AutoCAD",
  "Manufacturing", "Quality Control", "Welding",
  "Project Management", "Construction", "Surveying",
  "Pharmacy", "Nursing", "Veterinary", "Clinical",
  "Sales", "Customer Service", "Maintenance",
  "Testing", "Troubleshooting", "Installation"
];

const CATEGORIES = {
  IT: ["software", "developer", "programmer", "cloud", "cybersecurity", "data engineer"],
  HEALTHCARE: ["nurse", "pharmacy", "clinical", "hospital", "veterinarian", "medical"],
  ENGINEERING: ["engineer", "electrical", "mechanical", "autocad", "survey"],
  MANUFACTURING: ["cnc", "machining", "manufacturing", "machine shop", "production"],
  CONSTRUCTION: ["construction", "concrete", "hvac", "refrigeration", "fire alarm"],
  SALES: ["sales representative", "account manager", "business development"]
};

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function words(value) {
  return normalize(value).split(/\s+/).filter(x => x.length > 2);
}

function extractSkills(job) {
  const content = normalize([
    job.jobTitle,
    job.skills,
    job.description
  ].join(" "));

  return SKILLS.filter(skill =>
    (` ${content} `).includes(` ${normalize(skill)} `)
  );
}

function classify(job) {
  const content = normalize(
    [job.jobTitle, job.industry, job.description].join(" ")
  );

  const scores = Object.entries(CATEGORIES).map(([category, terms]) => ({
    category,
    score: terms.reduce(
      (sum, term) => sum + (content.includes(normalize(term)) ? 1 : 0),
      0
    )
  }));

  scores.sort((a, b) => b.score - a.score);

  return scores[0]?.score > 0 ? scores[0].category : "OTHER";
}

function relevance(job, keyword) {
  const query = words(keyword);

  if (!query.length) return 100;

  const title = normalize(job.jobTitle);
  const skills = normalize(job.skills);
  const description = normalize(job.description);

  let score = 0;

  for (const term of query) {
    if (title.includes(term)) score += 60;
    if (skills.includes(term)) score += 25;
    if (description.includes(term)) score += 15;
  }

  return Math.min(100, Math.round(score / query.length));
}

function analyzeJobs(jobs, keyword = "") {
  const unique = new Map();

  for (const job of jobs) {
    if (!job.jobTitle || !job.sourceUrl) continue;

    const key = job.externalId ||
      `${normalize(job.jobTitle)}|${normalize(job.location)}|${normalize(job.companyName)}`;

    if (unique.has(key)) continue;

    const detectedSkills = extractSkills(job);
    const relevanceScore = relevance(job, keyword);

    unique.set(key, {
      ...job,
      detectedSkills,
      predictedCategory: classify(job),
      relevanceScore,
      dataQuality: {
        hasTitle: Boolean(job.jobTitle),
        hasLocation: Boolean(job.location),
        hasDescription: Boolean(job.description),
        hasSalary: Boolean(job.salary),
        hasSourceUrl: Boolean(job.sourceUrl)
      }
    });
  }

  return [...unique.values()].sort(
    (a, b) => b.relevanceScore - a.relevanceScore
  );
}

module.exports = { analyzeJobs };
