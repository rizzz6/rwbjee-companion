export interface QuestionResult {
  q: number;
  user: string;
  correct: string;
  marks: number;
  status: 'correct' | 'incorrect' | 'partial' | 'unattempted';
  category: 1 | 2 | 3;
}

export interface SubjectResult {
  totalMarks: number;
  correctCount: number;
  incorrectCount: number;
  partialCount: number;
  unattemptedCount: number;
  questionsChecked: number;
  details: QuestionResult[];
}

export interface CalculatorResult {
  totalScore: number;
  examType: string;
  mathSet?: string;
  phyChemSet?: string;
  Mathematics?: SubjectResult;
  'Physics/Chemistry'?: SubjectResult;
}

// Helper to determine the category of a question based on subject and 1-based index
export function getCategory(subject: 'Mathematics' | 'Physics/Chemistry', qNum: number): 1 | 2 | 3 {
  if (subject === 'Mathematics') {
    if (qNum >= 1 && qNum <= 50) return 1;
    if (qNum >= 51 && qNum <= 65) return 2;
    return 3;
  } else {
    // Physics/Chemistry: Physics (1-40), Chemistry (41-80)
    // Physics categories: 1-30 (Cat 1), 31-35 (Cat 2), 36-40 (Cat 3)
    // Chemistry categories: 41-70 (Cat 1), 71-75 (Cat 2), 76-80 (Cat 3)
    if ((qNum >= 1 && qNum <= 30) || (qNum >= 41 && qNum <= 70)) return 1;
    if ((qNum >= 31 && qNum <= 35) || (qNum >= 71 && qNum <= 75)) return 2;
    return 3;
  }
}

// Standard normalization for option comparing
export function normalizeAnswer(ans: string | string[]): string[] {
  if (!ans) return [];
  if (Array.isArray(ans)) {
    return ans.map(a => a.trim().toUpperCase()).filter(Boolean);
  }
  if (ans === '-' || ans.trim() === '') return [];
  return ans.split(',').map(a => a.trim().toUpperCase()).filter(Boolean);
}

// Check if question was dropped/cancelled by exam board
export function isDroppedQuestion(correctAnsRaw: string | string[]): boolean {
  if (!correctAnsRaw) return false;
  if (Array.isArray(correctAnsRaw)) {
    return correctAnsRaw.some(ans => ['-', 'DROP', 'BONUS'].includes(ans.trim().toUpperCase()));
  }
  const str = correctAnsRaw.trim().toUpperCase();
  return ['-', 'DROP', 'BONUS'].includes(str);
}

// Grade a single question response
export function gradeQuestion(
  qNum: number,
  userAnsRaw: string | string[],
  correctAnsRaw: string | string[],
  category: 1 | 2 | 3
): { marks: number; status: QuestionResult['status'] } {
  // If question was dropped or bonus by official WBJEE key, award full marks
  if (isDroppedQuestion(correctAnsRaw)) {
    const fullMarks = category === 1 ? 1 : 2;
    return { marks: fullMarks, status: 'correct' };
  }

  const userAnswers = normalizeAnswer(userAnsRaw);
  const correctAnswers = normalizeAnswer(correctAnsRaw);

  const userAnsStr = userAnswers.length > 0 ? userAnswers.sort().join(',') : '-';

  if (userAnswers.length === 0 || userAnsStr === '-') {
    return { marks: 0, status: 'unattempted' };
  }

  if (category === 3) {
    // Category 3 (Multiple Select)
    // Any incorrect choice leads to 0 marks.
    const hasIncorrect = userAnswers.some(ans => !correctAnswers.includes(ans));
    if (hasIncorrect) {
      return { marks: 0, status: 'incorrect' };
    }

    // All choices are correct
    if (userAnswers.length === correctAnswers.length) {
      return { marks: 2, status: 'correct' };
    }

    // Partial correct choices (subset of correct options)
    const marks = correctAnswers.length > 0 ? 2 * (userAnswers.length / correctAnswers.length) : 0;
    return { marks: Number(marks.toFixed(4)), status: 'partial' };
  } else {
    // Category 1 & 2 (Single Select)
    // Supports official multi-key rulings (e.g. both A and B accepted)
    const isCorrect = userAnswers.length === 1 && correctAnswers.includes(userAnswers[0]);
    if (isCorrect) {
      const marks = category === 1 ? 1 : 2;
      return { marks, status: 'correct' };
    } else {
      const marks = category === 1 ? -0.25 : -0.5;
      return { marks, status: 'incorrect' };
    }
  }
}

// Calculate the final score for a subject
export function calculateSubjectScore(
  subject: 'Mathematics' | 'Physics/Chemistry',
  responses: (string | string[])[],
  answerKey: (string | string[])[]
): SubjectResult {
  const totalQuestions = subject === 'Mathematics' ? 75 : 80;
  const details: QuestionResult[] = [];

  let totalMarks = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let partialCount = 0;
  let unattemptedCount = 0;

  for (let i = 0; i < totalQuestions; i++) {
    const qNum = i + 1;
    const userAns = responses[i] || '-';
    const correctAns = answerKey[i] || '-';
    const category = getCategory(subject, qNum);

    const { marks, status } = gradeQuestion(qNum, userAns, correctAns, category);

    totalMarks += marks;
    if (status === 'correct') correctCount++;
    else if (status === 'incorrect') incorrectCount++;
    else if (status === 'partial') partialCount++;
    else if (status === 'unattempted') unattemptedCount++;

    const userAnsStr = Array.isArray(userAns) ? userAns.sort().join(',') : userAns;
    const correctAnsStr = Array.isArray(correctAns) ? correctAns.sort().join(',') : correctAns;

    details.push({
      q: qNum,
      user: userAnsStr,
      correct: correctAnsStr,
      marks,
      status,
      category,
    });
  }

  // Ensure totalMarks is formatted to 2 decimal places to handle partial float values nicely
  totalMarks = Number(totalMarks.toFixed(2));

  return {
    totalMarks,
    correctCount,
    incorrectCount,
    partialCount,
    unattemptedCount,
    questionsChecked: totalQuestions,
    details,
  };
}
