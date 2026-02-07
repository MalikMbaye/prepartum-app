import { db } from "./db";
import { prompts, tasks, quizzes, quizQuestions } from "@shared/schema";
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
  { title: "Find an OBGYN or midwife", description: "Research care providers in your area, read reviews, and schedule consultations to find the right fit for your birth experience.", category: "first-trimester", isTemplate: true },
  { title: "Schedule first prenatal appointment", description: "Book your initial prenatal visit, usually around 8-10 weeks. Prepare any questions you want to ask.", category: "first-trimester", isTemplate: true },
  { title: "Start prenatal vitamins", description: "Begin taking a daily prenatal vitamin with folic acid, iron, and DHA. Ask your provider for recommendations.", category: "first-trimester", isTemplate: true },
  { title: "Research hospital vs birth center options", description: "Explore different birth settings and what each offers. Consider what matters most to you for your birth experience.", category: "first-trimester", isTemplate: true },
  { title: "Share news with close family (when ready)", description: "There's no right time to share your news. Do it when it feels right for you and your partner.", category: "first-trimester", isTemplate: true },

  { title: "Schedule anatomy scan", description: "Usually done between 18-22 weeks, this detailed ultrasound checks your baby's development and anatomy.", category: "second-trimester", isTemplate: true },
  { title: "Start thinking about baby names", description: "Begin a running list of names you love. No pressure to decide yet \u2014 just start exploring.", category: "second-trimester", isTemplate: true },
  { title: "Research childcare options", description: "Look into daycares, nannies, or family help. Waitlists can be long, so it's good to start early.", category: "second-trimester", isTemplate: true },
  { title: "Begin baby registry", description: "Create a registry with essentials. Ask friends with kids what they actually used most.", category: "second-trimester", isTemplate: true },
  { title: "Plan babymoon (optional)", description: "If you'd like a pre-baby getaway, the second trimester is often the most comfortable time to travel.", category: "second-trimester", isTemplate: true },
  { title: "Sign up for prenatal classes", description: "Look into childbirth education, breastfeeding, infant CPR, and newborn care classes in your area.", category: "second-trimester", isTemplate: true },

  { title: "Take hospital tour", description: "Schedule a tour of your birth facility to familiarize yourself with the space, parking, and check-in process.", category: "third-trimester", isTemplate: true },
  { title: "Install car seat", description: "Install your infant car seat and have it inspected by a certified technician. Many fire stations offer free checks.", category: "third-trimester", isTemplate: true },
  { title: "Wash baby clothes", description: "Wash newborn and 0-3 month clothes with gentle, fragrance-free detergent before baby arrives.", category: "third-trimester", isTemplate: true },
  { title: "Set up nursery basics", description: "You don't need everything perfect \u2014 focus on a safe sleep space, changing area, and feeding station.", category: "third-trimester", isTemplate: true },
  { title: "Pre-register at hospital", description: "Complete pre-registration paperwork so check-in is smoother when the big day arrives.", category: "third-trimester", isTemplate: true },
  { title: "Pack hospital bag", description: "Pack your bag around 36 weeks. Include comfort items, documents, and outfits for you and baby.", category: "third-trimester", isTemplate: true },
  { title: "Prepare freezer meals", description: "Cook and freeze easy meals for the postpartum period. Soups, casseroles, and burritos work great.", category: "third-trimester", isTemplate: true },
  { title: "Create birth plan", description: "Write down your preferences for labor and delivery. Share with your care team and birth partner.", category: "third-trimester", isTemplate: true },
  { title: "Choose pediatrician", description: "Research and interview pediatricians before baby arrives. Ask about their approach and availability.", category: "third-trimester", isTemplate: true },

  { title: "Insurance cards and ID", description: "Pack copies of your insurance cards, photo ID, and any pre-registration confirmation.", category: "hospital-bag", isTemplate: true },
  { title: "Birth plan copies", description: "Bring several copies of your birth plan to share with nurses and your care team.", category: "hospital-bag", isTemplate: true },
  { title: "Comfortable robe", description: "A soft, open-front robe is great for skin-to-skin contact and nursing comfort.", category: "hospital-bag", isTemplate: true },
  { title: "Nursing bras", description: "Pack 2-3 comfortable nursing bras or sleep bras for support and easy feeding access.", category: "hospital-bag", isTemplate: true },
  { title: "Phone charger", description: "Don't forget a long charging cable and portable battery pack \u2014 you'll want your phone accessible.", category: "hospital-bag", isTemplate: true },
  { title: "Toiletries", description: "Your own shampoo, body wash, toothbrush, lip balm, and any comfort items from home.", category: "hospital-bag", isTemplate: true },
  { title: "Coming home outfit for you", description: "Pack something comfortable and stretchy. You'll still look about 6 months pregnant, and that's perfectly normal.", category: "hospital-bag", isTemplate: true },
  { title: "Coming home outfit for baby", description: "A simple onesie or sleeper, hat, socks, and a blanket appropriate for the weather.", category: "hospital-bag", isTemplate: true },
  { title: "Car seat (installed)", description: "Make sure the car seat is properly installed before you go to the hospital. You can't leave without one.", category: "hospital-bag", isTemplate: true },
  { title: "Snacks", description: "Pack high-energy snacks like granola bars, dried fruit, crackers, and drinks for labor and recovery.", category: "hospital-bag", isTemplate: true },

  { title: "Have a conversation about division of labor", description: "Talk openly about how household and baby duties will be shared. Write it down so you both have clarity.", category: "partner-prep", isTemplate: true },
  { title: "Discuss parenting philosophies", description: "Talk about discipline approaches, screen time, religion, and values you want to instill.", category: "partner-prep", isTemplate: true },
  { title: "Talk about visitors in hospital", description: "Decide together who you want visiting at the hospital and when. It's okay to set boundaries.", category: "partner-prep", isTemplate: true },
  { title: "Plan paternity leave", description: "Research leave options and plan timing. Even a few weeks makes a huge difference for bonding and support.", category: "partner-prep", isTemplate: true },
  { title: "Learn about postpartum warning signs", description: "Both partners should know the signs of postpartum depression, preeclampsia, and when to seek help.", category: "partner-prep", isTemplate: true },
  { title: "Practice driving to hospital", description: "Do a practice drive during different times of day. Know the route, where to park, and where to check in.", category: "partner-prep", isTemplate: true },

  { title: "Research lactation consultant", description: "Find a lactation consultant or breastfeeding support group in your area before baby arrives.", category: "postpartum", isTemplate: true },
  { title: "Stock up on postpartum supplies", description: "Pads, peri bottle, stool softener, comfortable underwear, nursing pads, and nipple cream.", category: "postpartum", isTemplate: true },
  { title: "Set up meal train", description: "Let friends and family sign up to bring meals in the first few weeks. Services like MealTrain make this easy.", category: "postpartum", isTemplate: true },
  { title: "Identify support people", description: "Know who you can call at 2am, who will bring groceries, and who will just sit with you.", category: "postpartum", isTemplate: true },
  { title: "Learn about postpartum depression signs", description: "Know the difference between baby blues and PPD. Have your provider's number and a crisis line accessible.", category: "postpartum", isTemplate: true },
];

const quizData = [
  {
    title: "What's Your Support Style?",
    description: "Discover how you prefer to receive support during your postpartum journey. Understanding your support style helps you communicate needs to your partner and loved ones.",
    category: "relationships",
    questionCount: 8,
    estimatedMinutes: 5,
    resultTypes: {
      "acts-of-service": {
        title: "Acts of Service",
        description: "You feel most supported when people take tangible tasks off your plate. Whether it's cooking a meal, doing laundry, or handling errands, actions speak louder than words for you.",
        insights: [
          "Create a specific list of helpful tasks to share with visitors",
          "Let your partner know that doing dishes means 'I love you'",
          "Accept offers of help gracefully — people genuinely want to support you"
        ]
      },
      "quality-time": {
        title: "Quality Time",
        description: "You feel most supported when someone is fully present with you. Having someone sit beside you, listen without distraction, and simply be there fills your cup.",
        insights: [
          "Schedule regular one-on-one time with your partner, even just 15 minutes",
          "Ask a friend to sit with you during feeding times for company",
          "Quality over quantity — a focused 20 minutes beats a distracted hour"
        ]
      },
      "solo-processing": {
        title: "Solo Processing",
        description: "You recharge and process emotions best when given space. You're not pushing people away — you need solitude to sort through your feelings before sharing them.",
        insights: [
          "Communicate to your partner that alone time is self-care, not withdrawal",
          "Create a small sanctuary space in your home just for you",
          "Journal or take short walks to process the big emotions of new parenthood"
        ]
      },
      "humor-distraction": {
        title: "Humor & Distraction",
        description: "You cope best when someone lightens the mood. Laughter and lighthearted distraction help you reset when things feel overwhelming.",
        insights: [
          "Keep a playlist of your favorite comedy shows for tough moments",
          "Let your partner know that making you laugh is genuinely helpful",
          "Don't feel guilty about needing levity — humor is a valid coping tool"
        ]
      }
    },
    questions: [
      {
        questionText: "When you're feeling overwhelmed, what helps most?",
        options: [
          { text: "Someone taking tasks off my plate", value: "acts-of-service" },
          { text: "Someone sitting with me and listening", value: "quality-time" },
          { text: "Someone giving me space to process alone", value: "solo-processing" },
          { text: "Someone making me laugh and distracting me", value: "humor-distraction" }
        ],
        orderNumber: 1
      },
      {
        questionText: "How do you prefer to receive information about baby care?",
        options: [
          { text: "Written guides I can reference on my own", value: "solo-processing" },
          { text: "Hands-on demonstrations from someone I trust", value: "acts-of-service" },
          { text: "Conversations with experienced parents", value: "quality-time" },
          { text: "Fun, lighthearted videos at my own pace", value: "humor-distraction" }
        ],
        orderNumber: 2
      },
      {
        questionText: "After a particularly hard day, you most want your partner to:",
        options: [
          { text: "Handle dinner and cleanup without being asked", value: "acts-of-service" },
          { text: "Put their phone away and really talk with me", value: "quality-time" },
          { text: "Give me an hour alone while they take the baby", value: "solo-processing" },
          { text: "Tell me a funny story or put on our favorite show", value: "humor-distraction" }
        ],
        orderNumber: 3
      },
      {
        questionText: "When a friend visits with your new baby, the ideal visit looks like:",
        options: [
          { text: "They bring a meal and help tidy up a bit", value: "acts-of-service" },
          { text: "They hold the baby while we catch up over tea", value: "quality-time" },
          { text: "A brief, warm visit — I appreciate them but get tired quickly", value: "solo-processing" },
          { text: "They make me laugh and remind me of my pre-baby self", value: "humor-distraction" }
        ],
        orderNumber: 4
      },
      {
        questionText: "Which statement resonates most with you?",
        options: [
          { text: "Don't ask if I need help — just do something helpful", value: "acts-of-service" },
          { text: "The best gift is your undivided attention", value: "quality-time" },
          { text: "I need time alone to feel like myself again", value: "solo-processing" },
          { text: "If we're not laughing, we're not surviving", value: "humor-distraction" }
        ],
        orderNumber: 5
      },
      {
        questionText: "When you're anxious about something, you tend to:",
        options: [
          { text: "Channel it into action — organizing, cleaning, planning", value: "acts-of-service" },
          { text: "Talk it through with someone I trust", value: "quality-time" },
          { text: "Need quiet time to think before I can talk about it", value: "solo-processing" },
          { text: "Look for the silver lining or something to lighten the mood", value: "humor-distraction" }
        ],
        orderNumber: 6
      },
      {
        questionText: "The best postpartum support group would be:",
        options: [
          { text: "One that shares practical tips, meal prep ideas, and life hacks", value: "acts-of-service" },
          { text: "A small, intimate circle where everyone really listens", value: "quality-time" },
          { text: "An online community I can engage with on my own schedule", value: "solo-processing" },
          { text: "A group that's warm, funny, and doesn't take things too seriously", value: "humor-distraction" }
        ],
        orderNumber: 7
      },
      {
        questionText: "If you could choose one gift for your postpartum self:",
        options: [
          { text: "A month of house cleaning service", value: "acts-of-service" },
          { text: "Weekly date nights with my partner", value: "quality-time" },
          { text: "A cozy reading nook just for me", value: "solo-processing" },
          { text: "A subscription to my favorite comedy streaming service", value: "humor-distraction" }
        ],
        orderNumber: 8
      }
    ]
  },
  {
    title: "Postpartum Readiness Check",
    description: "Assess your mental and emotional preparation for the postpartum period. This isn't about being perfectly ready — it's about knowing where you stand and what to work on.",
    category: "mindset",
    questionCount: 8,
    estimatedMinutes: 5,
    resultTypes: {
      "well-prepared": {
        title: "Confidently Prepared",
        description: "You've done thoughtful preparation for the postpartum period. You have realistic expectations, a support system in place, and self-awareness about your emotional needs.",
        insights: [
          "Your preparation is a strength — trust the work you've put in",
          "Stay flexible; even the best plans change when baby arrives",
          "Consider sharing what you've learned with other expecting mothers"
        ]
      },
      "mostly-ready": {
        title: "Almost There",
        description: "You're on a solid path with good awareness and some plans in place. A few areas could use more attention, but you have a strong foundation to build on.",
        insights: [
          "Focus on the 1-2 areas that feel least certain to you",
          "Talk to your partner about the topics you haven't covered yet",
          "Remember that 'good enough' preparation is truly good enough"
        ]
      },
      "building-awareness": {
        title: "Building Awareness",
        description: "You're in the early stages of postpartum preparation, and that's perfectly okay. Awareness is the first step, and you're taking it by engaging with this quiz.",
        insights: [
          "Start with one small step: talk to one person who has been through it",
          "Write down your top 3 worries and discuss them with your provider",
          "You have more time than you think — start small and build from there"
        ]
      },
      "needs-attention": {
        title: "Time to Focus",
        description: "Your postpartum preparation could benefit from more attention. This isn't a criticism — many people don't think about postpartum until it's upon them. You're already ahead by recognizing this now.",
        insights: [
          "Schedule a conversation with your healthcare provider about postpartum planning",
          "Ask a trusted friend or family member about their postpartum experience",
          "Consider a prenatal class that includes postpartum preparation content"
        ]
      }
    },
    questions: [
      {
        questionText: "How confident do you feel about recognizing signs of postpartum depression?",
        options: [
          { text: "I've researched it and know the warning signs well", value: "well-prepared", score: 4 },
          { text: "I have a general idea but could learn more", value: "mostly-ready", score: 3 },
          { text: "I've heard of it but don't know specifics", value: "building-awareness", score: 2 },
          { text: "I haven't thought much about it", value: "needs-attention", score: 1 }
        ],
        orderNumber: 1
      },
      {
        questionText: "Do you have a plan for who will support you in the first two weeks after birth?",
        options: [
          { text: "Yes, I have a detailed schedule of helpers", value: "well-prepared", score: 4 },
          { text: "I have some people in mind but nothing formal", value: "mostly-ready", score: 3 },
          { text: "I'm still figuring this out", value: "building-awareness", score: 2 },
          { text: "I assumed I'd handle it mostly on my own", value: "needs-attention", score: 1 }
        ],
        orderNumber: 2
      },
      {
        questionText: "How do you feel about asking for help when you need it?",
        options: [
          { text: "Comfortable — I know it's essential, not weakness", value: "well-prepared", score: 4 },
          { text: "Working on it — I know I should but it's hard", value: "mostly-ready", score: 3 },
          { text: "Uncomfortable but willing to try", value: "building-awareness", score: 2 },
          { text: "Very uncomfortable — I prefer to do things myself", value: "needs-attention", score: 1 }
        ],
        orderNumber: 3
      },
      {
        questionText: "Have you and your partner discussed division of nighttime duties?",
        options: [
          { text: "Yes, we have a specific plan that works for both of us", value: "well-prepared", score: 4 },
          { text: "We've talked about it loosely", value: "mostly-ready", score: 3 },
          { text: "We've mentioned it but haven't planned details", value: "building-awareness", score: 2 },
          { text: "We haven't discussed this at all", value: "needs-attention", score: 1 }
        ],
        orderNumber: 4
      },
      {
        questionText: "What are your expectations about your emotional state after birth?",
        options: [
          { text: "I expect a full range of emotions and have coping strategies ready", value: "well-prepared", score: 4 },
          { text: "I know it'll be emotional but feel reasonably prepared", value: "mostly-ready", score: 3 },
          { text: "I hope I'll feel happy but I'm a little nervous", value: "building-awareness", score: 2 },
          { text: "I expect to feel naturally bonded and happy right away", value: "needs-attention", score: 1 }
        ],
        orderNumber: 5
      },
      {
        questionText: "How prepared are you for changes in your relationship with your partner?",
        options: [
          { text: "We've openly discussed how things might shift and made plans", value: "well-prepared", score: 4 },
          { text: "We've acknowledged changes are coming", value: "mostly-ready", score: 3 },
          { text: "I know things will change but we haven't discussed it much", value: "building-awareness", score: 2 },
          { text: "I don't think our relationship will change much", value: "needs-attention", score: 1 }
        ],
        orderNumber: 6
      },
      {
        questionText: "Do you have your healthcare provider's contact information for postpartum emergencies?",
        options: [
          { text: "Yes, programmed in my phone along with crisis resources", value: "well-prepared", score: 4 },
          { text: "I have my doctor's number somewhere", value: "mostly-ready", score: 3 },
          { text: "I could find it if I needed to", value: "building-awareness", score: 2 },
          { text: "I haven't thought about postpartum emergencies", value: "needs-attention", score: 1 }
        ],
        orderNumber: 7
      },
      {
        questionText: "How do you feel about your body changing after pregnancy?",
        options: [
          { text: "I've made peace with it — recovery takes time and that's okay", value: "well-prepared", score: 4 },
          { text: "I'm trying to have realistic expectations", value: "mostly-ready", score: 3 },
          { text: "I'm a bit anxious about bouncing back", value: "building-awareness", score: 2 },
          { text: "I expect to get back to normal quickly", value: "needs-attention", score: 1 }
        ],
        orderNumber: 8
      }
    ]
  }
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
  } else {
    const hasNewCategories = existingTasks.some(t => t.category === 'hospital-bag' || t.category === 'postpartum');
    if (!hasNewCategories) {
      console.log("Re-seeding tasks with updated categories...");
      await db.delete(tasks);
      await db.insert(tasks).values(taskData);
      console.log(`Re-seeded ${taskData.length} tasks`);
    }
  }

  const existingQuizzes = await db.select().from(quizzes);
  if (existingQuizzes.length === 0) {
    console.log("Seeding quizzes...");
    for (const quiz of quizData) {
      const { questions, ...quizRow } = quiz;
      const [inserted] = await db.insert(quizzes).values(quizRow).returning();
      for (const q of questions) {
        await db.insert(quizQuestions).values({
          quizId: inserted.id,
          questionText: q.questionText,
          options: q.options,
          orderNumber: q.orderNumber,
        });
      }
    }
    console.log(`Seeded ${quizData.length} quizzes with questions`);
  }
}
