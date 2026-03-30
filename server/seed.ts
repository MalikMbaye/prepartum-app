import { db } from "./db";
import { prompts, tasks, quizzes, quizQuestions, roleplayScenarios, closingReframes } from "@shared/schema";
import { eq } from "drizzle-orm";
import { seedIntakeQuestions } from "./seed-intake";

const promptData = [
  { title: "Morning Mindset", body: "What does being a 'good enough' mother mean to you? Release perfectionism and explore what feels authentic.", category: "mindset", weekNumber: 1, dayOfWeek: 1, seasons: ["tender", "grounding", "expanding", "restorative", "mixed"], depth: "medium", format: "text", intensity: 2, estimatedEnergy: "low", relevanceTags: ["identity_concern"], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null },
  { title: "Self-Compassion", body: "Write about a fear you have about motherhood. Now respond to yourself as you would to your best friend.", category: "mindset", weekNumber: 1, dayOfWeek: 2, seasons: ["tender", "grounding", "mixed"], depth: "deep", format: "text", intensity: 3, estimatedEnergy: "medium", relevanceTags: ["low_mood", "bonding_guilt"], addressesFear: "imposter_fear", requiredFlags: null, excludedFlags: null, trimester: null, childConnection: "Every fear you face in pregnancy is one less shadow your child inherits from you." },
  { title: "Identity Shift", body: "How is your identity evolving during pregnancy? What parts of yourself do you want to carry forward?", category: "mindset", weekNumber: 1, dayOfWeek: 3, seasons: ["grounding", "expanding", "mixed"], depth: "medium", format: "text", intensity: 3, estimatedEnergy: "medium", relevanceTags: ["identity_concern"], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null, childConnection: "The woman you're becoming is the first role model your child will ever have." },
  { title: "Partner Connection", body: "Share one thing you appreciate about your partner's support during this journey. Have you told them?", category: "relationships", weekNumber: 1, dayOfWeek: 4, seasons: ["grounding", "expanding", "mixed"], depth: "light", format: "action", intensity: 1, estimatedEnergy: "low", relevanceTags: ["relationship_concern"], addressesFear: null, requiredFlags: null, excludedFlags: ["solo_parenting", "single_mother"], trimester: null },
  { title: "Support Circle", body: "Who are the three people you trust most to support you as a new mother? What makes them special?", category: "relationships", weekNumber: 1, dayOfWeek: 5, seasons: ["tender", "grounding", "expanding", "restorative", "mixed"], depth: "light", format: "text", intensity: 1, estimatedEnergy: "low", relevanceTags: ["low_support", "peer_isolation"], addressesFear: "support_anxiety", requiredFlags: null, excludedFlags: null, trimester: null },
  { title: "Body Wisdom", body: "Take a moment to thank your body for what it's doing right now. What sensations are you noticing today?", category: "physical", weekNumber: 1, dayOfWeek: 6, seasons: ["tender", "grounding", "expanding", "restorative", "mixed"], depth: "light", format: "text", intensity: 1, estimatedEnergy: "low", relevanceTags: ["body_image_concern"], addressesFear: "health_anxiety", requiredFlags: null, excludedFlags: null, trimester: null },
  { title: "Rest & Recovery", body: "What does true rest look like for you? Create a small rest ritual you can practice this week.", category: "physical", weekNumber: 1, dayOfWeek: 7, seasons: ["tender", "restorative", "mixed"], depth: "light", format: "action", intensity: 1, estimatedEnergy: "low", relevanceTags: ["burnout_risk", "sleep_anxiety"], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null },

  { title: "Letting Go", body: "What expectation about pregnancy or motherhood are you ready to release? Write it down, then let it go.", category: "mindset", weekNumber: 2, dayOfWeek: 1, seasons: ["tender", "grounding", "mixed"], depth: "medium", format: "text", intensity: 2, estimatedEnergy: "medium", relevanceTags: ["emotional_suppression"], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null },
  { title: "Gratitude Anchor", body: "Name three things about this moment in your pregnancy journey that you're grateful for.", category: "mindset", weekNumber: 2, dayOfWeek: 2, seasons: ["tender", "grounding", "expanding", "restorative", "mixed"], depth: "light", format: "text", intensity: 1, estimatedEnergy: "low", relevanceTags: [], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null },
  { title: "Emotional Weather", body: "If your emotions today were weather, what would the forecast be? Describe without judgment.", category: "mindset", weekNumber: 2, dayOfWeek: 3, seasons: ["tender", "grounding", "expanding", "restorative", "mixed"], depth: "medium", format: "text", intensity: 2, estimatedEnergy: "low", relevanceTags: ["low_mood", "emotional_numbness"], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null },
  { title: "Communicating Needs", body: "What's one need you haven't expressed to your partner or loved ones? Practice saying it here first.", category: "relationships", weekNumber: 2, dayOfWeek: 4, seasons: ["tender", "grounding", "mixed"], depth: "medium", format: "text", intensity: 3, estimatedEnergy: "medium", relevanceTags: ["emotional_suppression", "conflict_avoidant"], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null, childConnection: "How you handle hard moments now is teaching your child what safety feels like before they're even born." },
  { title: "Boundary Setting", body: "What boundary do you need to set to protect your peace during this season? How will you communicate it?", category: "relationships", weekNumber: 2, dayOfWeek: 5, seasons: ["grounding", "expanding", "mixed"], depth: "medium", format: "text", intensity: 3, estimatedEnergy: "medium", relevanceTags: ["hyper_independent"], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null },
  { title: "Movement Check", body: "How has your relationship with movement changed during pregnancy? What feels good in your body right now?", category: "physical", weekNumber: 2, dayOfWeek: 6, seasons: ["grounding", "expanding", "restorative", "mixed"], depth: "light", format: "text", intensity: 1, estimatedEnergy: "low", relevanceTags: ["body_image_concern"], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null },
  { title: "Nourishment", body: "Beyond food, what nourishes you? List five non-food things that fill your cup.", category: "physical", weekNumber: 2, dayOfWeek: 7, seasons: ["tender", "restorative", "mixed"], depth: "light", format: "text", intensity: 1, estimatedEnergy: "low", relevanceTags: ["burnout_risk", "self_care_guilt"], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null },

  { title: "Inner Critic", body: "What is your inner critic saying about your readiness for motherhood? Write a compassionate rebuttal.", category: "mindset", weekNumber: 3, dayOfWeek: 1, seasons: ["tender", "grounding", "mixed"], depth: "deep", format: "text", intensity: 4, estimatedEnergy: "high", relevanceTags: ["low_mood", "bonding_guilt"], addressesFear: "imposter_fear", requiredFlags: null, excludedFlags: null, trimester: null },
  { title: "Visualization", body: "Close your eyes and picture yourself one year from now as a mother. What do you see? How does it feel?", category: "mindset", weekNumber: 3, dayOfWeek: 2, seasons: ["expanding", "grounding", "mixed"], depth: "medium", format: "voice", intensity: 2, estimatedEnergy: "medium", relevanceTags: [], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null },
  { title: "Values Inventory", body: "List your top five values. How do you want these to shape your parenting?", category: "mindset", weekNumber: 3, dayOfWeek: 3, seasons: ["grounding", "expanding", "mixed"], depth: "medium", format: "text", intensity: 3, estimatedEnergy: "medium", relevanceTags: ["identity_concern"], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null },
  { title: "Family Patterns", body: "What patterns from your own upbringing do you want to continue? What would you like to change?", category: "relationships", weekNumber: 3, dayOfWeek: 4, seasons: ["tender", "grounding", "mixed"], depth: "deep", format: "text", intensity: 4, estimatedEnergy: "high", relevanceTags: ["intergenerational_healing", "maternal_wound"], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null, childConnection: "The cycles you examine today are the ones your child will never have to carry." },
  { title: "Village Building", body: "Think about your support network. Is there someone you'd like to invite closer into your journey?", category: "relationships", weekNumber: 3, dayOfWeek: 5, seasons: ["tender", "grounding", "expanding", "restorative", "mixed"], depth: "light", format: "action", intensity: 2, estimatedEnergy: "low", relevanceTags: ["low_support", "peer_isolation", "social_withdrawal"], addressesFear: "support_anxiety", requiredFlags: null, excludedFlags: null, trimester: null },
  { title: "Sleep Sanctuary", body: "How is your sleep? What one thing could you adjust tonight to improve your rest?", category: "physical", weekNumber: 3, dayOfWeek: 6, seasons: ["tender", "restorative", "mixed"], depth: "light", format: "action", intensity: 1, estimatedEnergy: "low", relevanceTags: ["sleep_anxiety", "burnout_risk"], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null },
  { title: "Breath Work", body: "Try three slow, deep breaths right now. Inhale for 4 counts, hold for 4, exhale for 6. How do you feel?", category: "physical", weekNumber: 3, dayOfWeek: 7, seasons: ["tender", "grounding", "expanding", "restorative", "mixed"], depth: "light", format: "action", intensity: 1, estimatedEnergy: "low", relevanceTags: ["sleep_anxiety"], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null },

  { title: "Joy Inventory", body: "What brings you joy right now in this season? Make a list and commit to one joyful thing today.", category: "mindset", weekNumber: 4, dayOfWeek: 1, seasons: ["expanding", "grounding", "restorative", "mixed"], depth: "light", format: "text", intensity: 1, estimatedEnergy: "low", relevanceTags: ["low_mood"], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null },
  { title: "Courage", body: "What's the bravest thing you've done during this pregnancy? Celebrate that courage.", category: "mindset", weekNumber: 4, dayOfWeek: 2, seasons: ["expanding", "grounding", "mixed"], depth: "light", format: "text", intensity: 1, estimatedEnergy: "low", relevanceTags: [], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null },
  { title: "Intentions", body: "Set an intention for the week ahead. What energy do you want to carry into the coming days?", category: "mindset", weekNumber: 4, dayOfWeek: 3, seasons: ["grounding", "expanding", "mixed"], depth: "light", format: "text", intensity: 1, estimatedEnergy: "low", relevanceTags: [], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null },
  { title: "Partner Dialogue", body: "What's one topic about parenting you and your partner haven't discussed yet? Start that conversation here.", category: "relationships", weekNumber: 4, dayOfWeek: 4, seasons: ["grounding", "expanding", "mixed"], depth: "medium", format: "action", intensity: 3, estimatedEnergy: "medium", relevanceTags: ["relationship_concern", "conflict_avoidant"], addressesFear: null, requiredFlags: null, excludedFlags: ["solo_parenting", "single_mother"], trimester: null },
  { title: "Asking for Help", body: "When was the last time you asked for help? What makes it easy or hard for you? Practice asking for one thing today.", category: "relationships", weekNumber: 4, dayOfWeek: 5, seasons: ["tender", "grounding", "mixed"], depth: "medium", format: "action", intensity: 3, estimatedEnergy: "medium", relevanceTags: ["hyper_independent", "low_support"], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null, childConnection: "When you let people support you, you're showing your child that receiving love is not weakness." },
  { title: "Comfort Map", body: "Map out what brings your body comfort: textures, temperatures, positions, sounds. Know your comfort toolkit.", category: "physical", weekNumber: 4, dayOfWeek: 6, seasons: ["tender", "restorative", "mixed"], depth: "light", format: "text", intensity: 1, estimatedEnergy: "low", relevanceTags: ["body_image_concern"], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null },
  { title: "Presence Practice", body: "Spend two minutes with your hand on your belly. What do you want your baby to know about this moment?", category: "physical", weekNumber: 4, dayOfWeek: 7, seasons: ["tender", "expanding", "mixed"], depth: "medium", format: "voice", intensity: 2, estimatedEnergy: "low", relevanceTags: ["bonding_guilt"], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null },

  { title: "Surrendering Control", body: "Motherhood requires letting go of control. What's one area where you can practice surrender this week?", category: "mindset", weekNumber: 5, dayOfWeek: 1, seasons: ["grounding", "expanding", "mixed"], depth: "medium", format: "text", intensity: 3, estimatedEnergy: "medium", relevanceTags: ["hyper_independent"], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null },
  { title: "Affirmation", body: "Write yourself an affirmation for this stage of pregnancy. Make it specific, personal, and powerful.", category: "mindset", weekNumber: 5, dayOfWeek: 2, seasons: ["tender", "grounding", "expanding", "restorative", "mixed"], depth: "light", format: "text", intensity: 1, estimatedEnergy: "low", relevanceTags: [], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null },
  { title: "Growth Reflection", body: "How have you grown since the beginning of this pregnancy? What surprised you about your own resilience?", category: "mindset", weekNumber: 5, dayOfWeek: 3, seasons: ["expanding", "grounding", "mixed"], depth: "medium", format: "text", intensity: 2, estimatedEnergy: "medium", relevanceTags: [], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null },
  { title: "Love Languages", body: "How do you most feel loved? How does your partner feel loved? Explore how these may shift after baby arrives.", category: "relationships", weekNumber: 5, dayOfWeek: 4, seasons: ["grounding", "expanding", "mixed"], depth: "medium", format: "text", intensity: 2, estimatedEnergy: "medium", relevanceTags: ["relationship_concern", "partner_disconnect"], addressesFear: null, requiredFlags: null, excludedFlags: ["solo_parenting", "single_mother"], trimester: null },
  { title: "Friend Check", body: "Which friendship has meant the most to you during pregnancy? Consider reaching out to thank them today.", category: "relationships", weekNumber: 5, dayOfWeek: 5, seasons: ["expanding", "grounding", "mixed"], depth: "light", format: "action", intensity: 1, estimatedEnergy: "low", relevanceTags: ["social_withdrawal", "peer_isolation"], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null },
  { title: "Gentle Movement", body: "What gentle movement can you do today that honors where your body is? Even five minutes counts.", category: "physical", weekNumber: 5, dayOfWeek: 6, seasons: ["tender", "grounding", "restorative", "mixed"], depth: "light", format: "action", intensity: 1, estimatedEnergy: "low", relevanceTags: ["body_image_concern"], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null },
  { title: "Sensory Grounding", body: "Practice the 5-4-3-2-1 grounding technique: 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste.", category: "physical", weekNumber: 5, dayOfWeek: 7, seasons: ["tender", "grounding", "restorative", "mixed"], depth: "light", format: "action", intensity: 1, estimatedEnergy: "low", relevanceTags: ["sleep_anxiety"], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null },

  { title: "Motherhood Vision", body: "Describe the kind of home atmosphere you want to create for your child. What does it look, sound, and feel like?", category: "mindset", weekNumber: 6, dayOfWeek: 1, seasons: ["expanding", "grounding", "mixed"], depth: "medium", format: "text", intensity: 2, estimatedEnergy: "medium", relevanceTags: [], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null },
  { title: "Release Comparison", body: "Where are you comparing your pregnancy journey to others? How can you redirect that energy inward?", category: "mindset", weekNumber: 6, dayOfWeek: 2, seasons: ["tender", "grounding", "mixed"], depth: "medium", format: "text", intensity: 3, estimatedEnergy: "medium", relevanceTags: ["screen_time_concern"], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null },
  { title: "Inner Wisdom", body: "Your intuition is growing stronger. What is it telling you right now about what you need?", category: "mindset", weekNumber: 6, dayOfWeek: 3, seasons: ["tender", "grounding", "expanding", "restorative", "mixed"], depth: "medium", format: "voice", intensity: 2, estimatedEnergy: "low", relevanceTags: [], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null },
  { title: "Team Planning", body: "Discuss with your partner: What does the first week with baby look like? Who does what?", category: "relationships", weekNumber: 6, dayOfWeek: 4, seasons: ["grounding", "expanding", "mixed"], depth: "medium", format: "action", intensity: 3, estimatedEnergy: "medium", relevanceTags: ["conflict_avoidant", "relationship_concern"], addressesFear: null, requiredFlags: null, excludedFlags: ["solo_parenting", "single_mother"], trimester: 3 },
  { title: "Gratitude Letter", body: "Write a short letter of gratitude to someone who has supported you during this pregnancy.", category: "relationships", weekNumber: 6, dayOfWeek: 5, seasons: ["tender", "grounding", "expanding", "restorative", "mixed"], depth: "light", format: "text", intensity: 1, estimatedEnergy: "low", relevanceTags: [], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null },
  { title: "Birth Preferences", body: "What feels most important to you about your birth experience? Not the plan, but the feeling you want.", category: "physical", weekNumber: 6, dayOfWeek: 6, seasons: ["grounding", "expanding", "mixed"], depth: "medium", format: "text", intensity: 2, estimatedEnergy: "medium", relevanceTags: ["birth_avoidant"], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: 3 },
  { title: "Body Appreciation", body: "Name five things your body has done today that you can appreciate. It's doing incredible work.", category: "physical", weekNumber: 6, dayOfWeek: 7, seasons: ["tender", "grounding", "expanding", "restorative", "mixed"], depth: "light", format: "text", intensity: 1, estimatedEnergy: "low", relevanceTags: ["body_image_concern"], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null },

  { title: "Solo Strength", body: "You're doing this on your own, and that takes incredible courage. What strength have you discovered in yourself that you didn't know was there?", category: "relationships", weekNumber: 1, dayOfWeek: 4, seasons: ["tender", "grounding", "mixed"], depth: "medium", format: "text", intensity: 2, estimatedEnergy: "medium", relevanceTags: ["solo_parenting", "single_mother"], addressesFear: null, requiredFlags: ["solo_parenting"], excludedFlags: null, trimester: null },
  { title: "My Support Team", body: "Even without a partner, you don't have to do this completely alone. Who is one person you can lean on this week, and for what?", category: "relationships", weekNumber: 2, dayOfWeek: 4, seasons: ["tender", "grounding", "mixed"], depth: "light", format: "action", intensity: 2, estimatedEnergy: "low", relevanceTags: ["solo_parenting", "low_support"], addressesFear: "support_anxiety", requiredFlags: ["solo_parenting"], excludedFlags: null, trimester: null },
  { title: "Healing Old Patterns", body: "How is your experience with your own mother shaping the mother you want to be? Write a letter to your younger self about what you've learned.", category: "relationships", weekNumber: 3, dayOfWeek: 4, seasons: ["tender", "mixed"], depth: "deep", format: "text", intensity: 4, estimatedEnergy: "high", relevanceTags: ["maternal_wound", "intergenerational_healing", "mother_loss"], addressesFear: null, requiredFlags: null, excludedFlags: null, trimester: null },

  // === ANXIOUS PLANNER (7 prompts) ===
  { body: "What is the specific thought that loops most when your anxiety spikes about this pregnancy? Write it down exactly as it sounds in your head.", category: "mindset", context: "Anxiety in pregnancy is not a sign something is wrong. It is one of the most common experiences expectant mothers have. Research shows that naming anxious thoughts precisely is the first step in reducing their power over you.", closingReframe: "You are the observer of your own mind. That awareness is where your strength begins.", personaTags: ["anxious_planner"], seasons: ["tender", "grounding", "mixed"], trimester: 1, depth: "medium", format: "text", intensity: 2, estimatedEnergy: "medium", relevanceTags: ["anxiety_concern"], requiredFlags: null, excludedFlags: null, addressesFear: "imposter_fear" },
  { body: "What is the actual worst-case scenario you keep avoiding thinking about? Write it out completely. Then write what you would actually do if it happened.", category: "mindset", context: "Avoidance is anxiety's best friend. The thoughts we push away grow louder. CBT research shows that writing out feared scenarios, along with your response to them, significantly reduces their emotional charge.", closingReframe: "You have survived hard things before. You will survive whatever comes next.", personaTags: ["anxious_planner"], seasons: ["grounding", "expanding", "mixed"], trimester: 1, depth: "deep", format: "text", intensity: 3, estimatedEnergy: "high", relevanceTags: ["anxiety_concern", "identity_concern"], requiredFlags: null, excludedFlags: null, addressesFear: null },
  { body: "Make a list of everything you are trying to control about this pregnancy. Now circle the ones you actually have control over. What do you notice?", category: "mindset", context: "The desire for control during pregnancy is natural and healthy, up to a point. Learning the difference between what you can and cannot control is one of the most powerful anxiety-reduction skills you can build right now.", closingReframe: "Preparation is power. Acceptance is peace. You need both.", personaTags: ["anxious_planner"], seasons: ["grounding", "expanding", "mixed"], trimester: 1, depth: "medium", format: "action", intensity: 2, estimatedEnergy: "medium", relevanceTags: ["anxiety_concern"], requiredFlags: null, excludedFlags: null, addressesFear: null },
  { body: "What would it feel like to approach your birth plan as a set of preferences rather than a script? What changes in your body when you imagine that?", category: "mindset", context: "Rigid birth plans are one of the leading causes of postpartum disappointment. Research shows that women who hold plans loosely, treating them as preferences rather than requirements, report significantly higher birth satisfaction regardless of outcome.", closingReframe: "A good plan and a flexible mind. That is how you walk into birth prepared.", personaTags: ["anxious_planner"], seasons: ["expanding", "mixed"], trimester: 2, depth: "medium", format: "text", intensity: 2, estimatedEnergy: "medium", relevanceTags: ["anxiety_concern"], requiredFlags: null, excludedFlags: null, addressesFear: null },
  { body: "If you noticed yourself struggling at 6 weeks postpartum, what is the exact first step you would take? Name the person, the phone number, or the action.", category: "mindset", context: "One in five mothers experience postpartum depression. Research consistently shows that women who plan their mental health response BEFORE birth are significantly more likely to seek help early. Early help changes outcomes dramatically.", closingReframe: "Having a plan for hard times is not weakness. It is the most loving thing you can do for yourself and your baby.", personaTags: ["anxious_planner"], seasons: ["grounding", "expanding", "mixed"], trimester: 3, depth: "deep", format: "action", intensity: 3, estimatedEnergy: "medium", relevanceTags: ["anxiety_concern", "burnout_risk"], requiredFlags: null, excludedFlags: null, addressesFear: null },
  { body: "What are you researching or Googling about your pregnancy that is making your anxiety worse, not better? What would happen if you stepped away from it for 3 days?", category: "mindset", context: "Health anxiety and information-seeking create a loop: the more we search, the more we find to worry about. Your nervous system cannot distinguish between a real threat and a frightening headline. Selective information intake is a skill, not avoidance.", closingReframe: "You do not need to know everything to be prepared. You need to trust yourself.", personaTags: ["anxious_planner"], seasons: ["tender", "grounding", "mixed"], trimester: 1, depth: "medium", format: "text", intensity: 2, estimatedEnergy: "medium", relevanceTags: ["anxiety_concern"], requiredFlags: null, excludedFlags: null, addressesFear: null },
  { body: "Write down three things that are genuinely going well in this pregnancy right now. Focus only on what is actually going right.", category: "mindset", context: "Anxiety has a built-in negativity bias. It notices threats three times more easily than safety. Actively building evidence of what is working is not toxic positivity. It is how you rewire a nervous system that has learned to scan for danger.", closingReframe: "Evidence of safety is as real as evidence of risk. You get to choose which you collect.", personaTags: ["anxious_planner"], seasons: ["tender", "grounding", "mixed"], trimester: 2, depth: "light", format: "action", intensity: 1, estimatedEnergy: "low", relevanceTags: ["anxiety_concern"], requiredFlags: null, excludedFlags: null, addressesFear: null },

  // === HEALING MOTHER (8 prompts) ===
  { body: "What is something painful from your past that you are afraid this pregnancy might wake up? You do not have to go deep. Just name it.", category: "mindset", context: "Pregnancy is a powerful emotional amplifier. For women who have experienced trauma, loss, or difficult relationships, pregnancy often surfaces unresolved material. This is not a sign something is wrong. It is an invitation. You do not have to heal it all today.", closingReframe: "What you name, you can work with. What you bury, you carry.", personaTags: ["healing_mother"], seasons: ["tender", "grounding", "mixed"], trimester: 1, depth: "medium", format: "text", intensity: 2, estimatedEnergy: "medium", relevanceTags: ["maternal_wound", "identity_concern"], requiredFlags: null, excludedFlags: null, addressesFear: null },
  { body: "Is there a version of motherhood you lost before this pregnancy: a miscarriage, a loss, a path that closed? Take a moment to acknowledge her. What would you say to that version of yourself?", category: "mindset", context: "Grief and hope can exist in the same breath. Many mothers arrive at this pregnancy carrying a previous loss that was never fully witnessed. This reflection is not about reopening wounds. It is about honoring every path that brought you here.", closingReframe: "Every path that closed was part of the journey to this one. All of it brought you here.", personaTags: ["healing_mother"], seasons: ["tender", "grounding", "mixed"], trimester: 1, depth: "deep", format: "voice", intensity: 3, estimatedEnergy: "high", relevanceTags: ["maternal_wound"], requiredFlags: null, excludedFlags: null, addressesFear: null },
  { body: "What does safety feel like in your body right now? Physical safety, right now, in this moment. Describe it or notice its absence.", category: "physical", context: "For women who have experienced trauma, the body often stops feeling like a safe home. Pregnancy, with all its physical changes, can intensify this. Learning to locate safety in the body, even briefly, is a foundational healing practice.", closingReframe: "You are safe right now. Your baby is safe right now. That is enough for this moment.", personaTags: ["healing_mother"], seasons: ["tender", "grounding", "mixed"], trimester: 1, depth: "medium", format: "text", intensity: 2, estimatedEnergy: "medium", relevanceTags: ["maternal_wound", "body_image_concern"], requiredFlags: null, excludedFlags: null, addressesFear: null },
  { body: "What fears about this pregnancy belong to what you are carrying from the past, and which ones are actually about right now? Try to sort them.", category: "mindset", context: "Trauma has a way of making the past feel present. Fears that belong to a previous experience often get activated by a new one. Gently separating 'then' from 'now' is not about dismissing the past. It is about giving this pregnancy its own story.", closingReframe: "The past happened. It is not happening now. You are allowed to know the difference.", personaTags: ["healing_mother"], seasons: ["grounding", "expanding", "mixed"], trimester: 2, depth: "deep", format: "text", intensity: 3, estimatedEnergy: "high", relevanceTags: ["maternal_wound", "anxiety_concern"], requiredFlags: null, excludedFlags: null, addressesFear: null },
  { body: "What part of yourself did you have to hide or shrink to survive something hard? How do you want your child to know that part of you?", category: "mindset", context: "Survival often requires us to minimize the parts of ourselves that feel too much, want too much, or hurt too openly. But the parts we hid to survive are often our most powerful parts. Your child deserves to meet all of you, not just the resilient version.", closingReframe: "You survived. Now you get to decide who you become on the other side of that.", personaTags: ["healing_mother"], seasons: ["expanding", "mixed"], trimester: 2, depth: "deep", format: "text", intensity: 3, estimatedEnergy: "high", relevanceTags: ["maternal_wound", "identity_concern"], requiredFlags: null, excludedFlags: null, addressesFear: null },
  { body: "Who do you trust to hold your full story during this pregnancy, the whole of it, not just the beautiful parts? Have you let them?", category: "relationships", context: "Research on postpartum depression prevention consistently identifies one factor above all others: a trusted person who knows the full truth of what you are going through. Not a cheerleader. Someone who can hold the hard parts without flinching.", closingReframe: "You do not have to carry your story in silence. There is someone who can hold it with you.", personaTags: ["healing_mother"], seasons: ["grounding", "expanding", "mixed"], trimester: 2, depth: "medium", format: "text", intensity: 2, estimatedEnergy: "medium", relevanceTags: ["maternal_wound"], requiredFlags: null, excludedFlags: ["solo_parenting"], addressesFear: null },
  { body: "Who do you trust most to be fully honest with during this pregnancy? What would you tell them if you knew they could hold it?", category: "relationships", context: "Research on postpartum depression prevention consistently identifies one factor above all others: a trusted person who knows the full truth of what you are going through. Even one person changes everything.", closingReframe: "You do not have to carry your story in silence. There is someone who can hold it with you.", personaTags: ["healing_mother"], seasons: ["grounding", "expanding", "mixed"], trimester: 2, depth: "medium", format: "text", intensity: 2, estimatedEnergy: "medium", relevanceTags: ["maternal_wound"], requiredFlags: ["solo_parenting"], excludedFlags: null, addressesFear: null },
  { body: "What is one small, gentle thing you can do for yourself today that has nothing to do with productivity or being a good mother? Something purely for you.", category: "physical", context: "Women who have been through hard things often become experts at caring for others while neglecting themselves. Pregnancy is an invitation to practice receiving care, not just giving it. What you give yourself now, you give your baby too.", closingReframe: "Receiving care is not selfish. It is how you fill back up.", personaTags: ["healing_mother"], seasons: ["tender", "grounding", "mixed"], trimester: 2, depth: "light", format: "action", intensity: 1, estimatedEnergy: "low", relevanceTags: ["burnout_risk"], requiredFlags: null, excludedFlags: null, addressesFear: null },

  // === FAITH-ANCHORED (6 prompts) ===
  { body: "What does your faith say about this season of your life? Not what your community says. What do YOU hear when you get quiet?", category: "mindset", context: "Faith is most powerful when it is personally owned, not just communally inherited. During pregnancy, a time of profound transformation, what you carry in your own heart matters more than any doctrine. This is a moment to listen for your own truth.", closingReframe: "Your faith is personal before it is communal. What you carry in your heart matters most.", personaTags: ["faith_anchored"], seasons: ["tender", "grounding", "expanding", "restorative", "mixed"], trimester: null, depth: "medium", format: "text", intensity: 2, estimatedEnergy: "medium", relevanceTags: ["spiritual", "values", "meaning"], requiredFlags: null, excludedFlags: null, addressesFear: null },
  { body: "Where do you feel tension between trusting God and wanting to control the outcome of this pregnancy? Be honest. This is a safe space.", category: "mindset", context: "Faith does not eliminate fear. It gives you somewhere to put it. The tension between trust and control is one of the most common spiritual experiences during pregnancy, and naming it honestly is the beginning of working through it.", closingReframe: "Trust and fear are not opposites. They can exist in the same heart at the same time.", personaTags: ["faith_anchored"], seasons: ["tender", "grounding", "mixed"], trimester: 1, depth: "medium", format: "text", intensity: 2, estimatedEnergy: "medium", relevanceTags: ["spiritual", "values", "anxiety_concern"], requiredFlags: null, excludedFlags: null, addressesFear: null },
  { body: "How is your spiritual community showing up for this pregnancy? What are you not asking them for that they would give if you asked?", category: "relationships", context: "Faith communities are one of the most powerful protective factors against postpartum depression, but only when actively engaged. Many women underutilize their community out of pride or not wanting to burden others. Your community wants to show up. Let them.", closingReframe: "You were not meant to carry this alone. Your community is part of how you were designed to be held.", personaTags: ["faith_anchored"], seasons: ["expanding", "grounding", "mixed"], trimester: 2, depth: "medium", format: "text", intensity: 2, estimatedEnergy: "medium", relevanceTags: ["spiritual", "meaning"], requiredFlags: null, excludedFlags: null, addressesFear: null },
  { body: "If this baby is a calling and not just a circumstance, what is the specific assignment you feel you have been given as this child's mother?", category: "mindset", context: "Purpose-driven framing of motherhood, seeing it as a calling rather than a role, is a powerful psychological anchor during hard seasons. Research on meaning-making shows that women who locate larger purpose in their experiences navigate difficulty with greater resilience.", closingReframe: "You were chosen for this child specifically. That is not coincidence. That is calling.", personaTags: ["faith_anchored"], seasons: ["expanding", "mixed"], trimester: 2, depth: "deep", format: "text", intensity: 3, estimatedEnergy: "medium", relevanceTags: ["spiritual", "values", "meaning"], requiredFlags: null, excludedFlags: null, addressesFear: null },
  { body: "What prayer, scripture, or spiritual affirmation do you want to return to during labor? Write it or speak it out loud now so it lives in your body before that day.", category: "mindset", context: "Words that are rehearsed before a high-stress moment become anchors during it. Women who enter birth with a chosen phrase or affirmation, spiritual or otherwise, report using it instinctively when things get hard. Plant it now.", closingReframe: "You are walking into birth held by something greater. You always have been.", personaTags: ["faith_anchored"], seasons: ["grounding", "expanding", "mixed"], trimester: 3, depth: "deep", format: "voice", intensity: 2, estimatedEnergy: "medium", relevanceTags: ["spiritual", "values", "meaning"], requiredFlags: null, excludedFlags: null, addressesFear: null },
  { body: "How do your spiritual beliefs and professional mental health support work together in your life, or do they feel like they are in separate boxes?", category: "mindset", context: "Research consistently shows that faith community and professional mental health support work best in combination, not competition. Seeking therapy is not a sign of insufficient faith. It is wisdom. The most resilient women use every tool available.", closingReframe: "Seeking help is an act of faith. It is trusting that healing is available to you.", personaTags: ["faith_anchored"], seasons: ["grounding", "mixed"], trimester: 3, depth: "medium", format: "text", intensity: 2, estimatedEnergy: "medium", relevanceTags: ["spiritual", "values"], requiredFlags: null, excludedFlags: null, addressesFear: null },

  // === SOLO WARRIOR (5 prompts) ===
  { body: "You are doing this without the support most people assume you have. What does that actually feel like on a normal Tuesday, not in a strong moment, but an ordinary one?", category: "mindset", context: "Solo motherhood requires a kind of constant performance of strength that can become exhausting to sustain. Research on maternal mental health shows that solo mothers who acknowledge difficulty, rather than only performing resilience, have significantly better outcomes.", closingReframe: "Acknowledging the weight of what you carry is not complaining. It is honesty. And honesty is where strength is built.", personaTags: ["solo_warrior"], seasons: ["tender", "grounding", "mixed"], trimester: 1, depth: "medium", format: "text", intensity: 2, estimatedEnergy: "medium", relevanceTags: ["solo_parenting", "burnout_risk"], requiredFlags: ["solo_parenting"], excludedFlags: null, addressesFear: null },
  { body: "Who showed up for you the last time things got genuinely hard, before this pregnancy? Have you told them you might need them again?", category: "relationships", context: "The people who showed up for you before are often the most likely to show up again, if you let them know you need them. Asking is not weakness. It is the bridge between isolation and support.", closingReframe: "Asking for help is not a sign of weakness. It is how you build the village you deserve.", personaTags: ["solo_warrior"], seasons: ["grounding", "expanding", "mixed"], trimester: 2, depth: "medium", format: "text", intensity: 2, estimatedEnergy: "medium", relevanceTags: ["solo_parenting"], requiredFlags: ["solo_parenting"], excludedFlags: null, addressesFear: null },
  { body: "What would it mean for you to receive help without feeling like you owe something back? Where did the idea that you must earn support come from?", category: "mindset", context: "Many solo mothers developed an early belief that support comes with conditions: that love must be earned, that needing help is a debt. This belief, while understandable, is one of the greatest barriers to getting the support that prevents postpartum depression.", closingReframe: "You are allowed to receive love without a price tag. You always were.", personaTags: ["solo_warrior"], seasons: ["grounding", "expanding", "mixed"], trimester: 2, depth: "deep", format: "text", intensity: 3, estimatedEnergy: "high", relevanceTags: ["solo_parenting", "identity_concern"], requiredFlags: ["solo_parenting"], excludedFlags: null, addressesFear: null },
  { body: "Describe the mother you are becoming in three words. The one you are actually becoming. Where do you see her?", category: "mindset", context: "Solo Warriors often define themselves by what they are surviving rather than who they are becoming. Identity is not just shaped by circumstances. It is shaped by the story you choose to tell about those circumstances. This is your story.", closingReframe: "You are becoming someone extraordinary through this. Let that truth land.", personaTags: ["solo_warrior"], seasons: ["expanding", "mixed"], trimester: 2, depth: "medium", format: "text", intensity: 2, estimatedEnergy: "medium", relevanceTags: ["solo_parenting", "identity_concern"], requiredFlags: ["solo_parenting"], excludedFlags: null, addressesFear: null },
  { body: "What would you need to have in place, practically speaking, to feel genuinely supported in the first two weeks after birth? Write the list without editing it for what is realistic.", category: "relationships", context: "The first two weeks postpartum are the highest-risk period for the onset of depression. For solo mothers, this risk is elevated. Planning your support system now, even imperfectly, is one of the most evidence-supported actions you can take for your mental health.", closingReframe: "You deserve a soft landing. Start building it now.", personaTags: ["solo_warrior"], seasons: ["grounding", "mixed"], trimester: 3, depth: "medium", format: "action", intensity: 2, estimatedEnergy: "medium", relevanceTags: ["solo_parenting", "burnout_risk"], requiredFlags: ["solo_parenting"], excludedFlags: null, addressesFear: null },

  // === SUPPORTED NURTURER (6 prompts) ===
  { body: "What does your partner need from you emotionally right now that you have not been giving? What do you need from them that you have not asked for?", category: "relationships", context: "Strong partnerships do not survive the transition to parenthood by accident. They survive because both people keep asking this question, even when it is uncomfortable. The couples who talk about needs before the baby arrives navigate postpartum better than those who wait.", closingReframe: "The relationship that makes it through is the one where both people keep choosing honesty.", personaTags: ["supported_nurturer"], seasons: ["expanding", "mixed"], trimester: 2, depth: "medium", format: "text", intensity: 2, estimatedEnergy: "medium", relevanceTags: ["identity_concern"], requiredFlags: null, excludedFlags: ["solo_parenting"], addressesFear: null },
  { body: "Have you and your partner talked about how your relationship will change when the baby arrives? Not the logistics. The emotional and relational reality of it?", category: "relationships", context: "Research on postpartum relationship strain shows that the couples who struggle most are often the ones who planned everything except their relationship. The logistics, sleep schedules and feeding plans, are covered. The emotional reality rarely is. This conversation is worth having now.", closingReframe: "Naming what might get hard is not pessimism. It is how you protect what you have built.", personaTags: ["supported_nurturer"], seasons: ["expanding", "mixed"], trimester: 2, depth: "deep", format: "text", intensity: 3, estimatedEnergy: "high", relevanceTags: ["identity_concern"], requiredFlags: null, excludedFlags: ["solo_parenting"], addressesFear: null },
  { body: "What is the one thing you have not asked your support system for because it feels like too much? What if it is not too much?", category: "relationships", context: "Even women with strong support systems consistently under-ask. We edit our needs to protect others from inconvenience. But the research is clear: the people who love you want to be needed. The ask is the practice.", closingReframe: "The people who love you want to be needed. Give them the chance.", personaTags: ["supported_nurturer"], seasons: ["grounding", "expanding", "mixed"], trimester: 2, depth: "medium", format: "text", intensity: 2, estimatedEnergy: "medium", relevanceTags: [], requiredFlags: null, excludedFlags: null, addressesFear: null },
  { body: "What does it look like for you and your support person to be a team during the newborn phase? Describe it specifically: who does what, when, and how you will check in with each other.", category: "relationships", context: "Vague commitments to 'being there for each other' postpartum rarely hold up under sleep deprivation and hormonal shifts. Specific planning, who handles what, when, and how you communicate when you are both depleted, is what actually works.", closingReframe: "You built something good together. Now you get to build something even better.", personaTags: ["supported_nurturer"], seasons: ["grounding", "mixed"], trimester: 3, depth: "medium", format: "action", intensity: 2, estimatedEnergy: "medium", relevanceTags: [], requiredFlags: null, excludedFlags: ["solo_parenting"], addressesFear: null },
  { body: "What is one thing your partner does that makes you feel completely seen? Have you told them recently? Say it out loud now.", category: "relationships", context: "Expressing specific appreciation to a partner before the hard season arrives is not just kindness. It is investment. Research on relationship resilience shows that couples who regularly name what they value in each other navigate stress with significantly more capacity for repair.", closingReframe: "What you appreciate grows. Water the things you want to keep.", personaTags: ["supported_nurturer"], seasons: ["expanding", "mixed"], trimester: 2, depth: "light", format: "voice", intensity: 1, estimatedEnergy: "low", relevanceTags: [], requiredFlags: null, excludedFlags: ["solo_parenting"], addressesFear: null },
  { body: "How will you and your partner handle it when one of you is running on empty and the other one is too? Have you talked about what that looks like before it happens?", category: "relationships", context: "Postpartum stress tests even the strongest relationships, not because the love is gone, but because simultaneous depletion is genuinely hard. Couples who plan for this possibility navigate it with far more grace than those who assume love alone will carry them through.", closingReframe: "Planning for hard moments is not a sign you expect them. It is a sign you love each other enough to prepare.", personaTags: ["supported_nurturer"], seasons: ["grounding", "mixed"], trimester: 3, depth: "deep", format: "text", intensity: 3, estimatedEnergy: "high", relevanceTags: ["burnout_risk"], requiredFlags: null, excludedFlags: ["solo_parenting"], addressesFear: null },

  // === ALL PERSONAS - POSTPARTUM MENTAL HEALTH (6 prompts) ===
  { body: "If you struggle postpartum, what is the story you are afraid to tell yourself? And what would a compassionate friend say about that story?", category: "mindset", context: "One in five mothers experience postpartum depression. The shame around struggling, the fear that it means you are a bad mother, that you should be grateful, is often what keeps women from seeking help. Naming your fear about struggling, before it happens, is one of the most protective things you can do.", closingReframe: "Struggling postpartum is not a reflection of how much you love your baby. It is biology. And it is treatable.", personaTags: [], seasons: ["grounding", "mixed"], trimester: 3, depth: "deep", format: "text", intensity: 3, estimatedEnergy: "high", relevanceTags: ["burnout_risk", "anxiety_concern"], requiredFlags: null, excludedFlags: null, addressesFear: "imposter_fear" },
  { body: "What are three warning signs that would tell you, or someone who knows you well, that you are not okay postpartum? Write them down so you both know them.", category: "mindset", context: "Research on PPD prevention consistently shows that women who identify their personal warning signs before birth are significantly more likely to seek help early. Early intervention changes outcomes. This is one of the most important reflections in this app.", closingReframe: "Knowing your signs is how you catch yourself early. It is the most loving thing you can do for yourself and your baby.", personaTags: [], seasons: ["grounding", "mixed"], trimester: 3, depth: "medium", format: "action", intensity: 2, estimatedEnergy: "medium", relevanceTags: ["burnout_risk", "anxiety_concern"], requiredFlags: null, excludedFlags: null, addressesFear: null },
  { body: "Is there one person in your life you could call at 2am postpartum if you were not okay? If yes, have you told them they are that person?", category: "relationships", context: "The single most protective factor against severe postpartum depression is having one person who knows the full truth of what you are going through. Not a cheerleader. One person who will pick up at 2am. If you have that person, make sure they know it.", closingReframe: "You do not need a village of people. You need one person who will pick up.", personaTags: [], seasons: ["grounding", "mixed"], trimester: 3, depth: "medium", format: "text", intensity: 2, estimatedEnergy: "medium", relevanceTags: ["burnout_risk"], requiredFlags: null, excludedFlags: null, addressesFear: null },
  { body: "What does asking for professional mental health support feel like to you? Proud? Shameful? Necessary? Weak? Whatever comes up is information.", category: "mindset", context: "Your relationship to help-seeking will shape what you do if you struggle postpartum. If asking for support feels shameful or like failure, that belief will delay you from getting help at the exact moment you need it most. This reflection is about changing that story before you need it.", closingReframe: "Getting support is the same energy as getting prenatal care. Your mind needs tending too.", personaTags: [], seasons: ["grounding", "mixed"], trimester: 3, depth: "medium", format: "text", intensity: 2, estimatedEnergy: "medium", relevanceTags: ["burnout_risk", "anxiety_concern"], requiredFlags: null, excludedFlags: null, addressesFear: null },
  { body: "What generational pattern are you most proud of carrying forward, and which one are you most committed to ending with you?", category: "mindset", context: "Cycle-breaking is one of the most powerful acts of motherhood. It requires two things: seeing clearly, and choosing deliberately. Both happen through reflection. What you examine today, your child will not have to carry.", closingReframe: "The cycles you examine today are the ones your child will never have to carry.", personaTags: [], seasons: ["expanding", "mixed"], trimester: 2, depth: "deep", format: "text", intensity: 3, estimatedEnergy: "high", relevanceTags: ["maternal_wound", "identity_concern"], requiredFlags: null, excludedFlags: null, addressesFear: null },
  { body: "If your conflict style does not change, how will it show up in your home when your child is five years old? What do you see?", category: "relationships", context: "Children learn emotional regulation by watching the adults around them, not by being taught it. The way you handle hard conversations right now is already shaping the emotional environment your baby will grow up in. This is not about guilt. It is about intentionality.", closingReframe: "You do not have to be perfect. You have to be willing to keep working on it.", personaTags: [], seasons: ["expanding", "mixed"], trimester: 2, depth: "deep", format: "text", intensity: 3, estimatedEnergy: "high", relevanceTags: ["identity_concern"], requiredFlags: null, excludedFlags: null, addressesFear: null },

  // === ADDITIONAL ALL-PERSONA PROMPTS (12 prompts) ===
  { body: "Write a letter to your body. Thank it for what it is doing. Apologize for anything you need to. Tell it what you need from it going forward.", category: "physical", context: "The relationship between a woman and her body is often complicated long before pregnancy arrives. Pregnancy accelerates all of it: the gratitude and the criticism, the wonder and the discomfort. This letter is a way of tending to that relationship directly.", closingReframe: "Your body is not failing you. It is doing something extraordinary. Meet it with the grace you would offer someone you love.", personaTags: [], seasons: ["tender", "grounding", "expanding", "restorative", "mixed"], trimester: null, depth: "deep", format: "text", intensity: 3, estimatedEnergy: "high", relevanceTags: ["body_image_concern"], requiredFlags: null, excludedFlags: null, addressesFear: null },
  { body: "What kind of home do you want your child to grow up in? Describe the feeling of it, not the look of it. What will it feel like to walk through the door?", category: "mindset", context: "The emotional culture of a home is built deliberately or by default. Most parents focus on the physical environment. But the feeling of a home, the emotional temperature and the safety it holds, is built through thousands of small daily choices. Describing it now is the first step to building it intentionally.", closingReframe: "You are the architect of this home's culture. Build it on purpose.", personaTags: [], seasons: ["expanding", "mixed"], trimester: 2, depth: "medium", format: "text", intensity: 2, estimatedEnergy: "medium", relevanceTags: ["identity_concern"], requiredFlags: null, excludedFlags: null, addressesFear: null },
  { body: "Close your eyes and imagine your child at 10 years old coming to you with something they are ashamed of. What do you want them to see on your face?", category: "mindset", context: "The face your child sees when they come to you in shame will determine whether they keep coming. This is not about performance. It is about becoming the parent you want to be long before the moment requires it. What you practice now, you will be able to access then.", closingReframe: "The mother you want to be in that moment is already inside you. She is who you are becoming.", personaTags: [], seasons: ["expanding", "mixed"], trimester: 2, depth: "deep", format: "voice", intensity: 3, estimatedEnergy: "medium", relevanceTags: ["identity_concern"], requiredFlags: null, excludedFlags: null, addressesFear: null },
  { body: "What story about yourself as a mother have you already decided is true before you have even begun? Is that story serving you?", category: "mindset", context: "The stories we tell ourselves before we begin shape what we allow ourselves to become. Many women arrive at motherhood carrying a verdict about themselves:, 'I am like my mother', 'I am not maternal', that was written by someone else. This reflection invites you to examine the verdict before it becomes a self-fulfilling prophecy.", closingReframe: "You have not written this story yet. You are still holding the pen.", personaTags: [], seasons: ["tender", "grounding", "mixed"], trimester: 1, depth: "medium", format: "text", intensity: 2, estimatedEnergy: "medium", relevanceTags: ["identity_concern"], requiredFlags: null, excludedFlags: null, addressesFear: "imposter_fear" },
  { body: "When you picture yourself six weeks after birth, what is the truest version of what that might look like. Not the highlight reel, the real version?", category: "mindset", context: "Unrealistic expectations about postpartum are one of the primary psychological risk factors for depression after birth. Women who arrive at postpartum expecting difficulty, and holding it with compassion, report significantly better outcomes than those who are blindsided by the reality.", closingReframe: "The messy, hard, beautiful version is the real one. She is worth preparing for.", personaTags: [], seasons: ["grounding", "mixed"], trimester: 3, depth: "medium", format: "text", intensity: 2, estimatedEnergy: "medium", relevanceTags: ["burnout_risk", "anxiety_concern"], requiredFlags: null, excludedFlags: null, addressesFear: null },
  { body: "What is one boundary you need to set before the baby arrives, with family, a partner, or yourself, that you have been avoiding?", category: "relationships", context: "Unspoken boundaries become resentments, and resentments are far harder to resolve when you are sleep-deprived and hormonally vulnerable. Setting a clear boundary before the baby arrives is not conflict. It is protection. For yourself and for the relationships you want to keep.", closingReframe: "A boundary is not a wall. It is the shape of your self-respect. Your baby deserves a mother who has one.", personaTags: [], seasons: ["grounding", "mixed"], trimester: 3, depth: "medium", format: "text", intensity: 2, estimatedEnergy: "medium", relevanceTags: ["identity_concern"], requiredFlags: null, excludedFlags: null, addressesFear: null },
  { body: "How has your relationship with your own mother shaped your deepest fear about becoming one? And your deepest hope?", category: "relationships", context: "Our mothers are our first and most powerful models of motherhood. What they gave us, and what they could not, shapes our deepest fears and our deepest hopes about the kind of mother we will become. Understanding this inheritance is not about blame. It is about choice.", closingReframe: "You get to keep what served you and release what did not. That choice is yours.", personaTags: [], seasons: ["grounding", "expanding", "mixed"], trimester: null, depth: "deep", format: "text", intensity: 3, estimatedEnergy: "high", relevanceTags: ["maternal_wound", "identity_concern"], requiredFlags: null, excludedFlags: null, addressesFear: null },
  { body: "What does your body need to feel held right now, not by a person, but physically? More warmth, more rest, more touch, more stillness? Give it that thing today.", category: "physical", context: "Physical self-care in the third trimester is directly connected to emotional resilience going into birth and the postpartum period. Your body is working extraordinarily hard. The question is not whether it deserves tenderness. It does. The question is whether you will give it.", closingReframe: "Your body is working so hard. It deserves your tenderness as much as your baby does.", personaTags: [], seasons: ["tender", "grounding", "mixed"], trimester: 3, depth: "light", format: "action", intensity: 1, estimatedEnergy: "low", relevanceTags: ["body_image_concern", "burnout_risk"], requiredFlags: null, excludedFlags: null, addressesFear: null },
  { body: "What are you most afraid to feel postpartum? Not the circumstances. The emotion itself. Name it without judgment.", category: "mindset", context: "Fear of a feeling often creates more suffering than the feeling itself. Women who fear feeling sad, angry, resentful, or detached postpartum often suppress those feelings, which intensifies them. Naming your emotional fear in advance is a form of preparation, not pessimism.", closingReframe: "Whatever you feel postpartum is valid. Loving your baby and struggling at the same time is not contradiction. It is motherhood.", personaTags: ["healing_mother", "anxious_planner"], seasons: ["grounding", "mixed"], trimester: 3, depth: "deep", format: "text", intensity: 3, estimatedEnergy: "high", relevanceTags: ["burnout_risk", "maternal_wound", "anxiety_concern"], requiredFlags: null, excludedFlags: null, addressesFear: null },
  { body: "What does surrender feel like in your body, not giving up, but releasing something you cannot control? Find one thing about this pregnancy to practice that with today.", category: "physical", context: "Surrender is a physical skill, not just a spiritual or philosophical one. The body holds control as tension, in the jaw, shoulders, belly. Practicing release in the body before birth prepares you for a process that requires exactly this. Labor cannot be controlled. It can be met.", closingReframe: "Your body already knows how to do this. Your job is to stop fighting it.", personaTags: ["faith_anchored", "anxious_planner"], seasons: ["expanding", "mixed"], trimester: 3, depth: "medium", format: "action", intensity: 2, estimatedEnergy: "medium", relevanceTags: ["anxiety_concern", "spiritual"], requiredFlags: null, excludedFlags: null, addressesFear: null },
  { body: "What is the version of yourself you are most afraid your child will see? Now, what would you say to that version of yourself right now?", category: "mindset", context: "The parts of ourselves we are most ashamed of are often the parts that need the most compassion, not hiding. Shame grows in silence. This reflection is an act of integration: bringing the parts we fear into the light so they stop having power over us.", closingReframe: "Your child does not need a perfect mother. They need a real one who keeps trying.", personaTags: [], seasons: ["expanding", "mixed"], trimester: 2, depth: "deep", format: "voice", intensity: 3, estimatedEnergy: "high", relevanceTags: ["identity_concern", "maternal_wound"], requiredFlags: null, excludedFlags: null, addressesFear: "imposter_fear" },
  { body: "How has becoming pregnant changed the way you see yourself as a woman, not as a mother, but as a woman?", category: "mindset", context: "Women often collapse their entire identity into the role of mother during pregnancy, and this collapse is one of the risk factors for postpartum identity crisis. You are a woman first. The mother is an expansion of her, not a replacement. Keeping that distinction is protective.", closingReframe: "You are a woman first. The mother is an expansion of her, not a replacement.", personaTags: [], seasons: ["expanding", "mixed"], trimester: 2, depth: "medium", format: "text", intensity: 2, estimatedEnergy: "medium", relevanceTags: ["identity_concern"], requiredFlags: null, excludedFlags: null, addressesFear: null },
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
          "Accept offers of help gracefully. People genuinely want to support you."
        ]
      },
      "quality-time": {
        title: "Quality Time",
        description: "You feel most supported when someone is fully present with you. Having someone sit beside you, listen without distraction, and simply be there fills your cup.",
        insights: [
          "Schedule regular one-on-one time with your partner, even just 15 minutes",
          "Ask a friend to sit with you during feeding times for company",
          "Quality over quantity. A focused 20 minutes beats a distracted hour."
        ]
      },
      "solo-processing": {
        title: "Solo Processing",
        description: "You recharge and process emotions best when given space. You need solitude to sort through your feelings before sharing them.",
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
          "Do not feel guilty about needing levity. Humor is a valid coping tool."
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
          { text: "A brief, warm visit. I appreciate them but get tired quickly.", value: "solo-processing" },
          { text: "They make me laugh and remind me of my pre-baby self", value: "humor-distraction" }
        ],
        orderNumber: 4
      },
      {
        questionText: "Which statement resonates most with you?",
        options: [
          { text: "Do not ask if I need help. Just do something helpful.", value: "acts-of-service" },
          { text: "The best gift is your undivided attention", value: "quality-time" },
          { text: "I need time alone to feel like myself again", value: "solo-processing" },
          { text: "If we're not laughing, we're not surviving", value: "humor-distraction" }
        ],
        orderNumber: 5
      },
      {
        questionText: "When you're anxious about something, you tend to:",
        options: [
          { text: "Channel it into action: organizing, cleaning, planning.", value: "acts-of-service" },
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
    description: "Assess your mental and emotional preparation for the postpartum period. This is about knowing where you stand and what to work on.",
    category: "mindset",
    questionCount: 8,
    estimatedMinutes: 5,
    resultTypes: {
      "well-prepared": {
        title: "Confidently Prepared",
        description: "You've done thoughtful preparation for the postpartum period. You have realistic expectations, a support system in place, and self-awareness about your emotional needs.",
        insights: [
          "Your preparation is a strength. Trust the work you've put in.",
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
          "You have more time than you think. Start small and build from there."
        ]
      },
      "needs-attention": {
        title: "Time to Focus",
        description: "Your postpartum preparation could benefit from more attention. This is simply information. Many people don't think about postpartum until it's upon them. You're already ahead by recognizing this now.",
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
          { text: "Comfortable. I know it's essential, not weakness.", value: "well-prepared", score: 4 },
          { text: "Working on it. I know I should but it's hard.", value: "mostly-ready", score: 3 },
          { text: "Uncomfortable but willing to try", value: "building-awareness", score: 2 },
          { text: "Very uncomfortable. I prefer to do things myself.", value: "needs-attention", score: 1 }
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
          { text: "I've made peace with it. Recovery takes time and that is okay.", value: "well-prepared", score: 4 },
          { text: "I'm trying to have realistic expectations", value: "mostly-ready", score: 3 },
          { text: "I'm a bit anxious about bouncing back", value: "building-awareness", score: 2 },
          { text: "I expect to get back to normal quickly", value: "needs-attention", score: 1 }
        ],
        orderNumber: 8
      }
    ]
  }
];

const scenarioData = [
  {
    title: "Asking Your Partner for Help",
    description: "Practice asking for specific support without feeling guilty. Many new mothers struggle with asking for help. This is a safe space to practice being direct about your needs.",
    category: "relationships",
    role: "Your partner",
    openingPrompt: "Hey babe, what's for dinner?",
    contextSetup: "Your partner just got home from work. You've been with the baby all day and you're exhausted. The house is messy, the baby has been fussy, and you haven't eaten since morning. You need help but feel guilty asking.",
    systemContext: "You are role-playing as the user's partner who just got home from work. You're tired too but generally loving and supportive. Respond naturally and realistically. If they communicate their needs clearly using 'I feel' statements, respond positively and supportively. If they are passive-aggressive or unclear, respond realistically: confused or slightly defensive but not hostile. Keep responses to 2-3 sentences. Never break character.",
    practicePoints: ["Expressing needs directly without guilt", "Using 'I feel' statements effectively", "Asking for specific, actionable help", "Setting the stage for ongoing support"],
  },
  {
    title: "Setting Boundaries with In-Laws",
    description: "Communicate your needs around visitors and unsolicited advice. Learn to be firm but kind when establishing boundaries with well-meaning family members.",
    category: "relationships",
    role: "Your mother-in-law",
    openingPrompt: "I was thinking I'd come stay for the first two weeks after the baby arrives! I've already started planning what I'll cook and how I'll set up the nursery.",
    contextSetup: "Your mother-in-law has just called, excited about the upcoming baby. She means well but tends to take over. You want her help but on your terms: perhaps a shorter visit, and definitely not rearranging your nursery.",
    systemContext: "You are role-playing as the user's mother-in-law. You are excited, well-meaning, and genuinely want to help. However, you tend to be a bit overbearing and assume you know best because you've 'been through it before.' If the user sets boundaries kindly and firmly, accept gracefully. If they're wishy-washy, push a little more. If they're harsh, act hurt. Keep responses to 2-3 sentences. Never break character.",
    practicePoints: ["Setting boundaries with love", "Acknowledging good intentions while redirecting", "Being specific about what help you want", "Maintaining your authority as the parent"],
  },
  {
    title: "Expressing Fears About Birth",
    description: "Practice articulating your worries to your care provider. It's normal to have fears. What matters is being able to voice them so you can get the support you need.",
    category: "mindset",
    role: "Your OB/midwife",
    openingPrompt: "So everything's looking great with your pregnancy! Any questions for me today?",
    contextSetup: "You're at a prenatal appointment. Your care provider has just finished the routine check and everything is fine. But you have fears about the birth that you haven't voiced yet, perhaps about pain, complications, or losing control.",
    systemContext: "You are role-playing as the user's OB/midwife. You are warm, professional, and experienced. Take their concerns seriously and validate their feelings. If they express fears clearly, offer reassurance and practical information. If they minimize their concerns, gently probe deeper. Keep responses to 2-3 sentences and be empathetic. Never break character.",
    practicePoints: ["Naming specific fears out loud", "Advocating for your preferences", "Asking clarifying questions", "Building trust with your care team"],
  },
  {
    title: "Discussing Parenting Differences",
    description: "Navigate disagreements about parenting approaches with your partner. Different backgrounds mean different assumptions. Practice finding common ground.",
    category: "relationships",
    role: "Your partner",
    openingPrompt: "So my mom was saying we should start sleep training right away. She did it with me and I turned out fine.",
    contextSetup: "You and your partner have different ideas about parenting, shaped by how you were each raised. They've just mentioned something their parent suggested that doesn't align with your approach. You need to express your perspective without dismissing theirs.",
    systemContext: "You are role-playing as the user's partner. You genuinely believe your parents did a good job raising you and tend to default to their advice. You genuinely don't realize there are other valid approaches. If the user explains their perspective calmly and finds compromise, be open to it. If they dismiss your family's approach, get defensive. Keep responses to 2-3 sentences. Never break character.",
    practicePoints: ["Validating your partner's perspective first", "Sharing research or feelings without lecturing", "Finding compromise on parenting decisions", "Establishing a 'same team' mentality"],
  },
  {
    title: "Asking for Alone Time",
    description: "Communicate your need for personal space postpartum. Taking time for yourself is essential for your mental health.",
    category: "mindset",
    role: "Your partner",
    openingPrompt: "Where are you going? The baby just fell asleep. I thought we'd watch something together.",
    contextSetup: "It's been a long week of constant caregiving. The baby finally fell asleep and you desperately need some time alone: to take a bath, read, or just sit in silence. Your partner wants to spend time together, which is sweet, but right now you need solitude.",
    systemContext: "You are role-playing as the user's partner. You miss spending quality time together since the baby arrived and are a little hurt when they want alone time instead. You genuinely miss your partner. If they explain their need kindly and suggest an alternative time for togetherness, be understanding. If they just brush you off, express feeling rejected. Keep responses to 2-3 sentences. Never break character.",
    practicePoints: ["Expressing needs without apologizing for them", "Differentiating between alone time and rejection", "Suggesting alternatives to maintain connection", "Normalizing self-care as part of good parenting"],
  },
  {
    title: "Talking to Your Employer About Leave",
    description: "Practice having the maternity leave conversation with your boss. Know your rights, communicate your timeline, and plan for a smooth transition.",
    category: "physical",
    role: "Your manager",
    openingPrompt: "You mentioned wanting to chat about something. What's on your mind?",
    contextSetup: "You've scheduled a meeting with your manager to discuss your maternity leave. You need to communicate your timeline, discuss coverage for your responsibilities, and advocate for what you need without feeling like you're being a burden.",
    systemContext: "You are role-playing as the user's manager. You are generally supportive but also concerned about how work will be covered during their absence. You want to be accommodating but may push back on longer leave durations or unclear timelines. If they present a clear plan, be receptive. If they seem uncertain, ask practical questions about coverage. Keep responses to 2-3 sentences. Be professional and fair. Never break character.",
    practicePoints: ["Presenting your leave timeline clearly", "Proposing a coverage plan proactively", "Advocating for your full leave entitlement", "Maintaining professionalism while being firm"],
  },
];

const closingReframesData = [
  { season: "tender", category: "self_compassion", originalThought: "I should be handling this better.", reframedThought: "You're handling something enormous. Being honest about how hard it is takes real courage.", tone: "gentle" },
  { season: "tender", category: "self_compassion", originalThought: "I'm not cut out for this.", reframedThought: "The fact that you care this much about being a good mother is already proof that you are one.", tone: "warm" },
  { season: "tender", category: "self_compassion", originalThought: "Everyone else seems to have it together.", reframedThought: "No one has it all together. You're seeing their highlight reel while living your behind-the-scenes.", tone: "honest" },
  { season: "tender", category: "validation", originalThought: "I feel so overwhelmed.", reframedThought: "What you're feeling is valid. Growing a human while navigating your own emotions is genuinely overwhelming.", tone: "affirming" },
  { season: "tender", category: "validation", originalThought: "I should be happier about this.", reframedThought: "There's no 'should' when it comes to feelings. Your experience is allowed to be complex and layered.", tone: "gentle" },
  { season: "tender", category: "validation", originalThought: "I'm being too sensitive.", reframedThought: "You are deeply attuned. That sensitivity will make you an incredibly connected mother.", tone: "affirming" },
  { season: "tender", category: "empowerment", originalThought: "I can't do this alone.", reframedThought: "You don't have to. And asking for help is one of the bravest things a mother can do.", tone: "warm" },
  { season: "tender", category: "growth_mindset", originalThought: "What if I make mistakes?", reframedThought: "You will make mistakes, and your child will learn resilience and grace from watching you navigate them.", tone: "honest" },

  { season: "grounding", category: "self_compassion", originalThought: "I need to figure everything out before baby arrives.", reframedThought: "You don't need all the answers. You just need to keep showing up, one day at a time.", tone: "steady" },
  { season: "grounding", category: "self_compassion", originalThought: "I'm falling behind on my preparations.", reframedThought: "There is no timeline for readiness. You're exactly where you need to be right now.", tone: "calm" },
  { season: "grounding", category: "validation", originalThought: "I worry about everything.", reframedThought: "That worry comes from love. Channel it into one small, meaningful action today.", tone: "grounding" },
  { season: "grounding", category: "validation", originalThought: "I don't feel ready.", reframedThought: "No parent ever feels fully ready. Readiness grows as you do. Trust the process.", tone: "steady" },
  { season: "grounding", category: "empowerment", originalThought: "There's so much I can't control.", reframedThought: "Focus on what you can influence. Your presence, your love, your intention. Those are in your hands.", tone: "empowering" },
  { season: "grounding", category: "empowerment", originalThought: "I need to be stronger.", reframedThought: "You are already stronger than you know. Strength is continuing despite the struggle.", tone: "empowering" },
  { season: "grounding", category: "growth_mindset", originalThought: "I don't know what I'm doing.", reframedThought: "Nobody does at first. The willingness to learn is what makes a great parent.", tone: "encouraging" },

  { season: "expanding", category: "self_compassion", originalThought: "I should slow down and not get too excited.", reframedThought: "Your excitement is beautiful. Let yourself dream big. You deserve to enjoy this.", tone: "joyful" },
  { season: "expanding", category: "validation", originalThought: "People think I'm naive for being so positive.", reframedThought: "Optimism is not naivety. It takes courage to approach motherhood with an open heart.", tone: "affirming" },
  { season: "expanding", category: "empowerment", originalThought: "I want to be the best mother.", reframedThought: "You don't need to be the best. You just need to be present. That is more than enough.", tone: "warm" },
  { season: "expanding", category: "empowerment", originalThought: "I have so many ideas for how to raise my child.", reframedThought: "Your vision matters. Hold onto it loosely and let it evolve as you and your child grow together.", tone: "empowering" },
  { season: "expanding", category: "growth_mindset", originalThought: "What if the reality doesn't match my expectations?", reframedThought: "Reality often surprises us in the best ways. Stay curious about the mother you're becoming.", tone: "encouraging" },
  { season: "expanding", category: "growth_mindset", originalThought: "I want to do things differently from my parents.", reframedThought: "That desire for change is itself a form of healing. You're already breaking the cycle.", tone: "affirming" },

  { season: "restorative", category: "self_compassion", originalThought: "I have no energy for anything.", reframedThought: "Rest is not laziness. Your body is doing extraordinary work, and it deserves to be honored.", tone: "gentle" },
  { season: "restorative", category: "self_compassion", originalThought: "I feel guilty for not doing more.", reframedThought: "You are doing enough. Growing a life is the most productive thing a body can do.", tone: "warm" },
  { season: "restorative", category: "validation", originalThought: "I just want to sleep all the time.", reframedThought: "Listen to that need. Your body is telling you exactly what it requires right now.", tone: "gentle" },
  { season: "restorative", category: "validation", originalThought: "I can't keep up with everyone else.", reframedThought: "This isn't a race. Your pace is your pace, and it's perfectly valid.", tone: "affirming" },
  { season: "restorative", category: "empowerment", originalThought: "I'm not accomplishing anything.", reframedThought: "You are literally creating a life. That is the most profound accomplishment there is.", tone: "empowering" },
  { season: "restorative", category: "growth_mindset", originalThought: "Will I ever feel like myself again?", reframedThought: "You are becoming a new version of yourself. Not losing who you were, but expanding into who you are meant to be.", tone: "hopeful" },

  { season: "mixed", category: "self_compassion", originalThought: "I don't know what I'm feeling.", reframedThought: "It's okay to feel many things at once. Complexity is not confusion. It is being fully human.", tone: "gentle" },
  { season: "mixed", category: "validation", originalThought: "My feelings change every day.", reframedThought: "Your heart is making room for the biggest transformation of your life.", tone: "affirming" },
  { season: "mixed", category: "empowerment", originalThought: "I feel pulled in different directions.", reframedThought: "You don't have to choose one feeling. You can hold space for all of them.", tone: "steady" },
  { season: "mixed", category: "growth_mindset", originalThought: "I'm not sure what kind of mother I'll be.", reframedThought: "You'll be exactly the mother your child needs. Trust that you're already becoming her.", tone: "hopeful" },
];

export async function seedDatabase() {
  const existingPrompts = await db.select().from(prompts);
  const hasSeasons = existingPrompts.length > 0 && (existingPrompts[0] as any).seasons;
  if (existingPrompts.length === 0 || !hasSeasons || existingPrompts.length < promptData.length) {
    console.log("Seeding prompts with personalization data...");
    if (existingPrompts.length > 0) {
      await db.delete(prompts);
    }
    await db.insert(prompts).values(promptData as any);
    console.log(`Seeded ${promptData.length} prompts`);
  }

  const existingReframes = await db.select().from(closingReframes);
  if (existingReframes.length === 0) {
    console.log("Seeding closing reframes...");
    await db.insert(closingReframes).values(closingReframesData);
    console.log(`Seeded ${closingReframesData.length} closing reframes`);
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

  const existingScenarios = await db.select().from(roleplayScenarios);
  if (existingScenarios.length === 0) {
    console.log("Seeding roleplay scenarios...");
    await db.insert(roleplayScenarios).values(scenarioData);
    console.log(`Seeded ${scenarioData.length} roleplay scenarios`);
  }

  await seedIntakeQuestions();
}
