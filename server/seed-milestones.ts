import { db } from "./db";
import { milestones } from "@shared/schema";

const milestoneData = [
  { title: "First Heartbeat", weekNumber: 6, trimester: 1, description: "Your baby's heart begins beating — one of the most powerful early signs of life.", icon: "💓", orderIndex: 1 },
  { title: "First OB Appointment", weekNumber: 8, trimester: 1, description: "Your first prenatal visit establishes care and confirms the pregnancy.", icon: "🩺", orderIndex: 2 },
  { title: "First Trimester Screening", weekNumber: 10, trimester: 1, description: "A blood test and ultrasound to screen for chromosomal conditions.", icon: "📋", orderIndex: 3 },
  { title: "End of First Trimester", weekNumber: 12, trimester: 1, description: "Miscarriage risk drops significantly — a major milestone to celebrate.", icon: "🌱", orderIndex: 4 },
  { title: "Baby's Sex Detectable", weekNumber: 14, trimester: 2, description: "If you choose to find out, baby's sex can often be determined by now.", icon: "👶", orderIndex: 5 },
  { title: "First Movements (Quickening)", weekNumber: 16, trimester: 2, description: "Many mothers feel their baby move for the first time — a flutter, a kick, a hello.", icon: "🦋", orderIndex: 6 },
  { title: "Anatomy Scan", weekNumber: 18, trimester: 2, description: "A detailed ultrasound checks baby's development and organs.", icon: "🔬", orderIndex: 7 },
  { title: "Halfway There", weekNumber: 20, trimester: 2, description: "You are at the midpoint of your pregnancy — 20 weeks down, 20 to go.", icon: "🎯", orderIndex: 8 },
  { title: "Viability Milestone", weekNumber: 24, trimester: 2, description: "At 24 weeks, babies born early have a meaningful chance of survival with medical care.", icon: "🌟", orderIndex: 9 },
  { title: "End of Second Trimester", weekNumber: 27, trimester: 2, description: "You've completed two trimesters — your baby is growing rapidly now.", icon: "✨", orderIndex: 10 },
  { title: "Third Trimester Begins", weekNumber: 28, trimester: 3, description: "The final stretch begins. Your baby is putting on weight and preparing for birth.", icon: "🌙", orderIndex: 11 },
  { title: "Hospital Tour", weekNumber: 32, trimester: 3, description: "A great week to tour your birth location and get comfortable with the space.", icon: "🏥", orderIndex: 12 },
  { title: "Group B Strep Test", weekNumber: 35, trimester: 3, description: "A routine swab test checks for Group B strep to protect baby during delivery.", icon: "💊", orderIndex: 13 },
  { title: "Full Term", weekNumber: 37, trimester: 3, description: "Your baby is full term — ready to arrive any time from now.", icon: "🎊", orderIndex: 14 },
  { title: "Due Date", weekNumber: 40, trimester: 3, description: "Your estimated due date — the day you've been preparing for.", icon: "🍼", orderIndex: 15 },
];

export async function seedMilestones() {
  const existing = await db.select().from(milestones);
  if (existing.length >= milestoneData.length) {
    return;
  }
  if (existing.length > 0) {
    await db.delete(milestones);
  }
  await db.insert(milestones).values(milestoneData);
  console.log(`Seeded ${milestoneData.length} milestones`);
}
