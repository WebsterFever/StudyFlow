import type { Difficulty, GoalInput, Priority, StudyItem, StudyType } from '../types'
import { addDays, todayISO } from '../utils/date'
import { generateId } from '../utils/id'

interface DemoRow {
  title: string
  course: string
  topic: string
  type: StudyType
  minutes: number
  difficulty: Difficulty
  priority: Priority
}

const ROWS: DemoRow[] = [
  // HTML
  { title: 'HTML Document Structure', course: 'HTML', topic: 'HTML Fundamentals', type: 'Video', minutes: 35, difficulty: 'Easy', priority: 'High' },
  { title: 'Semantic HTML Elements', course: 'HTML', topic: 'HTML Fundamentals', type: 'Video', minutes: 45, difficulty: 'Easy', priority: 'High' },
  { title: 'Forms & Inputs', course: 'HTML', topic: 'HTML Forms', type: 'Video', minutes: 60, difficulty: 'Intermediate', priority: 'Medium' },
  { title: 'Build a Signup Form', course: 'HTML', topic: 'HTML Forms', type: 'Exercise', minutes: 40, difficulty: 'Intermediate', priority: 'Medium' },
  { title: 'Accessibility Basics', course: 'HTML', topic: 'Accessibility', type: 'Reading', minutes: 25, difficulty: 'Easy', priority: 'Low' },
  // CSS
  { title: 'Box Model Deep Dive', course: 'CSS', topic: 'CSS Fundamentals', type: 'Video', minutes: 50, difficulty: 'Easy', priority: 'High' },
  { title: 'Flexbox Complete Guide', course: 'CSS', topic: 'Layout', type: 'Video', minutes: 90, difficulty: 'Intermediate', priority: 'High' },
  { title: 'Flexbox Practice', course: 'CSS', topic: 'Layout', type: 'Exercise', minutes: 45, difficulty: 'Intermediate', priority: 'High' },
  { title: 'CSS Grid Deep Dive', course: 'CSS', topic: 'Layout', type: 'Video', minutes: 105, difficulty: 'Intermediate', priority: 'High' },
  { title: 'Grid Layout Challenge', course: 'CSS', topic: 'Layout', type: 'Exercise', minutes: 60, difficulty: 'Hard', priority: 'Medium' },
  { title: 'Responsive Design & Media Queries', course: 'CSS', topic: 'Responsive Design', type: 'Video', minutes: 70, difficulty: 'Intermediate', priority: 'Medium' },
  { title: 'Build a Responsive Landing Page', course: 'CSS', topic: 'Responsive Design', type: 'Project', minutes: 150, difficulty: 'Hard', priority: 'Medium' },
  { title: 'CSS Animations & Transitions', course: 'CSS', topic: 'Animations', type: 'Video', minutes: 55, difficulty: 'Intermediate', priority: 'Low' },
  // JavaScript
  { title: 'JavaScript Syntax Crash Course', course: 'JavaScript', topic: 'JS Fundamentals', type: 'Video', minutes: 80, difficulty: 'Easy', priority: 'High' },
  { title: 'Arrays & Objects Deep Dive', course: 'JavaScript', topic: 'JS Fundamentals', type: 'Video', minutes: 65, difficulty: 'Easy', priority: 'High' },
  { title: 'Array Methods Practice', course: 'JavaScript', topic: 'JS Fundamentals', type: 'Exercise', minutes: 50, difficulty: 'Intermediate', priority: 'High' },
  { title: 'Functions & Scope', course: 'JavaScript', topic: 'Functions', type: 'Video', minutes: 60, difficulty: 'Intermediate', priority: 'High' },
  { title: 'Closures Explained', course: 'JavaScript', topic: 'Functions', type: 'Video', minutes: 45, difficulty: 'Hard', priority: 'Medium' },
  { title: 'Async JavaScript: Promises & Async/Await', course: 'JavaScript', topic: 'Async Programming', type: 'Video', minutes: 95, difficulty: 'Hard', priority: 'High' },
  { title: 'Build a Fetch-based Weather App', course: 'JavaScript', topic: 'Async Programming', type: 'Project', minutes: 120, difficulty: 'Hard', priority: 'Medium' },
  { title: 'DOM Manipulation', course: 'JavaScript', topic: 'DOM', type: 'Video', minutes: 70, difficulty: 'Intermediate', priority: 'Medium' },
  { title: 'DOM Todo List Exercise', course: 'JavaScript', topic: 'DOM', type: 'Exercise', minutes: 55, difficulty: 'Intermediate', priority: 'Medium' },
  // TypeScript
  { title: 'TypeScript Fundamentals', course: 'TypeScript', topic: 'TS Fundamentals', type: 'Video', minutes: 75, difficulty: 'Intermediate', priority: 'High' },
  { title: 'Interfaces & Types', course: 'TypeScript', topic: 'TS Fundamentals', type: 'Video', minutes: 55, difficulty: 'Intermediate', priority: 'High' },
  { title: 'Generics Explained', course: 'TypeScript', topic: 'Advanced Types', type: 'Video', minutes: 65, difficulty: 'Hard', priority: 'Medium' },
  { title: 'Type Narrowing Practice', course: 'TypeScript', topic: 'Advanced Types', type: 'Exercise', minutes: 40, difficulty: 'Hard', priority: 'Medium' },
  { title: 'Migrating a JS Project to TS', course: 'TypeScript', topic: 'Real World TS', type: 'Project', minutes: 100, difficulty: 'Hard', priority: 'Low' },
  // React
  { title: 'React Fundamentals & JSX', course: 'React', topic: 'React Basics', type: 'Video', minutes: 85, difficulty: 'Intermediate', priority: 'High' },
  { title: 'Components & Props', course: 'React', topic: 'React Basics', type: 'Video', minutes: 60, difficulty: 'Easy', priority: 'High' },
  { title: 'Build a Component Library', course: 'React', topic: 'React Basics', type: 'Exercise', minutes: 70, difficulty: 'Intermediate', priority: 'High' },
  { title: 'React useState Deep Dive', course: 'React', topic: 'React Hooks', type: 'Video', minutes: 55, difficulty: 'Intermediate', priority: 'High' },
  { title: 'React useEffect Deep Dive', course: 'React', topic: 'React Hooks', type: 'Video', minutes: 125, difficulty: 'Intermediate', priority: 'High' },
  { title: 'useEffect Exercise', course: 'React', topic: 'React Hooks', type: 'Exercise', minutes: 45, difficulty: 'Intermediate', priority: 'High' },
  { title: 'Context API', course: 'React', topic: 'State Management', type: 'Video', minutes: 70, difficulty: 'Intermediate', priority: 'Medium' },
  { title: 'Context Exercise', course: 'React', topic: 'State Management', type: 'Exercise', minutes: 40, difficulty: 'Intermediate', priority: 'Medium' },
  { title: 'React Router Essentials', course: 'React', topic: 'Routing', type: 'Video', minutes: 65, difficulty: 'Intermediate', priority: 'Medium' },
  { title: 'React Testing with Vitest', course: 'React', topic: 'Testing', type: 'Video', minutes: 80, difficulty: 'Hard', priority: 'Low' },
  { title: 'Build a Full Task Manager App', course: 'React', topic: 'Capstone Project', type: 'Project', minutes: 240, difficulty: 'Hard', priority: 'High' },
  { title: 'Review: HTML & CSS Fundamentals', course: 'HTML', topic: 'HTML Fundamentals', type: 'Review', minutes: 30, difficulty: 'Easy', priority: 'Low' },
]

export function buildDemoItems(goalId: string): StudyItem[] {
  const now = new Date().toISOString()
  return ROWS.map((row, index) => ({
    id: generateId('item'),
    goalId,
    title: row.title,
    course: row.course,
    topic: row.topic,
    type: row.type,
    durationMinutes: row.minutes,
    difficulty: row.difficulty,
    priority: row.priority,
    completed: false,
    completedDate: null,
    mastery: null,
    notes: '',
    createdDate: now,
    order: index,
  }))
}

export function buildDemoGoal(): GoalInput {
  return {
    name: 'Master Frontend Development',
    learningType: 'programming_technology',
    startDate: todayISO(),
    deadline: addDays(todayISO(), 42),
    dailyHours: {
      monday: 3,
      tuesday: 2.5,
      wednesday: 3,
      thursday: 2.5,
      friday: 2,
      saturday: 4,
      sunday: 3,
    },
  }
}
