import { useQuiz } from './hooks/useQuiz';
import { IdeaInput } from './components/IdeaInput';
import { QuestionBlock } from './components/QuestionBlock';
import { ResultScreen } from './components/ResultScreen';

/**
 * Root application component.
 * Responsibility: orchestrate the three-stage quiz flow (idea → questions →
 * result) using the useQuiz hook. Delegates all rendering to child components.
 */
export default function App() {
  const { idea, step, questions, answers, submitIdea, answerQuestion, goBack, restart } =
    useQuiz();

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-12 px-4">
      <main className="w-full max-w-xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {step.stage === 'idea' && <IdeaInput onSubmit={submitIdea} />}

        {step.stage === 'questions' && (
          <QuestionBlock
            key={questions[step.questionIndex].id}
            question={questions[step.questionIndex]}
            questionIndex={step.questionIndex}
            totalQuestions={questions.length}
            existingAnswer={answers.find(
              (a) => a.questionId === questions[step.questionIndex].id,
            )}
            onAnswer={answerQuestion}
            onBack={goBack}
          />
        )}

        {step.stage === 'result' && (
          <ResultScreen
            idea={idea}
            result={step.result}
            onRestart={restart}
          />
        )}
      </main>
    </div>
  );
}
