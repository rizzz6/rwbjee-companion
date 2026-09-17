import { getCategory, normalizeAnswer, gradeQuestion, calculateSubjectScore } from '../../src/utils/marks/scoring'

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
  console.log(`✅ Passed: ${message}`)
}

function runTests() {
  console.log('🧪 Starting Marks Calculator Scoring Logic Unit Tests...\n')

  // 1. Category checks
  assert(getCategory('Mathematics', 1) === 1, 'Math Q1 is Category 1')
  assert(getCategory('Mathematics', 50) === 1, 'Math Q50 is Category 1')
  assert(getCategory('Mathematics', 51) === 2, 'Math Q51 is Category 2')
  assert(getCategory('Mathematics', 65) === 2, 'Math Q65 is Category 2')
  assert(getCategory('Mathematics', 66) === 3, 'Math Q66 is Category 3')
  assert(getCategory('Mathematics', 75) === 3, 'Math Q75 is Category 3')

  assert(getCategory('Physics/Chemistry', 1) === 1, 'Phy/Chem Q1 is Category 1')
  assert(getCategory('Physics/Chemistry', 30) === 1, 'Phy/Chem Q30 is Category 1')
  assert(getCategory('Physics/Chemistry', 31) === 2, 'Phy/Chem Q31 is Category 2')
  assert(getCategory('Physics/Chemistry', 35) === 2, 'Phy/Chem Q35 is Category 2')
  assert(getCategory('Physics/Chemistry', 36) === 3, 'Phy/Chem Q36 is Category 3')
  assert(getCategory('Physics/Chemistry', 40) === 3, 'Phy/Chem Q40 is Category 3')
  assert(getCategory('Physics/Chemistry', 41) === 1, 'Phy/Chem Q41 is Category 1')
  assert(getCategory('Physics/Chemistry', 70) === 1, 'Phy/Chem Q70 is Category 1')
  assert(getCategory('Physics/Chemistry', 71) === 2, 'Phy/Chem Q71 is Category 2')
  assert(getCategory('Physics/Chemistry', 75) === 2, 'Phy/Chem Q75 is Category 2')
  assert(getCategory('Physics/Chemistry', 76) === 3, 'Phy/Chem Q76 is Category 3')
  assert(getCategory('Physics/Chemistry', 80) === 3, 'Phy/Chem Q80 is Category 3')

  // 2. Normalization checks
  assert(JSON.stringify(normalizeAnswer('A')) === '["A"]', 'Single letter normalized')
  assert(JSON.stringify(normalizeAnswer('A,B')) === '["A","B"]', 'Comma list normalized')
  assert(JSON.stringify(normalizeAnswer(['a', 'b '])) === '["A","B"]', 'Array normalized')
  assert(JSON.stringify(normalizeAnswer('-')) === '[]', 'Unattempted normalized')
  assert(JSON.stringify(normalizeAnswer('')) === '[]', 'Empty normalized')

  // 3. Grading - Category 1 (+1, -0.25)
  assert(gradeQuestion(1, 'A', 'A', 1).marks === 1, 'Cat 1 Correct gets 1 mark')
  assert(gradeQuestion(1, 'A', 'A', 1).status === 'correct', 'Cat 1 Correct status is correct')
  assert(gradeQuestion(1, 'B', 'A', 1).marks === -0.25, 'Cat 1 Incorrect gets -0.25')
  assert(gradeQuestion(1, 'B', 'A', 1).status === 'incorrect', 'Cat 1 Incorrect status is incorrect')
  assert(gradeQuestion(1, '-', 'A', 1).marks === 0, 'Cat 1 Unattempted gets 0')
  assert(gradeQuestion(1, '-', 'A', 1).status === 'unattempted', 'Cat 1 Unattempted status is unattempted')

  // 4. Grading - Category 2 (+2, -0.5)
  assert(gradeQuestion(51, 'C', 'C', 2).marks === 2, 'Cat 2 Correct gets 2 marks')
  assert(gradeQuestion(51, 'D', 'C', 2).marks === -0.5, 'Cat 2 Incorrect gets -0.5')

  // 5. Grading - Category 3 (+2 max, multiple select, partial select)
  // Scenario A: Correct is ['B', 'C', 'D'] (3 options)
  assert(gradeQuestion(66, ['B', 'C', 'D'], ['B', 'C', 'D'], 3).marks === 2, 'Cat 3 Full Correct gets 2')
  assert(gradeQuestion(66, ['B', 'C', 'D'], ['B', 'C', 'D'], 3).status === 'correct', 'Cat 3 Full Correct status')
  
  // Scenario B: Partial subset correct ['B', 'C'] -> 2 * (2/3) = 1.3333
  assert(gradeQuestion(66, ['B', 'C'], ['B', 'C', 'D'], 3).marks === 1.3333, 'Cat 3 Partial Subset Correct gets 1.3333')
  assert(gradeQuestion(66, ['B', 'C'], ['B', 'C', 'D'], 3).status === 'partial', 'Cat 3 Partial status')

  // Scenario C: Partial correct subset but includes an incorrect option ['B', 'C', 'A'] -> 0
  assert(gradeQuestion(66, ['B', 'C', 'A'], ['B', 'C', 'D'], 3).marks === 0, 'Cat 3 Partial + Incorrect gets 0')
  assert(gradeQuestion(66, ['B', 'C', 'A'], ['B', 'C', 'D'], 3).status === 'incorrect', 'Cat 3 Partial + Incorrect status is incorrect')

  // Scenario D: Unattempted -> 0
  assert(gradeQuestion(66, '-', ['B', 'C', 'D'], 3).marks === 0, 'Cat 3 Unattempted gets 0')
  assert(gradeQuestion(66, '-', ['B', 'C', 'D'], 3).status === 'unattempted', 'Cat 3 Unattempted status')

  // 6. Complete Subject Score
  const mockResponses = new Array(75).fill('A') // Candidate marked 'A' for all
  const mockAnswerKey = new Array(75).fill('A') // Answer key is 'A' for all (except Cat 3 where correct is ['A', 'B'])
  mockAnswerKey[74] = ['A', 'B'] // Q75 has correct keys 'A','B'
  mockResponses[74] = ['A']     // Candidate marked partial 'A'

  const mathResults = calculateSubjectScore('Mathematics', mockResponses, mockAnswerKey)
  console.log('\nSubject calculations output summary:')
  console.log(` - Total Score: ${mathResults.totalMarks}`)
  console.log(` - Correct count: ${mathResults.correctCount}`)
  console.log(` - Incorrect count: ${mathResults.incorrectCount}`)
  console.log(` - Partial count: ${mathResults.partialCount}`)
  
  // 50 correct Cat 1 Qs (50 * 1 = 50)
  // 15 correct Cat 2 Qs (15 * 2 = 30)
  // 9 correct Cat 3 Qs (9 * 2 = 18)
  // 1 partial correct Cat 3 Qs (1 * 2 * (1/2) = 1)
  // Expected total: 50 + 30 + 18 + 1 = 99
  // 7. Dropped Questions / Bonus Questions
  assert(gradeQuestion(10, 'C', '-', 1).marks === 1, 'Cat 1 Dropped with user answer C gets 1 full mark')
  assert(gradeQuestion(10, '-', '-', 1).marks === 1, 'Cat 1 Dropped unattempted gets 1 full mark')
  assert(gradeQuestion(55, 'A', 'DROP', 2).marks === 2, 'Cat 2 Dropped marker DROP gets 2 full marks')
  assert(gradeQuestion(70, 'A', 'BONUS', 3).marks === 2, 'Cat 3 Bonus marker gets 2 full marks')

  // 8. Dual / Multiple Accepted Keys in Category 1 & 2
  assert(gradeQuestion(15, 'A', ['A', 'B'], 1).marks === 1, 'Cat 1 Dual Key: option A is correct')
  assert(gradeQuestion(15, 'B', ['A', 'B'], 1).marks === 1, 'Cat 1 Dual Key: option B is correct')
  assert(gradeQuestion(15, 'C', ['A', 'B'], 1).marks === -0.25, 'Cat 1 Dual Key: wrong option C gets -0.25')
  assert(gradeQuestion(55, 'B', ['B', 'D'], 2).marks === 2, 'Cat 2 Dual Key: option B is correct (+2)')
  assert(gradeQuestion(55, 'D', ['B', 'D'], 2).marks === 2, 'Cat 2 Dual Key: option D is correct (+2)')
  assert(gradeQuestion(55, 'A', ['B', 'D'], 2).marks === -0.5, 'Cat 2 Dual Key: wrong option A gets -0.5')

  console.log('\n🎉 All core scoring logic unit tests passed successfully!\n')
}

try {
  runTests()
} catch (e: unknown) {
  const message = e instanceof Error ? e.message : String(e)
  console.error(message)
  process.exit(1)
}
