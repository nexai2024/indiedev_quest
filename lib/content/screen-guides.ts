export type ScreenGuideCopy = {
  title: string;
  blurb: string;
  steps: string[];
  defaultOpen?: boolean;
};

export const SCREEN_GUIDES: Record<string, ScreenGuideCopy> = {
  "/": {
    title: "The guild, in one sentence",
    blurb: "indiedev.quest is an RPG wrapper around real shipping. Sign in, accept a quest, submit live proof, earn XP and gold.",
    steps: [
      "Create a Clerk account, then open Guild Hall to see your level, gold, and class.",
      "Accept a quest, actually build the thing, then submit public URLs.",
      "Spend talent points on the skill tree. Fight coding katas in the Arena.",
    ],
  },
  "/dashboard": {
    title: "Guild Hall",
    blurb: "This is home. Saving your class puts a first quest on the log so you walk in with something to ship.",
    steps: [
      "Your starter quest is already accepted. Open it and ship the proof (or solve it in the Code Lab).",
      "XP fills the bar. Every 300 XP raises your level and grants 1 talent point.",
      "Gold is the in-guild currency for marketplace and some raid/mentor spends.",
    ],
  },
  "/quests": {
    title: "How quests work",
    blurb: "A quest is a real shipping task. Most quests need live URLs. Coding katas open the in-app Code Lab instead — passing tests completes those.",
    steps: [
      "Accept a quest so it pins in My Log.",
      "If the card says OPEN CODE LAB, solve it in the Arena editor. Otherwise ship the deliverable and submit live URLs.",
      "URL quests: submit the exact number of proof links. Coding quests: run tests until they pass.",
    ],
  },
  "/arena": {
    title: "The Arena is a solo coding gym",
    blurb: "You are not fighting other players. You pick a coding monster, edit TypeScript, and run real tests. Hint and AI review coach you. They do not decide if the monster dies.",
    steps: [
      "Pick a challenge card, or arrive from a coding quest. That is the monster. It starts at 100 HP.",
      "Replace the TODO stub and export the class or function named in the tests tab.",
      "Hit RUN TESTS & ATTACK. Tests run in a Web Worker with fake timers, then the server re-runs the same suite before paying XP.",
      "Stuck? Use Hint (one nudge) or AI review (bugs, not a rewrite). AI cannot pass the kata for you.",
      "All tests pass → HP goes to 0 and you get XP/gold. Coding quests also mark complete.",
    ],
    defaultOpen: true,
  },
  "/raids": {
    title: "Boss raids",
    blurb: "A raid is a shared HP pool. Everyone in the guild hits the same bug-boss. Your attack type is a labeled strike, not a code editor.",
    steps: [
      "Open an active raid and read the weakness.",
      "Pick SPELL / DEBUG / CRITICAL / ULTIMATE. Talent perks can change the damage.",
      "Submit the strike. The boss HP drops for everyone. Last hits still share the loot table.",
    ],
    defaultOpen: true,
  },
  "/hackathons": {
    title: "Guild hackathons",
    blurb: "A hackathon is a timed ship sprint. Hosts can attach an education partner and a real cash purse. Join, submit a live URL, and the host crowns one winner.",
    steps: [
      "Host: name it, pick a theme and window, then optionally pick GitHub Education, Vercel, Clerk, Neon, Stripe, Cloudflare, freeCodeCamp, or MDN and set the USD purse.",
      "The cash amount is recorded on the event. The guild does not auto-pay the winner — you coordinate payout with the partner.",
      "Builders join while it is upcoming or live, then submit a public demo URL before the clock ends.",
      "The host crowns one submitted build. Winner gets XP, gold, a badge, and the listed cash purse if a sponsor is attached. Hosts cannot award themselves.",
    ],
    defaultOpen: true,
  },
  "/vault": {
    title: "Proof vault",
    blurb: "Every URL you submitted for a quest lands here. Passed items are your public proof shelf. Failed items show why they were rejected.",
    steps: [
      "Open a submission to see the AI notes and each URL.",
      "If a GitHub link 404'd, connect GitHub or make the repo public, then resubmit from Quests.",
    ],
  },
  "/skill-tree": {
    title: "Skill tree",
    blurb: "Talent points come from leveling up (300 XP = 1 level = 1 point). Spend them on nodes. Unlocks change raid combat and a few gold/XP multipliers.",
    steps: [
      "Earn XP from quests, arena, and raids until you level up.",
      "Spend a point on an unlocked node. Prerequisites must be bought first.",
      "Raids use those perks. The tree is not cosmetic.",
    ],
  },
  "/marketplace": {
    title: "Marketplace",
    blurb: "Buy and list starter kits with gold. This is the in-guild shop, not Stripe checkout.",
    steps: [
      "Browse a listing and buy with gold if you have enough.",
      "List your own asset URL if you want to sell.",
    ],
  },
  "/mentorship": {
    title: "Guild mentors",
    blurb: "Mentors are vetted builders, not catalog NPCs. Apply with GitHub and shipped quests. Sessions escrow gold or cash, then pay the mentor minus a 15% guild cut.",
    steps: [
      "Apply: connect GitHub, finish 2 quests, attach live proof URLs. Peers with shipped quests vouch (2 vouches) or guild staff approve. That sets role = MENTOR.",
      "Mentors post time slots and can take Stripe Connect for cash. Live booking uses a slot. Async review is a cheaper URL ticket.",
      "Gold or cash goes into escrow. Mentor writes a recap, mentee rates 1–5, then the mentor is paid. Cancel before both close to refund gold.",
    ],
    defaultOpen: true,
  },
  "/tavern": {
    title: "Tavern",
    blurb: "A lo-fi room plus a retro CLI. Type /stats or /gold to inspect your character without leaving chat.",
    steps: [
      "Use the terminal commands for a quick character dump.",
      "Chat is public guild chatter, not quest validation.",
    ],
  },
  "/inventory": {
    title: "Inventory",
    blurb: "Badges and drops you have earned. Empty at the start of a new account — that is expected.",
    steps: ["Complete quests and raids to fill this out."],
  },
  "/onboarding": {
    title: "Create your hero first",
    blurb: "A Clerk account is not enough. Guild Hall, quests, and the Arena stay locked until you save a class and a primary goal.",
    steps: [
      "Pick a builder class.",
      "Pick a primary goal.",
      "Confirm the character. That unlocks Guild Hall and auto-accepts your first class quest.",
    ],
    defaultOpen: true,
  },
  "/settings": {
    title: "Hero settings",
    blurb: "Account, avatar, class, and how XP turns into levels. The Clerk panel edits email, password, and connected accounts.",
    steps: [
      "Use Align Class / Goal to change builder class.",
      "Connect GitHub here or from a quest submit if you need private-repo proof.",
    ],
  },
  "/leaderboards": {
    title: "Leaderboards",
    blurb: "Public ranking by XP. It only moves when you complete validated work.",
    steps: ["Ship quests and arena wins to climb."],
  },
  "/bounties": {
    title: "Bounties",
    blurb: "Gold-for-hire tasks posted by the guild. Claim, ship, collect.",
    steps: ["Read the bounty, submit proof, collect gold if it passes."],
  },
  "/projects": {
    title: "Projects",
    blurb: "A shelf for long-running builds, separate from one-off quests.",
    steps: ["Attach a live URL so the guild can see the product."],
  },
  "/courses": {
    title: "Guild academy",
    blurb: "Micro-courses: 2–4 modules, 3–4 chapters each. Read the chapter, pass the quiz at 70% to unlock the next one, then sit a final exam for XP, gold, and a graduate badge.",
    steps: [
      "Open a course. Chapters unlock in order — you cannot skip ahead.",
      "Each chapter ends with a short quiz. 70% is a pass (1 star), 85% is 2 stars, 100% is 3 stars.",
      "After every chapter is cleared, take the guild exam. First pass pays the course XP and gold purse.",
    ],
    defaultOpen: true,
  },
  "/pricing": {
    title: "Pricing",
    blurb: "Paid plans if you want extra mentor seats or marketplace reach. The core quest loop is free.",
    steps: ["Pick a plan only if you need the extras listed on the card."],
  },
  "/contact-us": {
    title: "Contact",
    blurb: "Reach the guild operators. Product bugs and quest disputes go here.",
    steps: ["Include the quest id and the URLs you submitted."],
  },
};

export function screenGuideFor(pathname: string): ScreenGuideCopy | null {
  if (SCREEN_GUIDES[pathname]) return SCREEN_GUIDES[pathname]!;
  const prefix = Object.keys(SCREEN_GUIDES)
    .filter((key) => key !== "/" && pathname.startsWith(key))
    .sort((a, b) => b.length - a.length)[0];
  return prefix ? SCREEN_GUIDES[prefix]! : null;
}
