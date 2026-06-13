import { useState } from 'react';
import type { Answer, Question } from '../types';
import { QUESTIONS } from '../config/questions';
import { calculateScore } from '../logic/scoring';
import type { ScoreResult } from '../types';

// ---------------------------------------------------------------------------
// Quiz state machine
// ---------------------------------------------------------------------------

export type QuizStep =
  | { stage: 'idea' }
  | { stage: 'questions'; questionIndex: number }
  | { stage: 'result'; result: ScoreResult };

interface UseQuizReturn {
  /** Current idea text entered by the user. */
  idea: string;
  /** Current step in the quiz flow. */
  step: QuizStep;
  /** Ordered question list (from config). */
  questions: Question[];
  /** Answers collected so far. */
  answers: Answer[];
  /** Called when the user submits their idea and moves to questions. */
  submitIdea: (text: string) => void;
  /** Record an answer and advance to the next question (or result screen). */
  answerQuestion: (answer: Answer) => void;
  /** Go back one question (or back to idea input from question 0). */
  goBack: () => void;
  /** Reset everything to the initial state. */
  restart: () => void;
}

export function useQuiz(): UseQuizReturn {
  const [idea, setIdea] = useState('');
  const [step, setStep] = useState<QuizStep>({ stage: 'idea' });
  const [answers, setAnswers] = useState<Answer[]>([]);

  const questions = QUESTIONS;

  const submitIdea = (text: string) => {
    setIdea(text.trim());
    setAnswers([]);
    setStep({ stage: 'questions', questionIndex: 0 });
  };

  const answerQuestion = (answer: Answer) => {
    const updated = [
      ...answers.filter((a) => a.questionId !== answer.questionId),
      answer,
    ];
    setAnswers(updated);

    if (step.stage !== 'questions') return;

    const nextIndex = step.questionIndex + 1;
    if (nextIndex < questions.length) {
      setStep({ stage: 'questions', questionIndex: nextIndex });
    } else {
      const result = calculateScore(updated, questions);
      setStep({ stage: 'result', result });
    }
  };

  const goBack = () => {
    if (step.stage === 'questions') {
      if (step.questionIndex === 0) {
        setStep({ stage: 'idea' });
      } else {
        setStep({ stage: 'questions', questionIndex: step.questionIndex - 1 });
      }
    } else if (step.stage === 'result') {
      setStep({ stage: 'questions', questionIndex: questions.length - 1 });
    }
  };

  const restart = () => {
    setIdea('');
    setAnswers([]);
    setStep({ stage: 'idea' });
  };

  return { idea, step, questions, answers, submitIdea, answerQuestion, goBack, restart };
}
