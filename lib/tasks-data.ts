import { Task } from './types';

export const defaultTasks: Task[] = [
  { id: 't1', title: 'Schedule your first prenatal appointment', category: 'first-trimester', completed: false, createdAt: new Date().toISOString() },
  { id: 't2', title: 'Start taking prenatal vitamins', category: 'first-trimester', completed: false, createdAt: new Date().toISOString() },
  { id: 't3', title: 'Research birth preferences and philosophies', category: 'first-trimester', completed: false, createdAt: new Date().toISOString() },
  { id: 't4', title: 'Have a conversation with your partner about expectations', category: 'first-trimester', completed: false, createdAt: new Date().toISOString() },
  { id: 't5', title: 'Start a gratitude or mindfulness practice', category: 'first-trimester', completed: false, createdAt: new Date().toISOString() },
  { id: 't6', title: 'Begin your birth plan outline', category: 'second-trimester', completed: false, createdAt: new Date().toISOString() },
  { id: 't7', title: 'Take a childbirth education class', category: 'second-trimester', completed: false, createdAt: new Date().toISOString() },
  { id: 't8', title: 'Discuss parenting roles and responsibilities', category: 'second-trimester', completed: false, createdAt: new Date().toISOString() },
  { id: 't9', title: 'Create your postpartum support plan', category: 'second-trimester', completed: false, createdAt: new Date().toISOString() },
  { id: 't10', title: 'Set up a self-care routine that works for you', category: 'second-trimester', completed: false, createdAt: new Date().toISOString() },
  { id: 't11', title: 'Practice asking for help from loved ones', category: 'second-trimester', completed: false, createdAt: new Date().toISOString() },
  { id: 't12', title: 'Pack your hospital bag (including comfort items)', category: 'third-trimester', completed: false, createdAt: new Date().toISOString() },
  { id: 't13', title: 'Write a letter to your future self as a mother', category: 'third-trimester', completed: false, createdAt: new Date().toISOString() },
  { id: 't14', title: 'Finalize your birth plan with your care team', category: 'third-trimester', completed: false, createdAt: new Date().toISOString() },
  { id: 't15', title: 'Set up your postpartum recovery space', category: 'third-trimester', completed: false, createdAt: new Date().toISOString() },
  { id: 't16', title: 'Practice breathing and relaxation techniques', category: 'third-trimester', completed: false, createdAt: new Date().toISOString() },
  { id: 't17', title: 'Have the "village" conversation with your support network', category: 'third-trimester', completed: false, createdAt: new Date().toISOString() },
  { id: 't18', title: 'Journal about your hopes and dreams for your baby', category: 'general', completed: false, createdAt: new Date().toISOString() },
  { id: 't19', title: 'Create a playlist of songs that calm and ground you', category: 'general', completed: false, createdAt: new Date().toISOString() },
  { id: 't20', title: 'Identify your emotional triggers and coping strategies', category: 'general', completed: false, createdAt: new Date().toISOString() },
];

export function getTaskCategoryLabel(category: string): string {
  switch (category) {
    case 'first-trimester': return 'First Trimester';
    case 'second-trimester': return 'Second Trimester';
    case 'third-trimester': return 'Third Trimester';
    case 'general': return 'Anytime';
    default: return category;
  }
}
