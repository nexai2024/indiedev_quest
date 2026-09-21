export type QuizQuestion = {
  prompt: string;
  choices: string[];
  answerIndex: number;
};

export type Quiz = {
  title: string;
  questions: QuizQuestion[];
};

export type AcademyChapter = {
  chapterId: string;
  title: string;
  xp: number;
  lore: string;
  body: string[];
  quiz: Quiz;
};

export type AcademyModule = {
  moduleId: string;
  title: string;
  blurb: string;
  chapters: AcademyChapter[];
};

export type AcademyCourse = {
  courseId: string;
  title: string;
  tagline: string;
  classHint: string;
  difficulty: "Novice" | "Adept" | "Veteran";
  hours: string;
  xpReward: number;
  goldReward: number;
  modules: AcademyModule[];
  finalQuiz: Quiz;
};

function q(prompt: string, choices: string[], answerIndex: number): QuizQuestion {
  return { prompt, choices, answerIndex };
}

export const ACADEMY_COURSES: AcademyCourse[] = [
  {
    courseId: "first-coin-mvp",
    title: "First Coin MVP",
    tagline: "Scope, auth, and a live checkout slice in three modules.",
    classHint: "Full-Stack Artisan",
    difficulty: "Novice",
    hours: "3–4 hrs",
    xpReward: 400,
    goldReward: 180,
    modules: [
      {
        moduleId: "scope",
        title: "Module 1 · Cut the Boss Fight",
        blurb: "A weekend MVP is one loop, not a platform.",
        chapters: [
          {
            chapterId: "one-loop",
            title: "One loop, one user",
            xp: 40,
            lore: "You enter the guild war room. The map is too big. Burn half of it.",
            body: [
              "An MVP is the smallest product that lets a stranger complete one valuable loop without you in the room.",
              "Write the loop as: who → does what → gets what. If you need two personas, you have two products.",
              "Cut admin panels, notifications, and settings. Those are loot chests after the boss is dead.",
            ],
            quiz: {
              title: "Chapter check",
              questions: [
                q("An MVP should primarily prove:", ["Every feature on the roadmap", "One stranger can finish one valuable loop", "The brand guidelines", "A mobile app and a web app"], 1),
                q("The fastest way to shrink scope is:", ["Add a second persona", "Write the loop as who / does what / gets what", "Start with the admin dashboard", "Buy a theme"], 1),
                q("Settings, notifications, and admin tools belong:", ["In v0.1 before auth", "After the core loop works", "In the marketing site only", "In the database schema first"], 1),
              ],
            },
          },
          {
            chapterId: "fake-door",
            title: "Fake doors beat extra screens",
            xp: 40,
            lore: "A wooden door painted like steel. If nobody pushes it, do not forge the steel.",
            body: [
              "A fake door is a button or pricing page that looks real. Clicks tell you demand before you build the dungeon behind it.",
              "Log the click, show an honest waitlist, and count converting visitors — not vanity page views.",
              "If nobody clicks, you learned cheaper than writing the feature.",
            ],
            quiz: {
              title: "Chapter check",
              questions: [
                q("A fake door is useful because it:", ["Replaces user research forever", "Measures demand before you build the feature", "Tricks users into paying", "Is required by Stripe"], 1),
                q("After a fake-door click you should:", ["Charge immediately with no product", "Show an honest waitlist and log the click", "Redirect to a random blog", "Delete the button"], 1),
                q("The metric that matters on a fake door is:", ["Bounce rate on your about page", "Clicks / visitors on that CTA", "Number of GitHub stars", "Lighthouse score"], 1),
              ],
            },
          },
          {
            chapterId: "ship-slice",
            title: "Ship a vertical slice",
            xp: 45,
            lore: "One corridor all the way to the treasure, not ten hallways with no doors.",
            body: [
              "A vertical slice is UI + API + database for one path, deployed.",
              "Horizontal work (all screens, no backend) looks busy and teaches you nothing about production.",
              "Deploy on day one so 'works on my machine' cannot hide.",
            ],
            quiz: {
              title: "Chapter check",
              questions: [
                q("A vertical slice includes:", ["Only Figma frames", "UI, API, and data for one path in production", "Every database table you might need", "A mobile rewrite"], 1),
                q("You deploy early so that:", ["DNS looks impressive", "Production issues show up before the hackathon ends", "You skip tests forever", "SEO is finished"], 1),
                q("Horizontal slicing is risky because:", ["It is slower to draw", "You postpone the hard production path", "Designers dislike it", "Postgres forbids it"], 1),
              ],
            },
          },
        ],
      },
      {
        moduleId: "auth",
        title: "Module 2 · Guard the Gate",
        blurb: "Accounts exist so progress and payments have an owner.",
        chapters: [
          {
            chapterId: "identity",
            title: "Identity is not a profile page",
            xp: 45,
            lore: "The bouncer does not need your life story. They need to know it is you.",
            body: [
              "Auth answers 'who is this request?' A profile page is cosmetics.",
              "Use a hosted identity provider (you already have Clerk in this guild) so you are not storing password hashes on weekend one.",
              "Gate the one loop. Public marketing can stay public.",
            ],
            quiz: {
              title: "Chapter check",
              questions: [
                q("Authentication answers:", ["How pretty the HUD is", "Which user owns this request", "How much gold they have", "Which CSS theme they picked"], 1),
                q("For a first MVP, password hashing in your own table is:", ["Required by law", "Usually worse than a hosted identity provider", "Faster than Clerk", "The same as OAuth"], 1),
                q("You should protect:", ["The marketing homepage first", "The core loop that writes user data", "Only the footer", "Open graph images"], 1),
              ],
            },
          },
          {
            chapterId: "session",
            title: "Sessions, not vibes",
            xp: 45,
            lore: "A signed token is a sealed letter. Anyone can carry it; only the seal proves it.",
            body: [
              "Server routes must verify the session. Never trust a userId from the client body.",
              "Put the user id from the verified session into inserts. That is how quests stay owned.",
              "Webhooks (billing, GitHub) use signatures, not your page session.",
            ],
            quiz: {
              title: "Chapter check",
              questions: [
                q("A POST body userId from the browser is:", ["Always safe", "Spoofable; verify the session on the server", "Required by REST", "Better than cookies"], 1),
                q("When inserting a row you should take user id from:", ["The URL slug", "The verified session / token", "localStorage", "The Referer header"], 1),
                q("Stripe or GitHub webhooks authenticate with:", ["The user's Clerk cookie", "A signature / secret on the webhook", "CORS", "robots.txt"], 1),
              ],
            },
          },
          {
            chapterId: "empty-start",
            title: "Empty hero, real name",
            xp: 50,
            lore: "New adventurers spawn with zero gold. Do not gift them a legendary sword.",
            body: [
              "New accounts start at level 1, 0 XP, 0 gold. Catalog content is not auto-assigned.",
              "Show their real display name. Guest / demo identities train the wrong habit.",
              "Onboarding (class + goal) is what turns a login into a character.",
            ],
            quiz: {
              title: "Chapter check",
              questions: [
                q("A brand-new user should receive:", ["A pre-filled inventory", "Zero XP and gold until they ship", "Admin role", "Someone else's quests"], 1),
                q("The username in the HUD should come from:", ["Guest Dev", "The signed-in identity", "Math.random", "A CSV of influencers"], 1),
                q("A Clerk login without class and goal is:", ["A finished hero", "An account, not yet a character", "A banned user", "A webhook"], 1),
              ],
            },
          },
        ],
      },
      {
        moduleId: "paid",
        title: "Module 3 · Take the Coin",
        blurb: "If nobody can pay, you do not have a business loop.",
        chapters: [
          {
            chapterId: "price",
            title: "Price is a sentence",
            xp: 50,
            lore: "The shopkeeper who shrugs at the price sells nothing.",
            body: [
              "Publish a price before you have every feature. The number is a hypothesis.",
              "Charge for the outcome (shipped MVP, removed toil), not for 'access to the platform'.",
              "A $0 forever plan with no upgrade is a hobby, not an experiment.",
            ],
            quiz: {
              title: "Chapter check",
              questions: [
                q("You should put a price on the site:", ["Only after 10,000 users", "As soon as you want to test willingness to pay", "Never, gold is enough", "In the README only"], 1),
                q("Price should describe:", ["Your tech stack", "The outcome the buyer wants", "How many microservices you run", "Your favorite font"], 1),
                q("A free plan with no paid path:", ["Validates revenue", "Cannot tell you if anyone would pay", "Is required for YC", "Replaces interviews"], 1),
              ],
            },
          },
          {
            chapterId: "checkout",
            title: "Checkout is a quest submit",
            xp: 55,
            lore: "The final altar: card in, receipt out, access granted.",
            body: [
              "Use a hosted checkout (Stripe) so you are not holding raw cards.",
              "On success, grant the entitlement in your database from the webhook, not only from the success URL.",
              "The success URL can lie. The webhook is the proof of payment.",
            ],
            quiz: {
              title: "Chapter check",
              questions: [
                q("Raw card numbers in your database are:", ["A flex", "A compliance nightmare you should avoid with hosted checkout", "Faster than Stripe", "Required for indie hackers"], 1),
                q("Grant paid access when:", ["The user hits /success", "The billing webhook says the payment succeeded", "They tweet at you", "They star the repo"], 1),
                q("The success URL is:", ["Cryptographically signed by Visa", "A convenience redirect, not proof of payment", "The webhook secret", "PCI scope"], 1),
              ],
            },
          },
          {
            chapterId: "first-dollar",
            title: "The first stranger dollar",
            xp: 60,
            lore: "Friends buying is a side quest. A stranger buying is the main quest.",
            body: [
              "Tell five people with the problem. Count replies, not likes.",
              "A stranger payment teaches more than a month of polishing the HUD.",
              "Write down why they paid. That sentence is your next landing page.",
            ],
            quiz: {
              title: "Chapter check",
              questions: [
                q("The strongest early revenue signal is:", ["Your cousin's pity purchase", "A stranger paying for the outcome", "Ad spend", "Dribbble likes"], 1),
                q("After the first payment, capture:", ["Their favorite color", "Why they paid, in their words", "Their Social Security number", "A 40-page survey"], 1),
                q("Talking to five people with the problem is:", ["Optional fluff", "Cheaper than building the wrong loop", "A replacement for shipping", "Only for enterprises"], 1),
              ],
            },
          },
        ],
      },
    ],
    finalQuiz: {
      title: "Guild exam · First Coin MVP",
      questions: [
        q("The core of an MVP is:", ["Many half-built features", "One complete valuable loop in production", "A pitch deck", "A native iOS app"], 1),
        q("User ids on writes come from:", ["The request body", "The verified session", "query strings", "CSS variables"], 1),
        q("Paid access should flip when:", ["/success loads", "The payment webhook confirms", "They log in twice", "They join Discord"], 1),
        q("A fake door measures:", ["CPU usage", "Demand before you build", "Bundle size", "Uptime"], 1),
        q("Friends paying:", ["Equals product-market fit", "Is weaker evidence than a stranger paying", "Means you should raise a Series A", "Replaces auth"], 1),
      ],
    },
  },
  {
    courseId: "llm-feature-sprint",
    title: "LLM Feature Sprint",
    tagline: "Ship a model-backed feature that tests can still fail.",
    classHint: "AI Builder",
    difficulty: "Adept",
    hours: "2.5–3.5 hrs",
    xpReward: 380,
    goldReward: 160,
    modules: [
      {
        moduleId: "truth",
        title: "Module 1 · The Model Is Not the Referee",
        blurb: "LLMs draft. Tests and users decide.",
        chapters: [
          {
            chapterId: "hint-not-grade",
            title: "Hints, not grades",
            xp: 45,
            lore: "The oracle whispers. The arena still has rules.",
            body: [
              "Use a model for hints, reviews, and drafts. Do not let it declare a kata passed.",
              "Deterministic tests (or a human with a rubric) are the referee.",
              "If the model writes the whole solution, the adventurer did not level up.",
            ],
            quiz: {
              title: "Chapter check",
              questions: [
                q("In this guild, AI should:", ["Award XP by itself", "Coach; tests or a rubric decide pass/fail", "Replace the product", "Store passwords"], 1),
                q("A coding kata is complete when:", ["The model says 'looks good'", "The test suite passes", "The prompt is long", "You used GPT-5"], 1),
                q("Pasting a full solution from a model:", ["Is the learning objective", "Skips the skill the course is training", "Is required for RAG", "Fixes flaky tests"], 1),
              ],
            },
          },
          {
            chapterId: "eval",
            title: "Golden prompts",
            xp: 50,
            lore: "Twenty labeled monsters. If the spell fails on them, it is not ready for the raid.",
            body: [
              "Keep a tiny eval set: inputs you care about and the behavior you expect.",
              "Run it when you change the prompt. Prompt edits without evals are rolling dice.",
              "Twenty cases beat a vibes-only demo for catching regressions.",
            ],
            quiz: {
              title: "Chapter check",
              questions: [
                q("An eval set is:", ["Random tweets", "Labeled examples you rerun after prompt changes", "The system prompt itself", "A vector database"], 1),
                q("You rerun evals when:", ["The moon is full", "You change the prompt or model", "You update CSS", "Never"], 1),
                q("Vibes-only demos miss:", ["Color contrast", "Regressions on known cases", "DNS", "CORS"], 1),
              ],
            },
          },
          {
            chapterId: "cost",
            title: "Tokens are gold",
            xp: 50,
            lore: "Every whisper to the oracle spends from the party purse.",
            body: [
              "Log feature, user, tokens, and estimated USD. Invisible cost becomes a surprise boss.",
              "Cache deterministic prompts. Cap max tokens. Stream so the UI feels fast without extra spend.",
              "A cost dashboard is a product feature, not a nice-to-have, once anyone besides you uses the model.",
            ],
            quiz: {
              title: "Chapter check",
              questions: [
                q("You should log LLM calls with:", ["Only the poetry of the prompt", "Feature, user, tokens, and estimated cost", "Nothing, it is free", "The user's password"], 1),
                q("A practical way to cut spend is:", ["Always use the largest model", "Cache repeated prompts and cap max tokens", "Disable HTTPS", "Store cards yourself"], 1),
                q("Streaming tokens mainly improves:", ["Database indexes", "Perceived latency of the reply", "SEO", "Cookie size"], 1),
              ],
            },
          },
        ],
      },
      {
        moduleId: "ship-ai",
        title: "Module 2 · Ship the Feature",
        blurb: "Retrieval, tools, and a UI that does not freeze.",
        chapters: [
          {
            chapterId: "rag",
            title: "Ground it or guess",
            xp: 55,
            lore: "The seer who reads your own scrolls beats the seer who invents kingdoms.",
            body: [
              "RAG retrieves your docs/data, then the model answers with that context.",
              "Show citations or snippets so the user can distrust a bad retrieve.",
              "Garbage retrieval makes confident nonsense. Measure hit rate, not just fluency.",
            ],
            quiz: {
              title: "Chapter check",
              questions: [
                q("RAG stands for using:", ["Random ASCII graphics", "Retrieved context from your data before answering", "Only fine-tuning", "CSS grids"], 1),
                q("Citations help because:", ["They increase token cost always", "Users can check whether the retrieve was relevant", "They replace evals", "They hide hallucinations"], 1),
                q("If retrieval is wrong, the model will often:", ["Refuse to speak", "Sound confident anyway", "Fix the index itself", "Lower your Stripe bill"], 1),
              ],
            },
          },
          {
            chapterId: "tools",
            title: "Give it one tool",
            xp: 55,
            lore: "A wizard with one reliable wand beats a wizard with twelve broken staves.",
            body: [
              "Tool calling lets the model request a function: search, DB read, HTTP.",
              "Keep the tool schema tiny. Validate arguments on the server like any other API.",
              "Never let the model invent SQL you execute unsanitized.",
            ],
            quiz: {
              title: "Chapter check",
              questions: [
                q("A tool call is:", ["The user clicking a button only", "The model requesting a function with arguments", "A CSS animation", "OAuth"], 1),
                q("Tool arguments must be:", ["Trusted blindly", "Validated on the server", "Stored in localStorage", "Printed in the footer"], 1),
                q("Executing model-written SQL without checks is:", ["Fine in production", "A classic injection / data-loss risk", "Required for RAG", "Faster than indexes"], 1),
              ],
            },
          },
          {
            chapterId: "stream-ui",
            title: "Stream the spell",
            xp: 55,
            lore: "Do not make the party stare at a silent stone for eight seconds.",
            body: [
              "Stream tokens to the UI so waiting feels like progress.",
              "Keep a cancel button. Users abort bad prompts; you abort spend.",
              "Disable the send button while in-flight. Double submits double the gold drain.",
            ],
            quiz: {
              title: "Chapter check",
              questions: [
                q("Streaming the reply is mainly for:", ["SEO", "Perceived speed and feedback", "Postgres vacuum", "TLS"], 1),
                q("A cancel control is useful because:", ["It looks medieval", "It stops work and token spend", "It replaces auth", "It stores embeddings"], 1),
                q("Double-submitting the same prompt:", ["Is a free eval", "Can double latency and cost", "Improves retrieval", "Is required by OpenAI"], 1),
              ],
            },
          },
        ],
      },
    ],
    finalQuiz: {
      title: "Guild exam · LLM Feature Sprint",
      questions: [
        q("Who should declare a coding kata passed?", ["The LLM", "Deterministic tests", "A viral tweet", "The CSS linter"], 1),
        q("Eval sets exist to:", ["Decorate the README", "Catch prompt/model regressions", "Replace users", "Store API keys"], 1),
        q("RAG is for:", ["Avoiding a database", "Grounding answers in your data", "Skipping HTTPS", "Replacing checkout"], 1),
        q("Tool arguments belong:", ["Unchecked in eval()", "Validated server-side", "In the user's cookie jar", "In robots.txt"], 1),
        q("You log tokens because:", ["Logs are pretty", "Cost and abuse show up there", "Clerk requires it", "DNSSEC"], 1),
      ],
    },
  },
];

export function getAcademyCourse(courseId: string) {
  return ACADEMY_COURSES.find((course) => course.courseId === courseId) ?? null;
}

export function flattenChapters(course: AcademyCourse): AcademyChapter[] {
  return course.modules.flatMap((module) => module.chapters);
}

export function findChapter(course: AcademyCourse, chapterId: string) {
  return flattenChapters(course).find((chapter) => chapter.chapterId === chapterId) ?? null;
}

export function isChapterUnlocked(course: AcademyCourse, completedIds: string[], chapterId: string): boolean {
  const chapters = flattenChapters(course);
  const index = chapters.findIndex((chapter) => chapter.chapterId === chapterId);
  if (index <= 0) return index === 0;
  const previous = chapters[index - 1];
  return Boolean(previous && completedIds.includes(previous.chapterId));
}

export function allChaptersComplete(course: AcademyCourse, completedIds: string[]): boolean {
  return flattenChapters(course).every((chapter) => completedIds.includes(chapter.chapterId));
}

export function publicQuiz(quiz: Quiz) {
  return {
    title: quiz.title,
    questions: quiz.questions.map((question) => ({
      prompt: question.prompt,
      choices: question.choices,
    })),
  };
}

export function publicCourse(course: AcademyCourse) {
  return {
    courseId: course.courseId,
    title: course.title,
    tagline: course.tagline,
    classHint: course.classHint,
    difficulty: course.difficulty,
    hours: course.hours,
    xpReward: course.xpReward,
    goldReward: course.goldReward,
    moduleCount: course.modules.length,
    chapterCount: flattenChapters(course).length,
    modules: course.modules.map((module) => ({
      moduleId: module.moduleId,
      title: module.title,
      blurb: module.blurb,
      chapters: module.chapters.map((chapter) => ({
        chapterId: chapter.chapterId,
        title: chapter.title,
        xp: chapter.xp,
        lore: chapter.lore,
        body: chapter.body,
        quiz: publicQuiz(chapter.quiz),
      })),
    })),
    finalQuiz: publicQuiz(course.finalQuiz),
  };
}
