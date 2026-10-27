export interface KidsTopic {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  query: string;
  color: string;
  gradient: [string, string];
}

export const KIDS_TOPICS: KidsTopic[] = [
  {
    id: 'stories',
    emoji: '🌙',
    title: 'סיפורי לילה טוב',
    subtitle: 'להירדם עם חיוך',
    query: 'סיפור',
    color: '#6C5CE7',
    gradient: ['#6C5CE7', '#8E44AD'],
  },
  {
    id: 'animals',
    emoji: '🦁',
    title: 'חיות וטבע',
    subtitle: 'ממלכת החיות הקסומה',
    query: 'חיות',
    color: '#20BF6B',
    gradient: ['#20BF6B', '#009432'],
  },
  {
    id: 'space',
    emoji: '🚀',
    title: 'חלל וכוכבים',
    subtitle: 'מסע בין גלקסיות',
    query: 'חלל',
    color: '#0984E3',
    gradient: ['#0984E3', '#2C3E50'],
  },
  {
    id: 'detective',
    emoji: '🔍',
    title: 'הרפתקאות ובילוש',
    subtitle: 'לפתור תעלומות מרתקות',
    query: 'סוכן',
    color: '#E17055',
    gradient: ['#E17055', '#D35400'],
  },
  {
    id: 'funny',
    emoji: '😂',
    title: 'מצחיק וכיף',
    subtitle: 'בדיחות וצחוקים לדרך',
    query: 'טריוויה',
    color: '#FDCB6E',
    gradient: ['#FDCB6E', '#F39C12'],
  },
  {
    id: 'science',
    emoji: '🧪',
    title: 'מדע וסקרנות',
    subtitle: 'איך דברים עובדים?',
    query: 'מדע',
    color: '#FF7675',
    gradient: ['#FF7675', '#D63031'],
  },
];
