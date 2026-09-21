export const EDUCATION_SPONSORS = [
  {
    id: "github-education",
    name: "GitHub Education",
    url: "https://education.github.com",
    blurb: "Student / teacher tooling and public shipping on GitHub.",
    defaultPrizeUsd: 2500,
    perk: "Winner spotlight + Student Pack callout",
  },
  {
    id: "vercel",
    name: "Vercel",
    url: "https://vercel.com/education",
    blurb: "Deploy the live demo they grade. Education and startup programs.",
    defaultPrizeUsd: 2000,
    perk: "Hosting credits for the winning team",
  },
  {
    id: "clerk",
    name: "Clerk",
    url: "https://clerk.com",
    blurb: "Auth that indie hackers actually ship. Strong education content.",
    defaultPrizeUsd: 1500,
    perk: "Auth credits + builder interview",
  },
  {
    id: "neon",
    name: "Neon",
    url: "https://neon.tech",
    blurb: "Serverless Postgres for weekend MVPs and classroom builds.",
    defaultPrizeUsd: 1500,
    perk: "Database credits for the champion",
  },
  {
    id: "stripe",
    name: "Stripe",
    url: "https://stripe.com",
    blurb: "The cash prize processor. Education and startup resources for getting paid.",
    defaultPrizeUsd: 3000,
    perk: "Payout via Stripe + Atlas-style resources",
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    url: "https://www.cloudflare.com/learning/",
    blurb: "Learning Center plus Workers for shipping at the edge.",
    defaultPrizeUsd: 1500,
    perk: "Workers credits",
  },
  {
    id: "freecodecamp",
    name: "freeCodeCamp",
    url: "https://www.freecodecamp.org",
    blurb: "The open education nonprofit most self-taught builders already trust.",
    defaultPrizeUsd: 1000,
    perk: "Publication / community feature",
  },
  {
    id: "mdn",
    name: "MDN Web Docs",
    url: "https://developer.mozilla.org",
    blurb: "The canonical web-platform curriculum. Mozilla's education backbone.",
    defaultPrizeUsd: 1000,
    perk: "Docs contribution spotlight",
  },
] as const;

export type EducationSponsorId = (typeof EDUCATION_SPONSORS)[number]["id"];

export function getEducationSponsor(id: unknown) {
  if (typeof id !== "string") return null;
  return EDUCATION_SPONSORS.find((sponsor) => sponsor.id === id) ?? null;
}

export function parseCashPrizeUsd(value: unknown, fallback = 0): number {
  const amount = Math.round(Number(value));
  if (!Number.isFinite(amount)) return fallback;
  return Math.min(50_000, Math.max(0, amount));
}
