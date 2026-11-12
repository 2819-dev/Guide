import { randomUUID } from "@/lib/edge-crypto";
import type { TestQuizQuestion } from "@/lib/testquiz/types";

export function newBlankQuestion(
  type: TestQuizQuestion["type"] = "quiz",
): TestQuizQuestion {
  const id = randomUUID();
  const base: TestQuizQuestion = {
    id,
    type,
    prompt: "",
    timeLimitSec: type === "type_answer" || type === "puzzle" ? 30 : 20,
    points: 1000,
  };

  switch (type) {
    case "true_false":
      return {
        ...base,
        choices: [
          { id: randomUUID(), text: "True", correct: true },
          { id: randomUUID(), text: "False", correct: false },
        ],
      };
    case "quiz":
    case "poll":
      return {
        ...base,
        multiSelect: false,
        points: type === "poll" ? 0 : 1000,
        choices: [
          { id: randomUUID(), text: "", correct: type === "quiz" },
          { id: randomUUID(), text: "", correct: false },
          { id: randomUUID(), text: "", correct: false },
          { id: randomUUID(), text: "", correct: false },
        ],
      };
    case "type_answer":
      return { ...base, acceptedAnswers: [""] };
    case "puzzle": {
      const a = randomUUID();
      const b = randomUUID();
      const c = randomUUID();
      const d = randomUUID();
      return {
        ...base,
        choices: [
          { id: a, text: "" },
          { id: b, text: "" },
          { id: c, text: "" },
          { id: d, text: "" },
        ],
        correctOrder: [a, b, c, d],
      };
    }
    case "slider":
      return {
        ...base,
        sliderMin: 0,
        sliderMax: 100,
        sliderStep: 1,
        sliderCorrect: 50,
        sliderTolerance: 5,
      };
    case "scale":
      return {
        ...base,
        points: 0,
        sliderMin: 1,
        sliderMax: 5,
        sliderStep: 1,
        scaleMinLabel: "Strongly disagree",
        scaleMaxLabel: "Strongly agree",
      };
    case "nps_scale":
      return {
        ...base,
        points: 0,
        sliderMin: 0,
        sliderMax: 10,
        sliderStep: 1,
        scaleMinLabel: "Not at all likely",
        scaleMaxLabel: "Extremely likely",
      };
    case "pin_answer":
    case "drop_pin":
      return {
        ...base,
        points: type === "drop_pin" ? 0 : 1000,
        mediaUrl: "",
        pinX: 0.5,
        pinY: 0.5,
        pinRadius: 0.08,
      };
    case "word_cloud":
    case "brainstorm":
    case "open_ended":
      return { ...base, points: 0 };
    default:
      return base;
  }
}
