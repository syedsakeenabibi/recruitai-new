import random
import uuid
import psycopg
from psycopg.types.json import Jsonb

random.seed(42)

DATABASE_URL = "postgresql://recruitai:recruitai@localhost:5432/recruitai_new"

TOTAL_CANDIDATES = 2000

locations = [
    ("London", "United Kingdom"),
    ("Singapore", "Singapore"),
    ("Dubai", "UAE"),
    ("Amsterdam", "Netherlands"),
    ("Toronto", "Canada"),
    ("Berlin", "Germany"),
    ("Paris", "France"),
    ("Sydney", "Australia"),
    ("Bengaluru", "India"),
    ("Hyderabad", "India"),
    ("Mumbai", "India"),
    ("Dublin", "Ireland")
]

companies = [
    "Northstar Solutions",
    "Vertex Global",
    "BluePeak Technologies",
    "Horizon Labs",
    "Pioneer Systems",
    "Nova Industries",
    "Summit Enterprises",
    "BrightPath Consulting",
    "Atlas Research",
    "GreenField Group"
]

candidate_types = [
    {
        "industry": "Software",
        "titles": [
            "Java Developer",
            "Python Developer",
            "Backend Developer",
            "Frontend Developer",
            "Full Stack Developer",
            "Software Engineer",
            "DevOps Engineer"
        ],
        "skills": [
            "Java", "Python", "JavaScript", "TypeScript",
            "Spring Boot", "Node.js", "React",
            "PostgreSQL", "REST APIs", "Docker",
            "AWS", "Git"
        ]
    },

    {
        "industry": "Data & AI",
        "titles": [
            "Data Scientist",
            "Machine Learning Engineer",
            "AI Engineer",
            "Data Analyst",
            "Data Engineer",
            "BI Analyst"
        ],
        "skills": [
            "Python", "SQL", "Machine Learning",
            "Deep Learning", "NLP", "TensorFlow",
            "PyTorch", "Pandas", "Power BI",
            "Data Analysis", "ETL"
        ]
    },

    {
        "industry": "Banking & Finance",
        "titles": [
            "Financial Analyst",
            "Risk Analyst",
            "Credit Analyst",
            "Banking Manager",
            "Payments Specialist",
            "Relationship Manager"
        ],
        "skills": [
            "Financial Analysis", "Risk Management",
            "Banking", "Payments", "AML", "KYC",
            "Compliance", "Financial Modeling",
            "Excel", "Credit Analysis"
        ]
    },

    {
        "industry": "Food & FMCG",
        "titles": [
            "Category Manager",
            "Food Technologist",
            "Flavor Specialist",
            "Product Development Manager",
            "Procurement Manager",
            "FMCG Product Manager"
        ],
        "skills": [
            "Category Management", "Food Science",
            "FMCG", "Flavor Development",
            "Product Development", "Consumer Insights",
            "Market Analysis", "Portfolio Management",
            "Supplier Management"
        ]
    },

    {
        "industry": "Healthcare & Pharma",
        "titles": [
            "Clinical Research Associate",
            "Clinical Research Manager",
            "Regulatory Affairs Specialist",
            "Pharmacovigilance Specialist",
            "Healthcare Analyst",
            "Medical Researcher"
        ],
        "skills": [
            "Clinical Research", "Clinical Trials",
            "GCP", "Pharmacovigilance",
            "Regulatory Affairs", "Healthcare",
            "Medical Research", "Pharmacology",
            "Data Analysis"
        ]
    },

    {
        "industry": "Biotechnology",
        "titles": [
            "Research Scientist",
            "Biotechnologist",
            "Microbiologist",
            "Bioinformatics Analyst",
            "Laboratory Scientist",
            "Quality Control Analyst"
        ],
        "skills": [
            "Biotechnology", "Molecular Biology",
            "PCR", "Genomics", "Bioinformatics",
            "Microbiology", "Cell Culture",
            "Laboratory Research", "Quality Control"
        ]
    },

    {
        "industry": "Sales & Marketing",
        "titles": [
            "Sales Manager",
            "Business Development Manager",
            "Account Manager",
            "Marketing Manager",
            "Digital Marketing Specialist",
            "Product Marketing Manager"
        ],
        "skills": [
            "Business Development", "Sales",
            "CRM", "Lead Generation",
            "Digital Marketing", "SEO",
            "Market Research", "Negotiation",
            "Account Management"
        ]
    },

    {
        "industry": "HR & Recruitment",
        "titles": [
            "Recruiter",
            "Technical Recruiter",
            "Talent Acquisition Specialist",
            "HR Manager",
            "HR Business Partner",
            "Recruitment Manager"
        ],
        "skills": [
            "Recruitment", "Talent Acquisition",
            "Candidate Sourcing", "Candidate Screening",
            "Interviewing", "ATS",
            "HR Operations", "Onboarding",
            "Workforce Planning"
        ]
    },

    {
        "industry": "Engineering",
        "titles": [
            "Mechanical Engineer",
            "Electrical Engineer",
            "Process Engineer",
            "Quality Engineer",
            "Project Engineer",
            "Maintenance Engineer"
        ],
        "skills": [
            "Engineering", "AutoCAD",
            "Project Management", "Quality Control",
            "Manufacturing", "Technical Design",
            "Maintenance", "Process Improvement"
        ]
    },

    {
        "industry": "Supply Chain & Logistics",
        "titles": [
            "Supply Chain Analyst",
            "Supply Chain Manager",
            "Procurement Specialist",
            "Logistics Manager",
            "Demand Planner",
            "Operations Manager"
        ],
        "skills": [
            "Supply Chain", "Procurement",
            "Logistics", "Inventory Management",
            "SAP", "Vendor Management",
            "Demand Planning", "Operations"
        ]
    }
]

degrees = [
    "Bachelor's Degree",
    "Master's Degree",
    "MBA",
    "BSc",
    "MSc",
    "BTech",
    "MTech"
]


def create_candidate(number):
    profile = random.choice(candidate_types)

    title = random.choice(profile["titles"])

    skills = random.sample(
        profile["skills"],
        random.randint(4, min(8, len(profile["skills"])))
    )

    city, country = random.choice(locations)

    experience = round(random.uniform(1, 18), 1)

    company = random.choice(companies)

    education = random.choice(degrees)

    candidate_name = f"Synthetic Candidate {number:04d}"

    summary = (
        f"{title} with {experience} years of professional experience "
        f"in {profile['industry']}. Core experience includes "
        f"{', '.join(skills[:4])}."
    )

    resume_text = (
        f"Professional Title: {title}. "
        f"Industry: {profile['industry']}. "
        f"Professional experience: {experience} years. "
        f"Skills: {', '.join(skills)}. "
        f"Current company: {company}. "
        f"Education: {education}. "
        f"Location: {city}, {country}. "
        f"Experience working on industry-specific projects, "
        f"cross-functional collaboration, project delivery, "
        f"problem solving and professional stakeholder communication."
    )

    return {
        "id": str(uuid.uuid4()),
        "name": candidate_name,
        "email": f"candidate{number:04d}@example.com",
        "phone": None,
        "location": city,
        "country": country,
        "currentTitle": title,
        "currentCompany": company,
        "industry": profile["industry"],
        "experienceYears": experience,
        "education": education,
        "degree": education,
        "specialization": profile["industry"],
        "skills": skills,
        "previousRoles": [],
        "summary": summary,
        "resumeText": resume_text,
        "expectedSalary": None,
        "noticeDays": random.choice([0, 15, 30, 45, 60, 90]),
        "availability": random.choice([
            "Immediate",
            "15 days",
            "30 days",
            "45 days",
            "60 days",
            "90 days"
        ]),
        "source": "SYNTHETIC",
        "sourceProfileId": f"SYN-{number:05d}",
        "sourceUrl": None
    }


INSERT_SQL = """
INSERT INTO "Candidate" (
    "id",
    "name",
    "email",
    "phone",
    "location",
    "country",
    "currentTitle",
    "currentCompany",
    "industry",
    "experienceYears",
    "education",
    "degree",
    "specialization",
    "skills",
    "previousRoles",
    "summary",
    "resumeText",
    "expectedSalary",
    "noticeDays",
    "availability",
    "source",
    "sourceProfileId",
    "sourceUrl",
    "createdAt",
    "updatedAt"
)
VALUES (
    %(id)s,
    %(name)s,
    %(email)s,
    %(phone)s,
    %(location)s,
    %(country)s,
    %(currentTitle)s,
    %(currentCompany)s,
    %(industry)s,
    %(experienceYears)s,
    %(education)s,
    %(degree)s,
    %(specialization)s,
    %(skills)s,
    %(previousRoles)s,
    %(summary)s,
    %(resumeText)s,
    %(expectedSalary)s,
    %(noticeDays)s,
    %(availability)s,
    %(source)s,
    %(sourceProfileId)s,
    %(sourceUrl)s,
    NOW(),
    NOW()
)
"""


def main():
    print("Connecting to RecruitAI PostgreSQL database...")

    with psycopg.connect(DATABASE_URL) as connection:
        with connection.cursor() as cursor:

            cursor.execute(
                'DELETE FROM "Candidate" WHERE "source" = %s',
                ("SYNTHETIC",)
            )

            print("Generating and inserting candidates...")

            for number in range(1, TOTAL_CANDIDATES + 1):

                candidate = create_candidate(number)

                candidate["previousRoles"] = Jsonb(
                    candidate["previousRoles"]
                )

                cursor.execute(INSERT_SQL, candidate)

                if number % 250 == 0:
                    print(f"Inserted {number} candidates...")

        connection.commit()

    print("")
    print("SUCCESS")
    print(f"{TOTAL_CANDIDATES} candidates inserted into recruitai_new.")
    print("Candidate table is ready for JD matching.")


if __name__ == "__main__":
    main()