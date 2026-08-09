import { NextResponse } from "next/server";
import { AGENT_ROLES } from "../../../lib/agentic/roles";
import { listModels } from "../../../lib/agentic/model-router";
import { listSkills } from "../../../lib/agentic/skills";
import { listTools } from "../../../lib/agentic/tools";

export async function GET() {
  return NextResponse.json({
    name: "W0 Agentic Development OS",
    language: "fa-IR",
    roles: AGENT_ROLES,
    models: listModels(),
    skills: listSkills(),
    tools: listTools(),
    features: {
      modelRouter: true, dynamicFreeModelDiscovery: true, agentSwarm: true, projectAutopilot: true,
      architecturePlanning: true, codebaseIntelligence: true, autonomousQA: true, selfHealingLoop: true,
      adversarialReview: true, gitWorkspacePlanning: true, visualQAContract: true, browserAgent: true,
      realtimePersianVoice: true, memory: true, skillsRegistry: true, benchmarkArena: true,
      buildAndReleasePlanning: true, deploymentPlanning: true, localization: true, freeFirstRouting: true,
    },
  });
}
