import { randomUUID } from "@/lib/edge-crypto";
import { newBlankQuestion } from "@/lib/blitz/blank-question";
import {
  BLITZ_CORE_TYPES,
  type BlitzQuestion,
  type BlitzQuestionType,
} from "@/lib/blitz/types";

export type BlitzTemplateCategory =
  | "warm-up"
  | "review"
  | "vocabulary"
  | "math"
  | "science"
  | "check-in"
  | "fun"
  | "exit";

export const BLITZ_TEMPLATE_CATEGORIES: {
  id: BlitzTemplateCategory;
  label: string;
}[] = [
  { id: "warm-up", label: "Warm-up" },
  { id: "review", label: "Review" },
  { id: "vocabulary", label: "Vocabulary" },
  { id: "math", label: "Math facts" },
  { id: "science", label: "Science" },
  { id: "check-in", label: "Poll / check-in" },
  { id: "fun", label: "Fun Friday" },
  { id: "exit", label: "Exit ticket" },
];

export type BlitzTemplate = {
  id: string;
  title: string;
  description: string;
  blurb: string;
  category: BlitzTemplateCategory;
  /** Discover category to file the copy under. */
  discoverCategory: string;
  /** Cover art motif for the card. */
  motif: "bolt" | "star" | "hex" | "moon" | "spark" | "wave";
  questions: () => BlitzQuestion[];
};

/* ------------------------------------------------------------ builders */

function quiz(prompt: string, choices: string[], correct: number | number[], secs = 20) {
  const q = newBlankQuestion("quiz");
  const right = Array.isArray(correct) ? correct : [correct];
  q.prompt = prompt;
  q.timeLimitSec = secs;
  q.multiSelect = right.length > 1;
  q.choices = choices.map((text, i) => ({
    id: q.choices?.[i]?.id ?? randomUUID(),
    text,
    correct: right.includes(i),
  }));
  return q;
}

function tf(prompt: string, isTrue: boolean, secs = 15) {
  const q = newBlankQuestion("true_false");
  q.prompt = prompt;
  q.timeLimitSec = secs;
  q.choices = [
    { id: q.choices![0]!.id, text: "True", correct: isTrue },
    { id: q.choices![1]!.id, text: "False", correct: !isTrue },
  ];
  return q;
}

function typed(prompt: string, accepted: string[], secs = 30) {
  const q = newBlankQuestion("type_answer");
  q.prompt = prompt;
  q.timeLimitSec = secs;
  q.acceptedAnswers = accepted;
  return q;
}

function puzzle(prompt: string, inOrder: string[], secs = 40) {
  const q = newBlankQuestion("puzzle");
  q.prompt = prompt;
  q.timeLimitSec = secs;
  const ids = q.choices!.map((c) => c.id);
  q.choices = inOrder.map((text, i) => ({ id: ids[i] ?? randomUUID(), text }));
  q.correctOrder = q.choices.map((c) => c.id);
  // Shuffle display order so the right order isn't the default.
  q.choices = [q.choices[2]!, q.choices[0]!, q.choices[3]!, q.choices[1]!].filter(Boolean);
  return q;
}

function slider(prompt: string, min: number, max: number, answer: number, tol: number, secs = 25) {
  const q = newBlankQuestion("slider");
  q.prompt = prompt;
  q.timeLimitSec = secs;
  q.sliderMin = min;
  q.sliderMax = max;
  q.sliderCorrect = answer;
  q.sliderTolerance = tol;
  return q;
}

function poll(prompt: string, options: string[], secs = 20) {
  const q = newBlankQuestion("poll");
  q.prompt = prompt;
  q.timeLimitSec = secs;
  q.choices = options.map((text, i) => ({
    id: q.choices?.[i]?.id ?? randomUUID(),
    text,
  }));
  return q;
}

function open(type: "word_cloud" | "brainstorm" | "open_ended", prompt: string, secs = 40) {
  const q = newBlankQuestion(type);
  q.prompt = prompt;
  q.timeLimitSec = secs;
  return q;
}

function scale(prompt: string, minLabel: string, maxLabel: string, secs = 20) {
  const q = newBlankQuestion("scale");
  q.prompt = prompt;
  q.timeLimitSec = secs;
  q.scaleMinLabel = minLabel;
  q.scaleMaxLabel = maxLabel;
  return q;
}

function nps(prompt: string, secs = 20) {
  const q = newBlankQuestion("nps_scale");
  q.prompt = prompt;
  q.timeLimitSec = secs;
  return q;
}

/* ------------------------------------------------------------ templates */

/** Starter quizzes teachers can clone into the library. */
export const BLITZ_TEMPLATES: BlitzTemplate[] = [
  {
    id: "warm-up-tf",
    title: "Lightning warm-up",
    description: "Five quick true-or-false questions to start class.",
    blurb: "5 questions · About 2 min",
    category: "warm-up",
    discoverCategory: "icebreaker",
    motif: "bolt",
    questions: () => [
      tf("Octopuses have three hearts.", true),
      tf("The Great Wall of China is visible from the Moon with bare eyes.", false),
      tf("Honey can last for thousands of years without spoiling.", true),
      tf("Bats are blind.", false),
      tf("A group of flamingos is called a flamboyance.", true),
    ],
  },
  {
    id: "unit-review",
    title: "Unit review: Ancient Egypt",
    description: "Mixed review with ordering, typed answers, and a double-points final question.",
    blurb: "Quiz · Puzzle · Type answer",
    category: "review",
    discoverCategory: "history",
    motif: "hex",
    questions: () => {
      const finale = quiz(
        "Which of these did ancient Egyptians use? (Pick all that apply)",
        ["Papyrus", "Hieroglyphs", "Printing press", "Shadoofs"],
        [0, 1, 3],
        30,
      );
      finale.points = 2000;
      return [
        quiz("Which river made farming possible in ancient Egypt?", ["Tigris", "Nile", "Indus", "Yangtze"], 1),
        quiz("What were pharaohs’ tombs in the Valley of the Kings mostly cut into?", ["Rock cliffs", "Sand dunes", "Riverbanks", "Swamps"], 0),
        puzzle("Put these in order, earliest first.", ["Old Kingdom", "Middle Kingdom", "New Kingdom", "Roman rule"]),
        typed("What is the name for Egyptian picture-writing?", ["hieroglyphs", "hieroglyphics", "hieroglyph"]),
        finale,
      ];
    },
  },
  {
    id: "vocab-builder",
    title: "Vocabulary sprint",
    description: "Definitions, synonyms, and a spelling question.",
    blurb: "Quiz · Type answer · 6 questions",
    category: "vocabulary",
    discoverCategory: "ela",
    motif: "star",
    questions: () => [
      quiz("“Ephemeral” means…", ["Lasting a very short time", "Extremely loud", "Full of color", "Easy to break"], 0),
      quiz("Pick the best synonym for “meticulous”.", ["Careless", "Thorough", "Hungry", "Brave"], 1),
      quiz("Which word is an antonym of “scarce”?", ["Rare", "Plentiful", "Tiny", "Hidden"], 1),
      tf("“Benevolent” describes someone who is kind and generous.", true),
      typed("Spell the word that means “able to be seen through”: tr_ _ _ _ _ _ _ nt", ["transparent"]),
      quiz("“She was ___ about her chances, even after the loss.”", ["optimistic", "optimism", "optimize", "optimal"], 0),
    ],
  },
  {
    id: "math-facts",
    title: "Times-table blitz",
    description: "Quick multiplication questions, finishing with a slider estimate.",
    blurb: "Quiz · Type answer · Slider",
    category: "math",
    discoverCategory: "math",
    motif: "spark",
    questions: () => [
      quiz("7 × 8 = ?", ["54", "56", "64", "48"], 1, 10),
      quiz("9 × 6 = ?", ["54", "45", "56", "63"], 0, 10),
      quiz("12 × 4 = ?", ["36", "44", "48", "52"], 2, 10),
      typed("6 × 7 = ?", ["42", "forty-two", "forty two"], 15),
      tf("8 × 8 = 64", true, 10),
      slider("Estimate: 19 × 21 ≈ ?", 300, 500, 399, 10, 25),
    ],
  },
  {
    id: "cell-parts",
    title: "Inside the cell",
    description: "Organelles, their functions, and an ordering question.",
    blurb: "Quiz · Type answer · Puzzle",
    category: "science",
    discoverCategory: "science",
    motif: "hex",
    questions: () => [
      quiz("Which organelle releases energy from food?", ["Mitochondria", "Nucleus", "Ribosome", "Golgi body"], 0),
      quiz("Where is most of a cell’s DNA kept?", ["Mitochondria", "Nucleus", "Cell wall", "Vacuole"], 1),
      typed("Which organelle packages proteins for transport?", ["golgi", "golgi apparatus", "golgi body"]),
      tf("Animal cells have a cell wall.", false),
      puzzle("Order from smallest to largest.", ["Atom", "Molecule", "Organelle", "Cell"]),
    ],
  },
  {
    id: "check-in-poll",
    title: "How’s everyone doing?",
    description: "An unscored check-in on readiness, understanding, and how students feel.",
    blurb: "Poll · Scale · Word cloud",
    category: "check-in",
    discoverCategory: "check-in",
    motif: "moon",
    questions: () => [
      poll("How ready do you feel for today’s lesson?", ["Ready to go", "Mostly ready", "Need a review", "Feeling stuck"]),
      scale("How well did you understand yesterday’s homework?", "Not at all", "Completely"),
      open("word_cloud", "One word for how you’re feeling about this unit:", 30),
      nps("How likely are you to recommend this class to a friend?"),
    ],
  },
  {
    id: "fun-friday",
    title: "Fun Friday showdown",
    description: "Light trivia, a slider guess, a would-you-rather poll, and a brainstorm.",
    blurb: "Quiz · Slider · Poll · Brainstorm",
    category: "fun",
    discoverCategory: "icebreaker",
    motif: "star",
    questions: () => [
      quiz("Which animal can sleep standing up?", ["Horse", "Cat", "Snake", "Penguin"], 0),
      quiz("What color is a polar bear’s skin?", ["White", "Pink", "Black", "Grey"], 2),
      slider("How many keys are on a standard piano?", 40, 120, 88, 4),
      poll("Would you rather…", ["Fly", "Be invisible", "Talk to animals", "Time travel"]),
      open("brainstorm", "Suggest a name for our class mascot.", 45),
    ],
  },
  {
    id: "exit-ticket",
    title: "Exit ticket",
    description: "A three-minute wrap-up: one question, one reflection, and one rating.",
    blurb: "Quiz · Open-ended · Scale",
    category: "exit",
    discoverCategory: "check-in",
    motif: "moon",
    questions: () => [
      quiz("What was today’s main idea? (Edit to match your lesson)", ["Main idea A", "Main idea B", "Main idea C", "Main idea D"], 0, 30),
      open("open_ended", "What’s one thing you’re still wondering about?", 60),
      scale("How confident do you feel about today’s topic?", "Lost", "I could teach it"),
    ],
  },
  {
    id: "geo-explorer",
    title: "Map explorer",
    description: "Continents, capitals, and pin questions. Add your own map image.",
    blurb: "Quiz · Pin answer · Drop pin",
    category: "review",
    discoverCategory: "general",
    motif: "wave",
    questions: () => {
      const pinQ = newBlankQuestion("pin_answer");
      pinQ.prompt = "Tap where the equator crosses this map. (Add a world map image URL in the editor.)";
      pinQ.pinX = 0.5;
      pinQ.pinY = 0.52;
      pinQ.pinRadius = 0.08;
      const drop = newBlankQuestion("drop_pin");
      drop.prompt = "Drop a pin where you would most like to visit.";
      return [
        quiz("Which is the largest continent by area?", ["Africa", "Asia", "North America", "Europe"], 1),
        quiz("What is the capital of Canada?", ["Toronto", "Vancouver", "Ottawa", "Montreal"], 2),
        tf("The Pacific is the largest ocean.", true),
        pinQ,
        drop,
      ];
    },
  },
];

export function templateNeedsPlus(t: BlitzTemplate): boolean {
  const types = new Set<BlitzQuestionType>(t.questions().map((q) => q.type));
  return [...types].some((type) => !BLITZ_CORE_TYPES.includes(type));
}
