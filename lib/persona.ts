export type PersonaKey =
  | 'anxious_planner'
  | 'supported_nurturer'
  | 'solo_warrior'
  | 'healing_mother'
  | 'faith_anchored';

export interface PersonaConfig {
  displayName: string;
  partnerTerm: string;
  villageTerm: string;
  homeScreenEmphasis: 'tasks' | 'milestones' | 'strength' | 'body' | 'surrender';
  affirmationTone: 'grounding' | 'celebratory' | 'empowering' | 'gentle' | 'spiritual';
  promptPace: 'structured' | 'open' | 'direct' | 'slow' | 'reflective';
  weeklyFocusLabel: string;
  taskBoardLabel: string;
  homeGreeting: string;
  personaBadge: {
    background: string;
    textColor: string;
    label: string;
    description: string;
  };
  scenarioKeywords: string[];
}

const DEFAULT_PERSONA: PersonaKey = 'supported_nurturer';

export const PERSONA_CONFIG: Record<PersonaKey, PersonaConfig> = {
  anxious_planner: {
    displayName: 'Anxious Planner',
    partnerTerm: 'your partner or support person',
    villageTerm: 'your people',
    homeScreenEmphasis: 'tasks',
    affirmationTone: 'grounding',
    promptPace: 'structured',
    weeklyFocusLabel: 'Preparing with intention',
    taskBoardLabel: 'Your preparation checklist',
    homeGreeting: "Here's your plan for today",
    personaBadge: {
      background: '#F5D6D6',
      textColor: '#7A2C2C',
      label: 'Anxious Planner',
      description: 'Your experience is structured for preparation and clarity.',
    },
    scenarioKeywords: ['hospital', 'advocacy', 'ob', 'birth preference', 'support team', 'hard question'],
  },
  supported_nurturer: {
    displayName: 'Supported Nurturer',
    partnerTerm: 'your partner',
    villageTerm: 'your people',
    homeScreenEmphasis: 'milestones',
    affirmationTone: 'celebratory',
    promptPace: 'open',
    weeklyFocusLabel: 'Growing together',
    taskBoardLabel: 'Things to do together',
    homeGreeting: 'Ready to grow today?',
    personaBadge: {
      background: '#BBD4E3',
      textColor: '#1A4A5E',
      label: 'Supported Nurturer',
      description: 'Your experience celebrates connection and growth.',
    },
    scenarioKeywords: ['partner', 'together', 'postpartum', 'family', 'telling'],
  },
  solo_warrior: {
    displayName: 'Solo Warrior',
    partnerTerm: 'your support person',
    villageTerm: 'your village',
    homeScreenEmphasis: 'strength',
    affirmationTone: 'empowering',
    promptPace: 'direct',
    weeklyFocusLabel: 'Finding your strength',
    taskBoardLabel: 'What you can do today',
    homeGreeting: "You've got this. Here's today.",
    personaBadge: {
      background: '#D4E8D4',
      textColor: '#1A4A1A',
      label: 'Solo Warrior',
      description: 'Your experience is built around your strength.',
    },
    scenarioKeywords: ['limits', 'asking for help', 'advocating for yourself', 'medical', 'alone'],
  },
  healing_mother: {
    displayName: 'Healing Mother',
    partnerTerm: 'your support person',
    villageTerm: 'your people',
    homeScreenEmphasis: 'body',
    affirmationTone: 'gentle',
    promptPace: 'slow',
    weeklyFocusLabel: 'Moving gently forward',
    taskBoardLabel: 'At your own pace',
    homeGreeting: 'Take this gently.',
    personaBadge: {
      background: '#E8D4E8',
      textColor: '#4A1A5E',
      label: 'Healing Mother',
      description: 'Your experience moves at your pace.',
    },
    scenarioKeywords: ['loss', 'trauma', 'past', 'pace', 'provider', 'processing'],
  },
  faith_anchored: {
    displayName: 'Faith-Anchored',
    partnerTerm: 'your partner or support person',
    villageTerm: 'your people',
    homeScreenEmphasis: 'surrender',
    affirmationTone: 'spiritual',
    promptPace: 'reflective',
    weeklyFocusLabel: 'Trusting the process',
    taskBoardLabel: 'Preparing with purpose',
    homeGreeting: "Today's intention",
    personaBadge: {
      background: '#F5E1DA',
      textColor: '#7A3A1A',
      label: 'Faith-Anchored',
      description: 'Your experience is grounded in trust.',
    },
    scenarioKeywords: ['faith', 'spiritual', 'community', 'praying', 'trust', 'fear'],
  },
};

export function getPersonaConfig(persona: string): PersonaConfig {
  return PERSONA_CONFIG[persona as PersonaKey] ?? PERSONA_CONFIG[DEFAULT_PERSONA];
}

export function sanitizeForPersona(text: string, persona: string): string {
  if (!text) return text;
  const config = getPersonaConfig(persona);
  return text
    .replace(/your partner or support person/gi, config.partnerTerm)
    .replace(/partner or support person/gi, config.partnerTerm)
    .replace(/your partner/gi, config.partnerTerm)
    .replace(/your village/gi, config.villageTerm);
}

export function personaAffirmation(baseAffirmation: string, persona: string): string {
  if (!baseAffirmation) return baseAffirmation;
  switch (persona as PersonaKey) {
    case 'healing_mother':
      return `Right where you are — ${baseAffirmation}`;
    case 'faith_anchored': {
      const lower = baseAffirmation.toLowerCase();
      if (lower.includes('faith') || lower.includes('trust')) return baseAffirmation;
      return `${baseAffirmation} Trust that.`;
    }
    case 'solo_warrior':
      return baseAffirmation
        .replace(/you and your partner/gi, 'you')
        .replace(/you and your support person/gi, 'you');
    case 'anxious_planner': {
      const suffix = "You've already done the hard work of showing up.";
      if (baseAffirmation.includes(suffix)) return baseAffirmation;
      const sep = baseAffirmation.endsWith('.') || baseAffirmation.endsWith('!') || baseAffirmation.endsWith('?') ? ' ' : '. ';
      return `${baseAffirmation}${sep}${suffix}`;
    }
    case 'supported_nurturer':
    default:
      return baseAffirmation;
  }
}

export function sortScenariosByPersona(scenarios: any[], persona: string): any[] {
  const config = getPersonaConfig(persona);
  const keywords = config.scenarioKeywords;
  return [...scenarios].sort((a, b) => {
    const scoreA = _scenarioScore(a, keywords);
    const scoreB = _scenarioScore(b, keywords);
    return scoreB - scoreA;
  });
}

function _scenarioScore(scenario: any, keywords: string[]): number {
  const text = `${scenario.title ?? ''} ${scenario.description ?? ''}`.toLowerCase();
  return keywords.reduce((acc, kw) => acc + (text.includes(kw.toLowerCase()) ? 1 : 0), 0);
}
