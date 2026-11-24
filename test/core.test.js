import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateQuestion, validateQuiz, pairPlayers, comparePlayers, buildBracketRounds } from '../backend/core.js';
import { normalizeBracketRounds } from '../src/bracket.js';

const question = { question: '2 + 2?', answers: ['3', '4'], correctAnswerIndex: 1, timeLimit: 15 };

test('validates question bounds and normalizes options', () => {
  const result = validateQuestion(question);
  assert.deepEqual(result.errors, []);
  assert.equal(result.value.correctAnswerIndex, 1);
  assert.equal(validateQuestion({ ...question, answers: ['only one'] }).errors.length > 0, true);
});

test('quiz validation catches invalid question rows', () => {
  assert.equal(validateQuiz({ title: 'Quiz', questions: [question] }).errors.length, 0);
  assert.ok(validateQuiz({ title: '', questions: [] }).errors.length >= 2);
});

test('pairing covers even and odd rosters without duplicates', () => {
  const even = pairPlayers(['a', 'b', 'c', 'd'], () => 0.5);
  assert.equal(even.pairs.length, 2);
  assert.equal(new Set(even.pairs.flat()).size, 4);
  const odd = pairPlayers(['a', 'b', 'c'], () => 0.5);
  assert.equal(odd.pairs.length, 1);
  assert.equal(odd.byes.length, 1);
});

test('bracket rounds are dense, ordered, and safe to serialize when rounds are numbered from one', () => {
  const players = new Map([['a', { nickname: 'Ada' }], ['b', { nickname: 'Lin' }], ['c', { nickname: 'Grace' }]]);
  const rounds = buildBracketRounds([
    { id: 'm1', round: 1, players: ['a', 'b'], winnerId: null, status: 'active' },
    { id: 'bye', round: 1, players: ['c'], winnerId: 'c', status: 'bye' },
    { id: 'm2', round: 2, players: ['c', 'a'], winnerId: 'c', status: 'complete' }
  ], players);
  assert.equal(rounds.length, 2);
  assert.ok(rounds.every(Array.isArray));
  assert.equal(JSON.parse(JSON.stringify(rounds))[0][0].players[0].nickname, 'Ada');
  assert.equal(rounds[1][0].winner.nickname, 'Grace');
});

test('bracket rendering input skips sparse null rounds and malformed player lists', () => {
  const data=JSON.parse('{"rounds":[null,[null,{"id":"m1","status":"active","players":null}]]}');
  const rounds=normalizeBracketRounds(data);
  assert.equal(rounds.length,1);
  assert.equal(rounds[0].length,1);
  assert.deepEqual(rounds[0][0].players,[]);
});

test('winner tie breakers favor accuracy then health then response time', () => {
  assert.equal(comparePlayers({ alive: true, correct: 2, hp: 5 }, { alive: true, correct: 1, hp: 90 }), 1);
  assert.equal(comparePlayers({ alive: true, correct: 2, hp: 80 }, { alive: true, correct: 2, hp: 60 }), 1);
  assert.equal(comparePlayers({ alive: true, correct: 2, hp: 80, responseTotal: 7000 }, { alive: true, correct: 2, hp: 80, responseTotal: 5000 }), -1);
});

test('demo quiz remains editable data with at least 30 valid questions', () => {
  const template=JSON.parse(fs.readFileSync(new URL('../db/seed-data.json',import.meta.url),'utf8'));
  assert.ok(template.questions.length>=30);
  assert.deepEqual(validateQuiz(template).errors,[]);
});
