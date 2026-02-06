import { db } from "./db";
import { prompts, tasks } from "@shared/schema";
import { eq } from "drizzle-orm";

const promptData = [
  { title: "Morning Mindset", body: "What does being a 'good enough' mother mean to you? Release perfectionism and explore what feels authentic.", category: "mindset", weekNumber: 1, dayOfWeek: 1 },
  { title: "Self-Compassion", body: "Write about a fear you have about motherhood. Now respond to yourself as you would to your best friend.", category: "mindset", weekNumber: 1, dayOfWeek: 2 },
  { title: "Identity Shift", body: "How is your identity evolving during pregnancy? What parts of yourself do you want to carry forward?", category: "mindset", weekNumber: 1, dayOfWeek: 3 },
  { title: "Partner Connection", body: "Share one thing you appreciate about your partner's support during this journey. Have you told them?", category: "relationships", weekNumber: 1, dayOfWeek: 4 },
  { title: "Support Circle", body: "Who are the three people you trust most to support you as a new mother? What makes them special?", category: "relationships", weekNumber: 1, dayOfWeek: 5 },
  { title: "Body Wisdom", body: "Take a moment to thank your body for what it's doing right now. What sensations are you noticing today?", category: "physical", weekNumber: 1, dayOfWeek: 6 },
  { title: "Rest & Recovery", body: "What does true rest look like for you? Create a small rest ritual you can practice this week.", category: "physical", weekNumber: 1, dayOfWeek: 7 },

  { title: "Letting Go", body: "What expectation about pregnancy or motherhood are you ready to release? Write it down, then let it go.", category: "mindset", weekNumber: 2, dayOfWeek: 1 },
  { title: "Gratitude Anchor", body: "Name three things about this moment in your pregnancy journey that you're grateful for.", category: "mindset", weekNumber: 2, dayOfWeek: 2 },
  { title: "Emotional Weather", body: "If your emotions today were weather, what would the forecast be? Describe without judgment.", category: "mindset", weekNumber: 2, dayOfWeek: 3 },
  { title: "Communicating Needs", body: "What's one need you haven't expressed to your partner or loved ones? Practice saying it here first.", category: "relationships", weekNumber: 2, dayOfWeek: 4 },
  { title: "Boundary Setting", body: "What boundary do you need to set to protect your peace during this season? How will you communicate it?", category: "relationships", weekNumber: 2, dayOfWeek: 5 },
  { title: "Movement Check", body: "How has your relationship with movement changed during pregnancy? What feels good in your body right now?", category: "physical", weekNumber: 2, dayOfWeek: 6 },
  { title: "Nourishment", body: "Beyond food, what nourishes you? List five non-food things that fill your cup.", category: "physical", weekNumber: 2, dayOfWeek: 7 },

  { title: "Inner Critic", body: "What is your inner critic saying about your readiness for motherhood? Write a compassionate rebuttal.", category: "mindset", weekNumber: 3, dayOfWeek: 1 },
  { title: "Visualization", body: "Close your eyes and picture yourself one year from now as a mother. What do you see? How does it feel?", category: "mindset", weekNumber: 3, dayOfWeek: 2 },
  { title: "Values Inventory", body: "List your top five values. How do you want these to shape your parenting?", category: "mindset", weekNumber: 3, dayOfWeek: 3 },
  { title: "Family Patterns", body: "What patterns from your own upbringing do you want to continue? What would you like to change?", category: "relationships", weekNumber: 3, dayOfWeek: 4 },
  { title: "Village Building", body: "Think about your support network. Is there someone you'd like to invite closer into your journey?", category: "relationships", weekNumber: 3, dayOfWeek: 5 },
  { title: "Sleep Sanctuary", body: "How is your sleep? What one thing could you adjust tonight to improve your rest?", category: "physical", weekNumber: 3, dayOfWeek: 6 },
  { title: "Breath Work", body: "Try three slow, deep breaths right now. Inhale for 4 counts, hold for 4, exhale for 6. How do you feel?", category: "physical", weekNumber: 3, dayOfWeek: 7 },

  { title: "Joy Inventory", body: "What brings you joy right now in this season? Make a list and commit to one joyful thing today.", category: "mindset", weekNumber: 4, dayOfWeek: 1 },
  { title: "Courage", body: "What's the bravest thing you've done during this pregnancy? Celebrate that courage.", category: "mindset", weekNumber: 4, dayOfWeek: 2 },
  { title: "Intentions", body: "Set an intention for the week ahead. What energy do you want to carry into the coming days?", category: "mindset", weekNumber: 4, dayOfWeek: 3 },
  { title: "Partner Dialogue", body: "What's one topic about parenting you and your partner haven't discussed yet? Start that conversation here.", category: "relationships", weekNumber: 4, dayOfWeek: 4 },
  { title: "Asking for Help", body: "When was the last time you asked for help? What makes it easy or hard for you? Practice asking for one thing today.", category: "relationships", weekNumber: 4, dayOfWeek: 5 },
  { title: "Comfort Map", body: "Map out what brings your body comfort: textures, temperatures, positions, sounds. Know your comfort toolkit.", category: "physical", weekNumber: 4, dayOfWeek: 6 },
  { title: "Presence Practice", body: "Spend two minutes with your hand on your belly. What do you want your baby to know about this moment?", category: "physical", weekNumber: 4, dayOfWeek: 7 },

  { title: "Surrendering Control", body: "Motherhood requires letting go of control. What's one area where you can practice surrender this week?", category: "mindset", weekNumber: 5, dayOfWeek: 1 },
  { title: "Affirmation", body: "Write yourself an affirmation for this stage of pregnancy. Make it specific, personal, and powerful.", category: "mindset", weekNumber: 5, dayOfWeek: 2 },
  { title: "Growth Reflection", body: "How have you grown since the beginning of this pregnancy? What surprised you about your own resilience?", category: "mindset", weekNumber: 5, dayOfWeek: 3 },
  { title: "Love Languages", body: "How do you most feel loved? How does your partner feel loved? Explore how these may shift after baby arrives.", category: "relationships", weekNumber: 5, dayOfWeek: 4 },
  { title: "Friend Check", body: "Which friendship has meant the most to you during pregnancy? Consider reaching out to thank them today.", category: "relationships", weekNumber: 5, dayOfWeek: 5 },
  { title: "Gentle Movement", body: "What gentle movement can you do today that honors where your body is? Even five minutes counts.", category: "physical", weekNumber: 5, dayOfWeek: 6 },
  { title: "Sensory Grounding", body: "Practice the 5-4-3-2-1 grounding technique: 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste.", category: "physical", weekNumber: 5, dayOfWeek: 7 },

  { title: "Motherhood Vision", body: "Describe the kind of home atmosphere you want to create for your child. What does it look, sound, and feel like?", category: "mindset", weekNumber: 6, dayOfWeek: 1 },
  { title: "Release Comparison", body: "Where are you comparing your pregnancy journey to others? How can you redirect that energy inward?", category: "mindset", weekNumber: 6, dayOfWeek: 2 },
  { title: "Inner Wisdom", body: "Your intuition is growing stronger. What is it telling you right now about what you need?", category: "mindset", weekNumber: 6, dayOfWeek: 3 },
  { title: "Team Planning", body: "Discuss with your partner: What does the first week with baby look like? Who does what?", category: "relationships", weekNumber: 6, dayOfWeek: 4 },
  { title: "Gratitude Letter", body: "Write a short letter of gratitude to someone who has supported you during this pregnancy.", category: "relationships", weekNumber: 6, dayOfWeek: 5 },
  { title: "Birth Preferences", body: "What feels most important to you about your birth experience? Not the plan, but the feeling you want.", category: "physical", weekNumber: 6, dayOfWeek: 6 },
  { title: "Body Appreciation", body: "Name five things your body has done today that you can appreciate. It's doing incredible work.", category: "physical", weekNumber: 6, dayOfWeek: 7 },
];

const taskData = [
  { title: "Schedule your first prenatal appointment", category: "first_trimester", isTemplate: true },
  { title: "Start taking prenatal vitamins", category: "first_trimester", isTemplate: true },
  { title: "Research birth preferences and philosophies", category: "first_trimester", isTemplate: true },
  { title: "Have a conversation with your partner about expectations", category: "first_trimester", isTemplate: true },
  { title: "Start a gratitude or mindfulness practice", category: "first_trimester", isTemplate: true },
  { title: "Create a pregnancy journal or start documenting", category: "first_trimester", isTemplate: true },
  { title: "Research and choose your care provider", category: "first_trimester", isTemplate: true },

  { title: "Begin your birth plan outline", category: "second_trimester", isTemplate: true },
  { title: "Take a childbirth education class", category: "second_trimester", isTemplate: true },
  { title: "Discuss parenting roles and responsibilities", category: "second_trimester", isTemplate: true },
  { title: "Create your postpartum support plan", category: "second_trimester", isTemplate: true },
  { title: "Set up a self-care routine that works for you", category: "second_trimester", isTemplate: true },
  { title: "Practice asking for help from loved ones", category: "second_trimester", isTemplate: true },
  { title: "Tour your hospital or birth center", category: "second_trimester", isTemplate: true },
  { title: "Start assembling baby essentials", category: "second_trimester", isTemplate: true },

  { title: "Pack your hospital bag (including comfort items)", category: "third_trimester", isTemplate: true },
  { title: "Write a letter to your future self as a mother", category: "third_trimester", isTemplate: true },
  { title: "Finalize your birth plan with your care team", category: "third_trimester", isTemplate: true },
  { title: "Set up your postpartum recovery space", category: "third_trimester", isTemplate: true },
  { title: "Practice breathing and relaxation techniques", category: "third_trimester", isTemplate: true },
  { title: "Have the 'village' conversation with your support network", category: "third_trimester", isTemplate: true },
  { title: "Prepare freezer meals for postpartum", category: "third_trimester", isTemplate: true },
  { title: "Install the car seat and have it inspected", category: "third_trimester", isTemplate: true },

  { title: "Pack partner's hospital bag essentials", category: "partner_prep", isTemplate: true },
  { title: "Discuss birth support preferences with partner", category: "partner_prep", isTemplate: true },
  { title: "Create a postpartum plan together", category: "partner_prep", isTemplate: true },
  { title: "Research paternity/partner leave options", category: "partner_prep", isTemplate: true },

  { title: "Hospital bag: comfortable robe and slippers", category: "hospital_bag", isTemplate: true },
  { title: "Hospital bag: nursing bra and nursing pads", category: "hospital_bag", isTemplate: true },
  { title: "Hospital bag: toiletries and comfort items", category: "hospital_bag", isTemplate: true },
  { title: "Hospital bag: going-home outfit for baby", category: "hospital_bag", isTemplate: true },
  { title: "Hospital bag: phone charger and playlist", category: "hospital_bag", isTemplate: true },
  { title: "Hospital bag: snacks and drinks", category: "hospital_bag", isTemplate: true },

  { title: "Journal about your hopes and dreams for your baby", category: "general", isTemplate: true },
  { title: "Create a playlist of songs that calm and ground you", category: "general", isTemplate: true },
  { title: "Identify your emotional triggers and coping strategies", category: "general", isTemplate: true },
  { title: "Write down your birth affirmations", category: "general", isTemplate: true },
  { title: "Create a vision board for motherhood", category: "general", isTemplate: true },
];

export async function seedDatabase() {
  const existingPrompts = await db.select().from(prompts);
  if (existingPrompts.length === 0) {
    console.log("Seeding prompts...");
    await db.insert(prompts).values(promptData);
    console.log(`Seeded ${promptData.length} prompts`);
  }

  const existingTasks = await db.select().from(tasks);
  if (existingTasks.length === 0) {
    console.log("Seeding tasks...");
    await db.insert(tasks).values(taskData);
    console.log(`Seeded ${taskData.length} tasks`);
  }
}
