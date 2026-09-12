import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const taxonomy = [
  {
    category: 'Programming Languages',
    description: 'Core programming languages for software engineering',
    skills: [
      { name: 'TypeScript', description: 'Typed superset of JavaScript for scalable applications' },
      { name: 'JavaScript', description: 'Dynamic scripting language for web and backend development' },
      { name: 'Python', description: 'Versatile language for backend, automation, and data analysis' },
      { name: 'Java', description: 'Object-oriented language for enterprise applications' },
      { name: 'C++', description: 'High-performance systems programming language' },
      { name: 'Go', description: 'Statically typed language designed for concurrency and cloud services' },
      { name: 'C#', description: 'Modern object-oriented language for .NET development' },
    ],
  },
  {
    category: 'Web Development',
    description: 'Frontend and backend web technologies, frameworks, and protocols',
    skills: [
      { name: 'React', description: 'Declarative component-based UI library' },
      { name: 'Node.js', description: 'Asynchronous event-driven JavaScript runtime' },
      { name: 'NestJS', description: 'Progressive Node.js framework for building efficient backend systems' },
      { name: 'REST APIs', description: 'Architectural style for designing networked HTTP APIs' },
      { name: 'HTML5 & CSS3', description: 'Foundational markup and styling for modern web pages' },
      { name: 'Tailwind CSS', description: 'Utility-first CSS framework for rapid UI styling' },
      { name: 'Next.js', description: 'Full-stack React framework with server-side rendering' },
      { name: 'GraphQL', description: 'Query language for flexible API data fetching' },
    ],
  },
  {
    category: 'Databases & Storage',
    description: 'Relational, document, and in-memory database management systems',
    skills: [
      { name: 'PostgreSQL', description: 'Powerful, open-source object-relational database system' },
      { name: 'MySQL', description: 'Widely used relational database management system' },
      { name: 'MongoDB', description: 'Document-oriented NoSQL database for flexible data schemas' },
      { name: 'Redis', description: 'In-memory key-value data store for caching and pub/sub' },
      { name: 'Prisma ORM', description: 'Next-generation TypeScript ORM for type-safe database access' },
    ],
  },
  {
    category: 'Cloud & DevOps',
    description: 'Infrastructure, containerization, deployment pipelines, and cloud computing',
    skills: [
      { name: 'Docker', description: 'Container platform for packaging and running distributed applications' },
      { name: 'Kubernetes', description: 'Container orchestration engine for automated deployment and scaling' },
      { name: 'AWS', description: 'Amazon Web Services cloud computing infrastructure and services' },
      { name: 'CI/CD Pipelines', description: 'Automated continuous integration and deployment workflows' },
      { name: 'Git & Version Control', description: 'Distributed source code control and collaborative workflows' },
      { name: 'Linux System Administration', description: 'Unix/Linux command-line tools, shell scripting, and server setup' },
    ],
  },
  {
    category: 'Soft Skills & Leadership',
    description: 'Professional, collaborative, and interpersonal capabilities',
    skills: [
      { name: 'Problem Solving', description: 'Structured analytical thinking and algorithmic troubleshooting' },
      { name: 'Technical Communication', description: 'Clear written and verbal articulation of technical ideas and designs' },
      { name: 'Team Collaboration', description: 'Cross-functional teamwork, code reviews, and pair programming' },
      { name: 'Agile & Scrum', description: 'Iterative sprint-based project delivery methodologies' },
      { name: 'Critical Thinking', description: 'Objective analysis and evaluation of engineering trade-offs' },
    ],
  },
];

const assessmentsData = [
  {
    skillName: 'TypeScript',
    title: 'TypeScript Core Competency Assessment',
    description: 'Evaluate your knowledge of static typing, generics, interfaces, unions, and compile-time guarantees in TypeScript.',
    passingScore: 70,
    durationMinutes: 15,
    questions: [
      {
        questionText: 'What is the primary difference between "interface" and "type" alias in TypeScript?',
        explanation: 'Interfaces can be augmented via declaration merging, whereas type aliases cannot be reopened once declared.',
        points: 1,
        options: [
          { optionText: 'Interfaces support declaration merging; type aliases do not.', isCorrect: true },
          { optionText: 'Type aliases only work for primitive types, not objects.', isCorrect: false },
          { optionText: 'Interfaces exist at runtime in JavaScript output.', isCorrect: false },
          { optionText: 'There is absolutely no syntactic or semantic difference.', isCorrect: false },
        ],
      },
      {
        questionText: 'Which utility type constructs a type with all properties of T set to optional?',
        explanation: 'Partial<T> makes all properties in T optional.',
        points: 1,
        options: [
          { optionText: 'Partial<T>', isCorrect: true },
          { optionText: 'Required<T>', isCorrect: false },
          { optionText: 'Readonly<T>', isCorrect: false },
          { optionText: 'Pick<T, K>', isCorrect: false },
        ],
      },
      {
        questionText: 'What does the "unknown" type represent in TypeScript compared to "any"?',
        explanation: '"unknown" is a type-safe counterpart of "any"; you cannot perform operations on an "unknown" value without narrowing its type first.',
        points: 1,
        options: [
          { optionText: 'It requires type narrowing before calling methods or accessing properties.', isCorrect: true },
          { optionText: 'It disables all TypeScript compiler safety checks.', isCorrect: false },
          { optionText: 'It is identical to the "never" bottom type.', isCorrect: false },
          { optionText: 'It only accepts undefined or null values.', isCorrect: false },
        ],
      },
    ],
  },
  {
    skillName: 'React',
    title: 'React Production Engineering Assessment',
    description: 'Assess foundational and advanced React concepts including Hooks, Reconciliation, State Management, and Performance.',
    passingScore: 70,
    durationMinutes: 15,
    questions: [
      {
        questionText: 'When does the cleanup function returned inside a useEffect hook execute?',
        explanation: 'The cleanup function executes before the effect runs again and when the component unmounts.',
        points: 1,
        options: [
          { optionText: 'Before the effect re-runs on dependency change, and when the component unmounts.', isCorrect: true },
          { optionText: 'Only once when the browser window closes.', isCorrect: false },
          { optionText: 'Synchronously before every component render cycle.', isCorrect: false },
          { optionText: 'Immediately after the initial DOM paint.', isCorrect: false },
        ],
      },
      {
        questionText: 'What is the purpose of the useCallback hook?',
        explanation: 'useCallback memoizes a callback function instance between renders unless its dependencies change.',
        points: 1,
        options: [
          { optionText: 'To cache/memoize a function definition across re-renders.', isCorrect: true },
          { optionText: 'To perform asynchronous side effects outside render.', isCorrect: false },
          { optionText: 'To store mutable values that do not trigger re-render.', isCorrect: false },
          { optionText: 'To create deep clones of state objects.', isCorrect: false },
        ],
      },
      {
        questionText: 'Why should "key" props in list renderings never use array indices if the list is dynamically modified?',
        explanation: 'Index keys break component identity during item reordering, insertion, or deletion, causing rendering bugs and state corruption.',
        points: 1,
        options: [
          { optionText: 'Indices can cause reconciliation bugs and state loss when items are inserted, deleted, or reordered.', isCorrect: true },
          { optionText: 'React throws a fatal JavaScript exception if index keys are used.', isCorrect: false },
          { optionText: 'Index keys cause network requests to duplicate.', isCorrect: false },
          { optionText: 'Array indices are strings and React only accepts numeric keys.', isCorrect: false },
        ],
      },
    ],
  },
  {
    skillName: 'PostgreSQL',
    title: 'PostgreSQL Relational Design & Optimization',
    description: 'Demonstrate relational schema modeling, indexing, transactions (ACID), and query optimization skills.',
    passingScore: 70,
    durationMinutes: 15,
    questions: [
      {
        questionText: 'Which index type is default and best suited for equality and range queries in PostgreSQL?',
        explanation: 'B-tree is the default and most versatile index type in PostgreSQL for comparison operators (<, <=, =, >=, >).',
        points: 1,
        options: [
          { optionText: 'B-tree index', isCorrect: true },
          { optionText: 'Hash index', isCorrect: false },
          { optionText: 'GIN (Generalized Inverted Index)', isCorrect: false },
          { optionText: 'BRIN (Block Range Index)', isCorrect: false },
        ],
      },
      {
        questionText: 'What does ACID stand for in relational database transactions?',
        explanation: 'ACID guarantees Atomicity, Consistency, Isolation, and Durability.',
        points: 1,
        options: [
          { optionText: 'Atomicity, Consistency, Isolation, Durability', isCorrect: true },
          { optionText: 'Authentication, Concurrency, Integrity, Distribution', isCorrect: false },
          { optionText: 'Asynchronous, Clustered, Indexed, Dynamic', isCorrect: false },
          { optionText: 'Availability, Consistency, Invalidation, Demarcation', isCorrect: false },
        ],
      },
    ],
  },
  {
    skillName: 'Docker',
    title: 'Docker Containerization & Infrastructure',
    description: 'Verify proficiency in Dockerfiles, multi-stage builds, container isolation, and volume management.',
    passingScore: 70,
    durationMinutes: 15,
    questions: [
      {
        questionText: 'Why are multi-stage Docker builds recommended for production applications?',
        explanation: 'Multi-stage builds allow separating build-time dependencies (SDKs, build tools) from runtime images, resulting in significantly smaller and more secure images.',
        points: 1,
        options: [
          { optionText: 'They produce significantly smaller and more secure final images by omitting build tools.', isCorrect: true },
          { optionText: 'They allow running multiple operating systems inside one container.', isCorrect: false },
          { optionText: 'They eliminate the need for Docker networks.', isCorrect: false },
          { optionText: 'They automatically publish containers to public registries.', isCorrect: false },
        ],
      },
      {
        questionText: 'What is the primary difference between a Docker Volume and a Bind Mount?',
        explanation: 'Volumes are managed entirely by Docker and stored in Docker-managed host areas, providing better isolation and performance.',
        points: 1,
        options: [
          { optionText: 'Volumes are managed by Docker; Bind Mounts depend on host directory structure.', isCorrect: true },
          { optionText: 'Bind mounts are encrypted; volumes are always unencrypted.', isCorrect: false },
          { optionText: 'Volumes can only be used during image build time.', isCorrect: false },
          { optionText: 'There is no functional difference.', isCorrect: false },
        ],
      },
    ],
  },
];

const careerRolesData = [
  {
    title: 'Frontend Developer',
    slug: 'frontend-developer',
    category: 'Software Engineering',
    description: 'Specializes in building responsive, accessible, and performant user interfaces for modern web applications.',
    minExperienceYears: 0,
    skills: [
      { name: 'React', requiredProficiency: 'ADVANCED', weight: 1.5, isMandatory: true },
      { name: 'JavaScript', requiredProficiency: 'ADVANCED', weight: 1.5, isMandatory: true },
      { name: 'TypeScript', requiredProficiency: 'INTERMEDIATE', weight: 1.2, isMandatory: true },
      { name: 'HTML5 & CSS3', requiredProficiency: 'ADVANCED', weight: 1.0, isMandatory: true },
      { name: 'Tailwind CSS', requiredProficiency: 'INTERMEDIATE', weight: 0.8, isMandatory: false },
      { name: 'REST APIs', requiredProficiency: 'INTERMEDIATE', weight: 1.0, isMandatory: true },
    ],
  },
  {
    title: 'Backend Developer',
    slug: 'backend-developer',
    category: 'Software Engineering',
    description: 'Designs and builds scalable server-side APIs, database architectures, and business logic services.',
    minExperienceYears: 0,
    skills: [
      { name: 'Node.js', requiredProficiency: 'ADVANCED', weight: 1.5, isMandatory: true },
      { name: 'NestJS', requiredProficiency: 'INTERMEDIATE', weight: 1.2, isMandatory: false },
      { name: 'PostgreSQL', requiredProficiency: 'ADVANCED', weight: 1.5, isMandatory: true },
      { name: 'REST APIs', requiredProficiency: 'ADVANCED', weight: 1.2, isMandatory: true },
      { name: 'Prisma ORM', requiredProficiency: 'INTERMEDIATE', weight: 1.0, isMandatory: false },
      { name: 'Docker', requiredProficiency: 'BEGINNER', weight: 0.8, isMandatory: false },
    ],
  },
  {
    title: 'Full Stack Developer',
    slug: 'full-stack-developer',
    category: 'Software Engineering',
    description: 'Versatile engineer capable of delivering end-to-end features spanning client interfaces, backend APIs, and databases.',
    minExperienceYears: 0,
    skills: [
      { name: 'React', requiredProficiency: 'ADVANCED', weight: 1.4, isMandatory: true },
      { name: 'Node.js', requiredProficiency: 'INTERMEDIATE', weight: 1.4, isMandatory: true },
      { name: 'TypeScript', requiredProficiency: 'INTERMEDIATE', weight: 1.2, isMandatory: true },
      { name: 'PostgreSQL', requiredProficiency: 'INTERMEDIATE', weight: 1.2, isMandatory: true },
      { name: 'REST APIs', requiredProficiency: 'ADVANCED', weight: 1.0, isMandatory: true },
      { name: 'Git & Version Control', requiredProficiency: 'ADVANCED', weight: 1.0, isMandatory: true },
    ],
  },
  {
    title: 'Cloud & DevOps Engineer',
    slug: 'cloud-devops-engineer',
    category: 'Cloud & DevOps',
    description: 'Manages cloud infrastructure, container orchestration, and continuous delivery pipelines for production reliability.',
    minExperienceYears: 0,
    skills: [
      { name: 'Docker', requiredProficiency: 'ADVANCED', weight: 1.5, isMandatory: true },
      { name: 'Kubernetes', requiredProficiency: 'INTERMEDIATE', weight: 1.3, isMandatory: true },
      { name: 'AWS', requiredProficiency: 'ADVANCED', weight: 1.5, isMandatory: true },
      { name: 'CI/CD Pipelines', requiredProficiency: 'ADVANCED', weight: 1.3, isMandatory: true },
      { name: 'Linux System Administration', requiredProficiency: 'ADVANCED', weight: 1.2, isMandatory: true },
    ],
  },
  {
    title: 'Data Engineer',
    slug: 'data-engineer',
    category: 'Data & AI',
    description: 'Constructs data pipelines, database architectures, and data transformations for business intelligence and analytics.',
    minExperienceYears: 0,
    skills: [
      { name: 'Python', requiredProficiency: 'ADVANCED', weight: 1.5, isMandatory: true },
      { name: 'PostgreSQL', requiredProficiency: 'ADVANCED', weight: 1.5, isMandatory: true },
      { name: 'MongoDB', requiredProficiency: 'INTERMEDIATE', weight: 1.0, isMandatory: false },
      { name: 'Problem Solving', requiredProficiency: 'ADVANCED', weight: 1.2, isMandatory: true },
    ],
  },
];

export async function seedTaxonomyAndAssessments() {
  // Seed Categories & Skills
  for (const catData of taxonomy) {
    let category = await prisma.skillCategory.findUnique({
      where: { name: catData.category },
    });

    if (!category) {
      category = await prisma.skillCategory.create({
        data: {
          name: catData.category,
          description: catData.description,
          isActive: true,
        },
      });
    }

    for (const skillData of catData.skills) {
      const existing = await prisma.skill.findUnique({
        where: {
          name_categoryId: {
            name: skillData.name,
            categoryId: category.id,
          },
        },
      });

      if (!existing) {
        await prisma.skill.create({
          data: {
            name: skillData.name,
            description: skillData.description,
            categoryId: category.id,
            isActive: true,
          },
        });
      }
    }
  }

  // Seed Assessments
  for (const aData of assessmentsData) {
    const skill = await prisma.skill.findFirst({
      where: { name: aData.skillName },
    });

    if (skill) {
      let assessment = await prisma.assessment.findFirst({
        where: { skillId: skill.id, title: aData.title },
      });

      if (!assessment) {
        assessment = await prisma.assessment.create({
          data: {
            title: aData.title,
            description: aData.description,
            skillId: skill.id,
            passingScore: aData.passingScore,
            durationMinutes: aData.durationMinutes,
            totalQuestions: aData.questions.length,
            isActive: true,
          },
        });
      }

      // Seed Questions & Options
      for (let i = 0; i < aData.questions.length; i++) {
        const qData = aData.questions[i];
        let question = await prisma.assessmentQuestion.findFirst({
          where: { assessmentId: assessment.id, questionText: qData.questionText },
        });

        if (!question) {
          question = await prisma.assessmentQuestion.create({
            data: {
              assessmentId: assessment.id,
              questionText: qData.questionText,
              explanation: qData.explanation,
              points: qData.points,
              order: i + 1,
            },
          });

          for (let j = 0; j < qData.options.length; j++) {
            const opt = qData.options[j];
            await prisma.questionOption.create({
              data: {
                questionId: question.id,
                optionText: opt.optionText,
                isCorrect: opt.isCorrect,
                order: j + 1,
              },
            });
          }
        }
      }
    }
  }

  // Seed Career Roles (Phase 7)
  for (const rData of careerRolesData) {
    let role = await prisma.careerRole.findUnique({
      where: { slug: rData.slug },
    });

    if (!role) {
      role = await prisma.careerRole.create({
        data: {
          title: rData.title,
          slug: rData.slug,
          category: rData.category,
          description: rData.description,
          minExperienceYears: rData.minExperienceYears,
          isActive: true,
        },
      });
    }

    for (const reqSkill of rData.skills) {
      const skill = await prisma.skill.findFirst({
        where: { name: reqSkill.name },
      });

      if (skill) {
        const existingReq = await prisma.careerRoleSkill.findUnique({
          where: {
            careerRoleId_skillId: {
              careerRoleId: role.id,
              skillId: skill.id,
            },
          },
        });

        if (!existingReq) {
          await prisma.careerRoleSkill.create({
            data: {
              careerRoleId: role.id,
              skillId: skill.id,
              requiredProficiency: reqSkill.requiredProficiency as any,
              weight: reqSkill.weight,
              isMandatory: reqSkill.isMandatory,
            },
          });
        }
      }
    }
  }

  // Seed Sample Industry Profile & Opportunities (Phase 8)
  let industryUser = await prisma.user.findUnique({
    where: { email: 'recruiter@techcorp.com' },
  });

  if (!industryUser) {
    industryUser = await prisma.user.create({
      data: {
        email: 'recruiter@techcorp.com',
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456', // dummy hash
        role: 'INDUSTRY',
        status: 'ACTIVE',
        isEmailVerified: true,
      },
    });
  }

  let industryProfile = await prisma.industryProfile.findUnique({
    where: { userId: industryUser.id },
  });

  if (!industryProfile) {
    industryProfile = await prisma.industryProfile.create({
      data: {
        userId: industryUser.id,
        companyName: 'TechCorp Solutions',
        industryType: 'Information Technology',
        description: 'Enterprise cloud software and web scale platforms.',
        website: 'https://techcorp.example.com',
        headquarters: 'Bengaluru, India',
        isVerified: true,
      },
    });
  }

  const opportunitiesData = [
    {
      title: 'Frontend Engineering Summer Internship',
      slug: 'frontend-engineering-summer-internship',
      opportunityType: 'INTERNSHIP',
      location: 'Bengaluru / Remote',
      isRemote: true,
      stipend: 25000,
      stipendCurrency: 'INR',
      stipendPeriod: 'MONTHLY',
      minCgpa: 7.0,
      minGraduationYear: 2025,
      maxGraduationYear: 2027,
      eligibleDepartments: ['Computer Science', 'Information Technology', 'CSE', 'IT'],
      positionsCount: 5,
      description: 'Join our product frontend engineering squad to build accessible, performant design systems and React applications.',
      careerRoleSlug: 'frontend-developer',
      skills: [
        { name: 'React', requiredProficiency: 'ADVANCED', weight: 1.5, isMandatory: true },
        { name: 'TypeScript', requiredProficiency: 'INTERMEDIATE', weight: 1.2, isMandatory: true },
        { name: 'REST APIs', requiredProficiency: 'INTERMEDIATE', weight: 1.0, isMandatory: true },
        { name: 'HTML5 & CSS3', requiredProficiency: 'ADVANCED', weight: 1.0, isMandatory: false },
      ],
    },
    {
      title: 'Graduate Backend Software Engineer',
      slug: 'graduate-backend-software-engineer',
      opportunityType: 'JOB',
      location: 'Bengaluru, Karnataka',
      isRemote: false,
      stipend: 800000,
      stipendCurrency: 'INR',
      stipendPeriod: 'ANNUAL',
      minCgpa: 7.5,
      minGraduationYear: 2025,
      maxGraduationYear: 2026,
      eligibleDepartments: ['Computer Science', 'Information Technology', 'Electronics', 'CSE'],
      positionsCount: 3,
      description: 'Architect high-throughput REST APIs, database schemas, and microservice integrations using Node.js and PostgreSQL.',
      careerRoleSlug: 'backend-developer',
      skills: [
        { name: 'Node.js', requiredProficiency: 'ADVANCED', weight: 1.5, isMandatory: true },
        { name: 'PostgreSQL', requiredProficiency: 'ADVANCED', weight: 1.5, isMandatory: true },
        { name: 'REST APIs', requiredProficiency: 'ADVANCED', weight: 1.2, isMandatory: true },
        { name: 'Docker', requiredProficiency: 'BEGINNER', weight: 0.8, isMandatory: false },
      ],
    },
    {
      title: 'Cloud & DevOps Engineering Apprenticeship',
      slug: 'cloud-devops-engineering-apprenticeship',
      opportunityType: 'APPRENTICESHIP',
      location: 'Hyderabad, Telangana',
      isRemote: true,
      stipend: 30000,
      stipendCurrency: 'INR',
      stipendPeriod: 'MONTHLY',
      minCgpa: 6.5,
      minGraduationYear: 2024,
      maxGraduationYear: 2027,
      eligibleDepartments: [],
      positionsCount: 4,
      description: 'Hands-on enterprise apprenticeship focusing on container orchestration, CI/CD pipelines, and AWS cloud management.',
      careerRoleSlug: 'cloud-devops-engineer',
      skills: [
        { name: 'Docker', requiredProficiency: 'ADVANCED', weight: 1.5, isMandatory: true },
        { name: 'AWS', requiredProficiency: 'ADVANCED', weight: 1.5, isMandatory: true },
        { name: 'CI/CD Pipelines', requiredProficiency: 'INTERMEDIATE', weight: 1.2, isMandatory: true },
      ],
    },
    {
      title: 'Full-Stack Web Innovation Live Project',
      slug: 'full-stack-web-innovation-live-project',
      opportunityType: 'LIVE_PROJECT',
      location: 'Remote',
      isRemote: true,
      stipend: 15000,
      stipendCurrency: 'INR',
      stipendPeriod: 'LUMPSUM',
      minCgpa: 6.0,
      minGraduationYear: 2024,
      maxGraduationYear: 2028,
      eligibleDepartments: [],
      positionsCount: 8,
      description: 'Collaborate with senior industry architects on delivering full-stack prototypes and cloud-native solutions.',
      careerRoleSlug: 'full-stack-developer',
      skills: [
        { name: 'React', requiredProficiency: 'ADVANCED', weight: 1.4, isMandatory: true },
        { name: 'Node.js', requiredProficiency: 'INTERMEDIATE', weight: 1.4, isMandatory: true },
        { name: 'PostgreSQL', requiredProficiency: 'INTERMEDIATE', weight: 1.2, isMandatory: true },
      ],
    },
  ];

  for (const oppData of opportunitiesData) {
    let opp = await prisma.opportunity.findUnique({
      where: { slug: oppData.slug },
    });

    let careerRole = null;
    if (oppData.careerRoleSlug) {
      careerRole = await prisma.careerRole.findUnique({
        where: { slug: oppData.careerRoleSlug },
      });
    }

    if (!opp) {
      opp = await prisma.opportunity.create({
        data: {
          industryProfileId: industryProfile.id,
          careerRoleId: careerRole?.id || null,
          title: oppData.title,
          slug: oppData.slug,
          opportunityType: oppData.opportunityType as any,
          status: 'PUBLISHED',
          location: oppData.location,
          isRemote: oppData.isRemote,
          stipend: oppData.stipend,
          stipendCurrency: oppData.stipendCurrency,
          stipendPeriod: oppData.stipendPeriod,
          minCgpa: oppData.minCgpa,
          minGraduationYear: oppData.minGraduationYear,
          maxGraduationYear: oppData.maxGraduationYear,
          eligibleDepartments: oppData.eligibleDepartments,
          positionsCount: oppData.positionsCount,
          description: oppData.description,
        },
      });
    }

    for (const sReq of oppData.skills) {
      const skill = await prisma.skill.findFirst({
        where: { name: sReq.name },
      });

      if (skill) {
        const existingSkillReq = await prisma.opportunitySkill.findUnique({
          where: {
            opportunityId_skillId: {
              opportunityId: opp.id,
              skillId: skill.id,
            },
          },
        });

        if (!existingSkillReq) {
          await prisma.opportunitySkill.create({
            data: {
              opportunityId: opp.id,
              skillId: skill.id,
              requiredProficiency: sReq.requiredProficiency as any,
              weight: sReq.weight,
              isMandatory: sReq.isMandatory,
            },
          });
        }
      }
    }
  }

  console.log('Skill taxonomy, assessment question banks, career roles, and opportunities seeded successfully.');
}

async function main() {
  try {
    await seedTaxonomyAndAssessments();
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
