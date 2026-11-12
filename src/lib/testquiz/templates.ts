import { newBlankQuestion } from "@/lib/testquiz/blank-question";
import type { TestQuizQuestion } from "@/lib/testquiz/types";

export type TestQuizTemplate = {
  id: string;
  title: string;
  description: string;
  blurb: string;
  questions: () => TestQuizQuestion[];
};

/** Starter quizzes teachers can clone into the library. */
export const TESTQUIZ_TEMPLATES: TestQuizTemplate[] = [
  {
    id: "warm-up-tf",
    title: "Warm-up: True or False",
    description: "Quick five-question opener for any class.",
    blurb: "5 true/false · ~3 min",
    questions: () => {
      const prompts = [
        "Students learn better when they can move around briefly between tasks.",
        "Cold-calling without wait time always improves participation.",
        "Exit tickets help teachers spot who needs a re-teach.",
        "Group work works best with clear roles for each student.",
        "Feedback is most useful when it is specific and timely.",
      ];
      return prompts.map((prompt, i) => {
        const q = newBlankQuestion("true_false");
        q.prompt = prompt;
        q.timeLimitSec = 15;
        q.choices = [
          { id: q.choices![0]!.id, text: "True", correct: i !== 1 },
          { id: q.choices![1]!.id, text: "False", correct: i === 1 },
        ];
        return q;
      });
    },
  },
  {
    id: "cell-parts",
    title: "Cell parts review",
    description: "Classic science quiz with mixed question types.",
    blurb: "Quiz + type answer · science",
    questions: () => {
      const q1 = newBlankQuestion("quiz");
      q1.prompt = "Which organelle is known as the powerhouse of the cell?";
      q1.choices = [
        { id: q1.choices![0]!.id, text: "Mitochondria", correct: true },
        { id: q1.choices![1]!.id, text: "Nucleus", correct: false },
        { id: q1.choices![2]!.id, text: "Ribosome", correct: false },
        { id: q1.choices![3]!.id, text: "Golgi", correct: false },
      ];
      const q2 = newBlankQuestion("quiz");
      q2.prompt = "Where is genetic material stored?";
      q2.choices = [
        { id: q2.choices![0]!.id, text: "Mitochondria", correct: false },
        { id: q2.choices![1]!.id, text: "Nucleus", correct: true },
        { id: q2.choices![2]!.id, text: "Cell wall", correct: false },
        { id: q2.choices![3]!.id, text: "Vacuole", correct: false },
      ];
      const q3 = newBlankQuestion("type_answer");
      q3.prompt = "Name the organelle that packages proteins for transport.";
      q3.acceptedAnswers = ["Golgi", "Golgi apparatus", "Golgi body"];
      q3.timeLimitSec = 25;
      const q4 = newBlankQuestion("true_false");
      q4.prompt = "Plant cells have a cell wall.";
      q4.choices = [
        { id: q4.choices![0]!.id, text: "True", correct: true },
        { id: q4.choices![1]!.id, text: "False", correct: false },
      ];
      return [q1, q2, q3, q4];
    },
  },
  {
    id: "check-in-poll",
    title: "Class check-in",
    description: "Opinion poll + scale — no wrong answers.",
    blurb: "Poll + scale · ungraded",
    questions: () => {
      const poll = newBlankQuestion("poll");
      poll.prompt = "How ready do you feel for today’s lesson?";
      poll.choices = [
        { id: poll.choices![0]!.id, text: "Ready to go" },
        { id: poll.choices![1]!.id, text: "Mostly ready" },
        { id: poll.choices![2]!.id, text: "Need a review" },
        { id: poll.choices![3]!.id, text: "Feeling stuck" },
      ];
      const scale = newBlankQuestion("scale");
      scale.prompt = "How well did you understand yesterday’s homework?";
      scale.scaleMinLabel = "Not at all";
      scale.scaleMaxLabel = "Completely";
      const cloud = newBlankQuestion("word_cloud");
      cloud.prompt = "One word for how you’re feeling about this unit:";
      cloud.timeLimitSec = 30;
      return [poll, scale, cloud];
    },
  },
];
