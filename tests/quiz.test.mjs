import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateQuiz, isAnswerCorrect, normalizeShortAnswer, shuffleOptions } from '../js/quiz.js';

test('menilai semua tipe jawaban kuis', () => {
  assert.equal(isAnswerCorrect({ type: 'pilihan-ganda', answer: 2 }, 2), true);
  assert.equal(isAnswerCorrect({ type: 'benar-salah', answer: false }, 'false'), true);
  assert.equal(isAnswerCorrect({ type: 'pilihan-ganda-banyak', answer: [0, 2] }, [2, 0]), true);
  assert.equal(isAnswerCorrect({ type: 'pilihan-ganda-banyak', answer: [0, 2] }, [0]), false);
  assert.equal(isAnswerCorrect({ type: 'isian', answer: ['ekstraksi fitur', 'feature extraction'] }, '  FEATURE   EXTRACTION '), true);
});

test('menghitung skor dan normalisasi isian', () => {
  const questions = [
    { id: 'a', type: 'pilihan-ganda', answer: 0 },
    { id: 'b', type: 'benar-salah', answer: true }
  ];
  const result = evaluateQuiz(questions, { a: 0, b: 'false' });
  assert.equal(result.correct, 1);
  assert.equal(result.total, 2);
  assert.equal(result.score, 0.5);
  assert.equal(normalizeShortAnswer('  DATA   Sinyal '), 'data sinyal');
});

test('mengacak opsi tanpa mengubah indeks jawaban asal', () => {
  const question = { options: ['a', 'b', 'c'], shuffle: false };
  assert.deepEqual(shuffleOptions(question), [{ label: 'a', index: 0 }, { label: 'b', index: 1 }, { label: 'c', index: 2 }]);
  const shuffled = shuffleOptions({ options: ['a', 'b', 'c'] }, () => 0);
  assert.deepEqual(shuffled.map(option => option.index), [1, 2, 0]);
});
