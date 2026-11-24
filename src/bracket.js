export function normalizeBracketRounds(data) {
  if (!Array.isArray(data?.rounds)) return [];
  return data.rounds
    .filter(Array.isArray)
    .map(round => round.filter(match => match && typeof match === 'object').map(match => ({
      ...match,
      players: Array.isArray(match.players) ? match.players.filter(Boolean) : []
    })));
}
