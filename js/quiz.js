export function shuffleOptions(question, random = Math.random) {
  const options = (question.options || []).map((label, index) => ({ label, index }));
  if (question.shuffle === false) return options;
  for (let index = options.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [options[index], options[target]] = [options[target], options[index]];
  }
  return options;
}

export function normalizeShortAnswer(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('id');
}

export function isAnswerCorrect(question, response) {
  if (question.type === 'pilihan-ganda') return Number(response) === question.answer;
  if (question.type === 'pilihan-ganda-banyak') {
    if (!Array.isArray(response) || !Array.isArray(question.answer)) return false;
    const actual = [...new Set(response.map(Number))].sort((a, b) => a - b);
    const expected = [...new Set(question.answer)].sort((a, b) => a - b);
    return actual.length === expected.length && actual.every((value, index) => value === expected[index]);
  }
  if (question.type === 'benar-salah') return response === question.answer || String(response) === String(question.answer);
  if (question.type === 'isian') {
    const accepted = Array.isArray(question.answer) ? question.answer : [question.answer];
    return accepted.some(answer => normalizeShortAnswer(answer) === normalizeShortAnswer(response));
  }
  return false;
}

export function evaluateQuiz(questions, responses) {
  const results = questions.map(question => ({
    question,
    response: responses[question.id],
    correct: isAnswerCorrect(question, responses[question.id])
  }));
  const correct = results.filter(result => result.correct).length;
  return { results, correct, total: questions.length, score: questions.length ? correct / questions.length : 0 };
}

export function formatAnswer(question, response) {
  if (response === undefined || response === null || response === '') return 'Belum dijawab';
  if (question.type === 'pilihan-ganda' || question.type === 'pilihan-ganda-banyak') {
    const indexes = Array.isArray(response) ? response : [Number(response)];
    return indexes.map(index => question.options?.[index] ?? 'Jawaban tidak dikenal').join('; ');
  }
  if (question.type === 'benar-salah') return String(response) === 'true' ? 'Benar' : 'Salah';
  if (question.type === 'isian' && Array.isArray(response)) return response.join(' / ');
  return String(response);
}
