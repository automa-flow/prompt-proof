import { useState } from 'react';
import type { Answer, Question } from '../types';
import { ChevronLeft } from 'lucide-react';

interface QuestionBlockProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  /** Pre-existing answer for this question (when navigating back). */
  existingAnswer?: Answer;
  onAnswer: (answer: Answer) => void;
  onBack: () => void;
}

/**
 * Step 2 — display one question at a time and collect the user's answer.
 * Responsibility: render the appropriate answer widget (scale / yes_no /
 * multiple_choice) based on question.answerType; emit an Answer when the user
 * confirms their choice. No scoring logic here.
 *
 * Note: the parent must supply a `key={question.id}` so that state resets
 * correctly when the active question changes (e.g. back-navigation).
 */
export function QuestionBlock({
  question,
  questionIndex,
  totalQuestions,
  existingAnswer,
  onAnswer,
  onBack,
}: QuestionBlockProps) {
  const [scaleValue, setScaleValue] = useState<number>(
    question.answerType === 'scale' &&
    typeof existingAnswer?.value === 'number'
      ? existingAnswer.value
      : 5,
  );
  const [selectedChoice, setSelectedChoice] = useState<string>(
    question.answerType === 'multiple_choice' &&
    typeof existingAnswer?.value === 'string'
      ? existingAnswer.value
      : '',
  );

  const progress = ((questionIndex + 1) / totalQuestions) * 100;

  const handleSubmit = (value: Answer['value']) => {
    onAnswer({ questionId: question.id, value });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="btn-ghost"
          aria-label="Go back"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Question {questionIndex + 1} of {totalQuestions}</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question text */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-semibold text-gray-50 leading-snug">
          {question.text}
        </h2>
        {question.description && (
          <p className="text-sm text-gray-400">{question.description}</p>
        )}
      </div>

      {/* Answer widgets */}
      {question.answerType === 'scale' && (
        <div className="flex flex-col gap-3">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Not at all</span>
            <span>Absolutely</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={scaleValue}
            onChange={(e) => setScaleValue(Number(e.target.value))}
            className="w-full accent-indigo-600"
            aria-label={`Scale answer: ${scaleValue} out of 10`}
          />
          <div className="text-center text-2xl font-bold text-indigo-400">
            {scaleValue}
            <span className="text-sm font-normal text-gray-500"> / 10</span>
          </div>
          <button
            type="button"
            onClick={() => handleSubmit(scaleValue)}
            className="btn-primary mt-2 self-end"
          >
            Next &#x2192;
          </button>
        </div>
      )}

      {question.answerType === 'yes_no' && (
        <div className="flex gap-4">
          {([true, false] as const).map((val) => (
            <button
              key={String(val)}
              type="button"
              onClick={() => handleSubmit(val)}
              className="choice-yn"
            >
              {val ? 'Yes' : 'No'}
            </button>
          ))}
        </div>
      )}

      {question.answerType === 'multiple_choice' && (
        <div className="flex flex-col gap-3">
          {(question.options ?? []).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelectedChoice(opt.value)}
              className={`choice-option ${
                           selectedChoice === opt.value ? 'choice-option-active' : ''
                         }`}
            >
              {opt.label}
            </button>
          ))}
          <button
            type="button"
            disabled={!selectedChoice}
            onClick={() => handleSubmit(selectedChoice)}
            className="btn-primary mt-2 self-end"
          >
            Next &#x2192;
          </button>
        </div>
      )}
    </div>
  );
}
