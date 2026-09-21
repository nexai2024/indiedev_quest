export type CombatEffect = {
  arenaHints?: number;
  raidDamageFlat?: number;
  raidDamagePercent?: number;
  raidCritChance?: number;
  goldPercent?: number;
  goldFlat?: number;
  xpPercent?: number;
  marketplaceCashback?: number;
};

export type SkillNode = {
  id: string;
  tree: string;
  title: string;
  desc: string;
  cost: number;
  req: string | null;
  effect: CombatEffect;
};

function chain(
  tree: string,
  nodes: Array<{ id: string; title: string; desc: string; cost?: number; effect: CombatEffect }>
): SkillNode[] {
  return nodes.map((node, index) => ({
    id: node.id,
    tree,
    title: node.title,
    desc: node.desc,
    cost: node.cost ?? 1,
    req: index === 0 ? null : nodes[index - 1]!.id,
    effect: node.effect,
  }));
}

export const SKILL_NODES: SkillNode[] = [
  ...chain("Frontend Arcana", [
    { id: "fe_1", title: "Tailwind Mastery", desc: "+2% gold from combat drops.", effect: { goldPercent: 2 } },
    { id: "fe_2", title: "Framer Motion Spells", desc: "+1% raid damage.", effect: { raidDamagePercent: 1 } },
    { id: "fe_3", title: "Responsive Reliquary", desc: "+1% gold from combat drops.", effect: { goldPercent: 1 } },
    { id: "fe_4", title: "Accessibility Aegis", desc: "+10% XP from arena and raid victories.", effect: { xpPercent: 10 } },
    { id: "fe_5", title: "Component Alchemy", desc: "+2% gold from combat drops.", effect: { goldPercent: 2 } },
    { id: "fe_6", title: "Design Token Runes", desc: "+5 gold on every combat payout.", effect: { goldFlat: 5 } },
    { id: "fe_7", title: "Paint Performance", desc: "+5% gold from combat drops.", effect: { goldPercent: 5 } },
    { id: "fe_8", title: "Animation Archmage", desc: "+2% raid damage.", effect: { raidDamagePercent: 2 } },
    { id: "fe_9", title: "Design System Sovereign", desc: "+2% gold from combat drops.", effect: { goldPercent: 2 } },
    { id: "fe_10", title: "Pixel UI Legend", desc: "+5% raid damage and +2% gold.", cost: 2, effect: { raidDamagePercent: 5, goldPercent: 2 } },
  ]),
  ...chain("Backend Alchemy", [
    { id: "be_1", title: "Drizzle Schema Design", desc: "+4% XP from arena and raid victories.", effect: { xpPercent: 4 } },
    { id: "be_2", title: "Server Actions Mastery", desc: "+1 arena combat hint line.", effect: { arenaHints: 1 } },
    { id: "be_3", title: "API Route Warden", desc: "+8 flat raid damage.", effect: { raidDamageFlat: 8 } },
    { id: "be_4", title: "Auth Sigil", desc: "+1% gold from combat drops.", effect: { goldPercent: 1 } },
    { id: "be_5", title: "Transaction Forge", desc: "+1% raid damage.", effect: { raidDamagePercent: 1 } },
    { id: "be_6", title: "Index Oracle", desc: "+4% gold from combat drops.", effect: { goldPercent: 4 } },
    { id: "be_7", title: "Cache Layer", desc: "Unlocks arena combat hints (+1 hint line).", effect: { arenaHints: 1 } },
    { id: "be_8", title: "Webhook Sentinel", desc: "+2% XP from arena and raid victories.", effect: { xpPercent: 2 } },
    { id: "be_9", title: "Job Queue Alchemist", desc: "+25 flat raid damage.", effect: { raidDamageFlat: 25 } },
    { id: "be_10", title: "Backend Archon", desc: "+5% raid damage and +5% combat XP.", cost: 2, effect: { raidDamagePercent: 5, xpPercent: 5 } },
  ]),
  ...chain("AI Sorcery", [
    { id: "ai_1", title: "Prompt Engineering", desc: "+1 arena combat hint line.", effect: { arenaHints: 1 } },
    { id: "ai_2", title: "RAG Vector Pipelines", desc: "+1 arena combat hint line.", effect: { arenaHints: 1 } },
    { id: "ai_3", title: "Tool Calling Glyphs", desc: "+4% gold from combat drops.", effect: { goldPercent: 4 } },
    { id: "ai_4", title: "Streaming Oracles", desc: "+2% raid damage.", effect: { raidDamagePercent: 2 } },
    { id: "ai_5", title: "Eval Rituals", desc: "+5 gold on every combat payout.", effect: { goldFlat: 5 } },
    { id: "ai_6", title: "Agent Memory", desc: "+10 flat raid damage.", effect: { raidDamageFlat: 10 } },
    { id: "ai_7", title: "Guardrail Glyphs", desc: "+5% raid crit chance (1.5x damage).", effect: { raidCritChance: 5 } },
    { id: "ai_8", title: "Fine-tune Familiar", desc: "+2% gold from combat drops.", effect: { goldPercent: 2 } },
    { id: "ai_9", title: "Multi-Agent Conclave", desc: "+2% raid damage.", effect: { raidDamagePercent: 2 } },
    { id: "ai_10", title: "AI Archmage", desc: "+6% raid damage.", cost: 2, effect: { raidDamagePercent: 6 } },
  ]),
  ...chain("Monetization Bard", [
    { id: "mon_1", title: "Stripe Connect", desc: "+10% gold drops and 10% marketplace cashback.", effect: { goldPercent: 10, marketplaceCashback: 10 } },
    { id: "mon_2", title: "SaaS Pricing Strategy", desc: "+2% gold from combat drops.", effect: { goldPercent: 2 } },
    { id: "mon_3", title: "Checkout Flow", desc: "+20 gold on every combat payout.", effect: { goldFlat: 20 } },
    { id: "mon_4", title: "Trial Conversion", desc: "+3% XP from arena and raid victories.", effect: { xpPercent: 3 } },
    { id: "mon_5", title: "Usage Metering", desc: "+2% gold from combat drops.", effect: { goldPercent: 2 } },
    { id: "mon_6", title: "Invoice Ballad", desc: "+8 gold on every combat payout.", effect: { goldFlat: 8 } },
    { id: "mon_7", title: "Churn Ward", desc: "+12 flat raid damage.", effect: { raidDamageFlat: 12 } },
    { id: "mon_8", title: "Launch Spell", desc: "+3% XP from arena and raid victories.", effect: { xpPercent: 3 } },
    { id: "mon_9", title: "Marketplace Merchant", desc: "+3% gold from combat drops.", effect: { goldPercent: 3 } },
    { id: "mon_10", title: "Revenue Archon", desc: "+8% gold from combat drops.", cost: 2, effect: { goldPercent: 8 } },
  ]),
  ...chain("DevOps Guild", [
    { id: "ops_1", title: "CI Pipeline Adept", desc: "+2% XP from arena and raid victories.", effect: { xpPercent: 2 } },
    { id: "ops_2", title: "Docker Familiar", desc: "+1% gold from combat drops.", effect: { goldPercent: 1 } },
    { id: "ops_3", title: "Preview Deploys", desc: "+5 gold on every combat payout.", effect: { goldFlat: 5 } },
    { id: "ops_4", title: "Observability", desc: "+4% gold and +10 flat raid damage.", effect: { goldPercent: 4, raidDamageFlat: 10 } },
    { id: "ops_5", title: "Secret Vault", desc: "+3% raid damage.", effect: { raidDamagePercent: 3 } },
    { id: "ops_6", title: "Edge Runtime", desc: "+20 flat raid damage.", effect: { raidDamageFlat: 20 } },
    { id: "ops_7", title: "Load Test Hammer", desc: "+3% XP from arena and raid victories.", effect: { xpPercent: 3 } },
    { id: "ops_8", title: "Incident Runebook", desc: "+1 arena combat hint line.", effect: { arenaHints: 1 } },
    { id: "ops_9", title: "Infra as Code", desc: "+3% gold from combat drops.", effect: { goldPercent: 3 } },
    { id: "ops_10", title: "SRE Legend", desc: "+5% raid crit chance and +5% raid damage.", cost: 2, effect: { raidCritChance: 5, raidDamagePercent: 5 } },
  ]),
];
