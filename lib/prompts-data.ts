import { DailyPrompt } from './types';

export const dailyPrompts: DailyPrompt[] = [
  { id: 'p1', category: 'mindset', text: 'What does being a mother mean to you right now? How has your definition changed since you found out you were expecting?', week: 1 },
  { id: 'p2', category: 'relationships', text: 'How has your relationship with your partner shifted since your pregnancy began? What feels different?', week: 1 },
  { id: 'p3', category: 'physical', text: 'What is your body telling you today? Take a moment to listen and describe what you feel.', week: 1 },
  { id: 'p4', category: 'mindset', text: 'What fear about motherhood keeps coming up? Write it down and then write what you would tell a friend with the same fear.', week: 2 },
  { id: 'p5', category: 'relationships', text: 'Who in your life makes you feel most supported right now? What do they do that helps?', week: 2 },
  { id: 'p6', category: 'physical', text: 'Describe a moment today when you felt connected to your body. What were you doing?', week: 2 },
  { id: 'p7', category: 'mindset', text: 'What part of your identity do you want to carry into motherhood? What are you willing to let evolve?', week: 3 },
  { id: 'p8', category: 'relationships', text: 'Think of a conversation you have been avoiding. What makes it hard? What would make it easier?', week: 3 },
  { id: 'p9', category: 'physical', text: 'What does rest look like for you right now? Are you allowing yourself enough of it?', week: 3 },
  { id: 'p10', category: 'mindset', text: 'Write a letter to yourself six months from now. What do you want her to remember about this moment?', week: 4 },
  { id: 'p11', category: 'relationships', text: 'How do you want to be asked for help? Practice saying it out loud.', week: 4 },
  { id: 'p12', category: 'physical', text: 'What nourishes you beyond food? Name three things that fill your cup.', week: 4 },
  { id: 'p13', category: 'mindset', text: 'What assumptions about motherhood have you inherited from your own mother? Which ones serve you?', week: 5 },
  { id: 'p14', category: 'relationships', text: 'Describe the kind of parent team you want to build. What does partnership look like to you?', week: 5 },
  { id: 'p15', category: 'physical', text: 'What movement feels good in your body right now? Not what you think you should do, but what actually feels good.', week: 5 },
  { id: 'p16', category: 'mindset', text: 'If you could give your baby one emotional gift, what would it be? Why does that matter to you?', week: 6 },
  { id: 'p17', category: 'relationships', text: 'What boundary do you need to set this week? With whom? How might you approach it gently?', week: 6 },
  { id: 'p18', category: 'physical', text: 'Close your eyes for 30 seconds. What does your body need most right now? Write it without judgment.', week: 6 },
  { id: 'p19', category: 'mindset', text: 'What does strength look like to you in this season of life? It might look different than before.', week: 7 },
  { id: 'p20', category: 'relationships', text: 'Who do you want in your village? Make a list of people you want to lean on and why.', week: 7 },
  { id: 'p21', category: 'physical', text: 'How are you sleeping? What rituals could you create to honor your need for rest?', week: 7 },
];

export function getTodayPrompt(completedPromptIds: string[], focusAreas: string[]): DailyPrompt | null {
  const available = dailyPrompts.filter(
    p => !completedPromptIds.includes(p.id) && focusAreas.includes(p.category)
  );
  if (available.length === 0) {
    const anyAvailable = dailyPrompts.filter(p => !completedPromptIds.includes(p.id));
    return anyAvailable.length > 0 ? anyAvailable[0] : null;
  }
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return available[dayOfYear % available.length];
}

export function getCategoryColor(category: string): string {
  switch (category) {
    case 'mindset': return '#F5D6D6';
    case 'relationships': return '#BBD4E3';
    case 'physical': return '#F5E1DA';
    default: return '#F5D6D6';
  }
}

export function getCategoryLabel(category: string): string {
  switch (category) {
    case 'mindset': return 'Mindset';
    case 'relationships': return 'Relationships';
    case 'physical': return 'Physical';
    default: return category;
  }
}
