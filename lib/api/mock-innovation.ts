import type { CritiqueResult, DiscoveryIdea, IdeaNode } from "@/lib/types/innovation";

const wait = (ms = 650) => new Promise((resolve) => setTimeout(resolve, ms));
const now = () => new Date().toISOString();

export const discoveryCatalog: DiscoveryIdea[] = [
  { title: "Edge AI", description: "Run intelligent decisions close to where data is created—fast, private, and resilient.", industry: "Distributed intelligence", applications: ["Healthcare", "Manufacturing", "Mobility"], novelty: 84 },
  { title: "Federated Learning", description: "Train shared models across decentralized data without centralizing sensitive records.", industry: "Privacy-preserving AI", applications: ["Finance", "Healthcare", "Consumer"], novelty: 79 },
  { title: "Digital Twins", description: "Continuously simulate physical systems with live operational data and predictive models.", industry: "Simulation", applications: ["Cities", "Energy", "Industry"], novelty: 75 },
  { title: "Neuromorphic Computing", description: "Brain-inspired processors deliver event-driven intelligence at ultra-low power.", industry: "Advanced computing", applications: ["Robotics", "Sensors", "Aerospace"], novelty: 92 },
  { title: "Quantum Sensing", description: "Use quantum effects to measure time, fields, motion, and materials with extreme precision.", industry: "Quantum technology", applications: ["Navigation", "Climate", "Medicine"], novelty: 95 },
  { title: "Bio-inspired Sensors", description: "Mimic biological detection systems for responsive, efficient environmental awareness.", industry: "Bioengineering", applications: ["Food", "Environment", "Wearables"], novelty: 88 },
  { title: "AI-powered Robotics", description: "Combine adaptive models with embodied systems that learn from real-world interaction.", industry: "Robotics", applications: ["Logistics", "Care", "Construction"], novelty: 81 },
  { title: "Confidential Computing", description: "Protect data while it is actively being processed inside hardware-isolated environments.", industry: "Cybersecurity", applications: ["Cloud", "Government", "Research"], novelty: 77 },
];

const variationSeeds = [
  ["Healthcare", "Local patient monitoring", "Spot risk patterns on-device while keeping sensitive health data close to the patient."],
  ["Cybersecurity", "On-device threat detection", "Detect novel attacks at the edge before sensitive telemetry leaves the local network."],
  ["Agriculture", "Autonomous crop analysis", "Give field equipment real-time crop health insight without relying on connectivity."],
  ["Education", "Personalized offline tutoring", "Adapt lessons locally for learners with limited bandwidth and stronger privacy needs."],
  ["Manufacturing", "Predictive machine diagnostics", "Identify equipment anomalies in milliseconds and reduce unplanned downtime."],
  ["Retail", "Smart inventory monitoring", "Understand shelf conditions locally while minimizing collection of customer data."],
  ["Transportation", "Intelligent traffic systems", "Coordinate intersections with low-latency local models and graceful offline operation."],
  ["Energy", "Local grid optimization", "Balance distributed loads and generation at neighborhood scale in real time."],
  ["Environment", "Early wildfire detection", "Fuse visual and environmental signals locally for earlier, more resilient alerts."],
  ["Consumer", "Private home assistants", "Offer ambient assistance with personal data processed inside the home."],
] as const;

export async function discoverIdeas(prompt: string): Promise<DiscoveryIdea[]> {
  await wait();
  const normalized = prompt.toLowerCase();
  if (/emerging|what('s| is) next|new technolog/.test(normalized)) return discoveryCatalog.slice(0,6);
  const subject = prompt
    .replace(/^(discover|explore|generate|ideas? (for|about)|what can|how can|applications? of)\s+/i, "")
    .replace(/\?+$/, "")
    .trim();
  const display = subject.length>2 ? subject.charAt(0).toUpperCase()+subject.slice(1) : "Your focus";
  const concepts = [
    ["Operations", `${display} Operations Copilot`, `Turn repetitive workflows around ${subject} into guided, measurable decisions for frontline teams.`],
    ["Trust & Safety", `Trusted ${display} Exchange`, `Create a secure, transparent way to use ${subject} while preserving oversight, consent, and accountability.`],
    ["Customer Experience", `Personalized ${display} Journey`, `Adapt ${subject} experiences to individual needs without losing clarity or user control.`],
    ["Access & Inclusion", `${display} Access Network`, `Lower the cost and expertise barriers that prevent more people from benefiting from ${subject}.`],
    ["Sustainability", `Resource-Smart ${display}`, `Reduce the energy, materials, and operational waste associated with ${subject}.`],
    ["New Business Models", `${display} Outcomes Platform`, `Package ${subject} around verified outcomes, shared incentives, and a repeatable service model.`],
  ] as const;
  return concepts.map(([industry,title,description],index)=>({title,description,industry,applications:[industry,display,"Focused concept"],novelty:76+((index*5)%18),score:76+((index*5)%18)}));
}

export async function expandIdea(idea: IdeaNode, count = 10): Promise<IdeaNode[]> {
  await wait(800);
  const contextualSeeds = [
    ["Workflow", `${idea.title} Workflow Assistant`, `Guide the highest-friction workflow with a focused, human-in-the-loop assistant.`],
    ["Trust & Safety", `Trusted ${idea.title}`, `Add transparent safeguards, auditability, and clear user control to the concept.`],
    ["Analytics", `${idea.title} Decision Lens`, `Turn the concept's signals into timely, explainable recommendations.`],
    ["Customer Experience", `Personalized ${idea.title}`, `Adapt the experience to individual context without unnecessary data collection.`],
    ["Access", `Low-Cost ${idea.title}`, `Make the idea practical for smaller teams and underserved users.`],
    ["Sustainability", `Resource-Efficient ${idea.title}`, `Reduce energy, materials, and operational waste across the concept.`],
    ["Collaboration", `${idea.title} Coordination Network`, `Help multiple organizations collaborate while retaining control of their data.`],
    ["Small Business", `${idea.title} Starter Kit`, `Package a simple, fast-to-adopt version for small organizations.`],
    ["Research", `${idea.title} Experiment Lab`, `Create a safe environment to test assumptions and collect evidence quickly.`],
    ["Platform", `${idea.title} Ecosystem`, `Open the core capability to partners through reusable workflows and integrations.`],
  ] as const;
  const seeds=/edge ai/i.test(idea.title)?variationSeeds:contextualSeeds;
  return seeds.slice(0, count).map(([industry, title, description], index) => ({
    id: `${idea.id}-v${index + 1}`,
    title: idea.generation ? `${title} · Gen ${idea.generation + 1}` : title,
    description: `${description} Built from ${idea.title}.`,
    industry,
    generation: idea.generation + 1,
    parentIds: [idea.id],
    kind: "variation",
    score: 70 + ((index * 7 + idea.generation * 3) % 24),
    createdAt: now(),
  }));
}

export async function mergeIdeas(ideas: IdeaNode[]): Promise<IdeaNode> {
  await wait(700);
  const industries = Array.from(new Set(ideas.map((idea) => idea.industry))).slice(0, 2).join(" + ");
  const privacy = ideas.some((idea) => /privacy|federated|security/i.test(`${idea.title} ${idea.description}`));
  const title = privacy ? "Privacy-Preserving Intelligent Network" : `${ideas[0].title.split(" ").slice(0, 2).join(" ")} Fusion Network`;
  return { id: `merge-${Date.now()}`, title, description: `Combines ${ideas.map((idea) => idea.title).join(" with ")} into one coordinated, testable concept.`, industry: industries, generation: Math.max(...ideas.map((idea) => idea.generation)) + 1, parentIds: ideas.map((idea) => idea.id), kind: "merged", score: 88, createdAt: now() };
}

export async function critiqueIdea(idea: IdeaNode): Promise<CritiqueResult> {
  await wait(900);
  const evaluations = [
    { agentId: "technical" as const, agentName: "Technical Feasibility", score: 6.8, summary: "The architecture is credible, but deployment variability and integration cost are the dominant risks.", strengths: ["Can use mature edge runtimes", "Clear phased prototype path"], weaknesses: ["Heterogeneous hardware", "Monitoring distributed models"], recommendations: ["Start with one certified device profile", "Define offline fallback behavior"] },
    { agentId: "market" as const, agentName: "Market Opportunity", score: 8.6, summary: "The pain point is urgent and buyers can quantify the value of faster, more private decisions.", strengths: ["Strong compliance tailwind", "Measurable operational savings"], weaknesses: ["Long enterprise sales cycles"], recommendations: ["Lead with a narrow ROI proof", "Partner with an incumbent channel"] },
    { agentId: "strategy" as const, agentName: "Strategic Fit", score: 7.7, summary: "A strong fit for organizations with trusted domain access, deployment expertise, and recurring service relationships.", strengths: ["Defensible workflow data", "Expands existing customer relationships"], weaknesses: ["Requires domain-specific delivery"], recommendations: ["Select a beachhead industry", "Package reusable deployment playbooks"] },
    { agentId: "future" as const, agentName: "Future Readiness", score: 8.2, summary: "On-device intelligence and privacy regulation reinforce the concept, while hardware abstraction will improve over time.", strengths: ["Aligned with distributed AI", "Scales with cheaper accelerators"], weaknesses: ["Standards are still converging"], recommendations: ["Use portable model formats", "Track regulation by region"] },
  ];
  return { ideaId: idea.id, evaluations, overallSummary: `${idea.title} has a compelling value case with manageable execution risk if the first deployment is sharply scoped.`, conflicts: [{ id: `conflict-${idea.id}`, agentIds: ["technical", "market"], issue: "Strong demand versus implementation cost", perspectives: [{ agentId: "technical", position: "Device diversity and integration make early deployments expensive." }, { agentId: "market", position: "Customers show strong demand, but remain price-sensitive." }], resolution: "Begin on existing, supported edge hardware and price a narrow outcome-based pilot." }] };
}

export async function improveIdea(idea: IdeaNode): Promise<IdeaNode> {
  await wait(750);
  return { ...idea, id: `improved-${idea.id}-${Date.now()}`, title: `Practical ${idea.title}`, description: `${idea.description} The revised concept starts on existing hardware, narrows the first use case, and adds measurable pilot outcomes.`, generation: idea.generation + 1, parentIds: [idea.id], kind: "improved", score: Math.min(96, (idea.score ?? 76) + 8), createdAt: now(), changes: "Reduced infrastructure cost, narrowed the initial deployment, and added a measurable validation plan." };
}
