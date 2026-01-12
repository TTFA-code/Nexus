/**
 * Calculates new Elo rating based on current ratings and match outcome.
 * 
 * @param playerRating Current rating of the player
 * @param opponentRating Current rating of the opponent
 * @param actualScore 1 for Win, 0.5 for Draw, 0 for Loss
 * @param kFactor The K-factor determines the sensitivity of the rating change (default: 32)
 * @returns Object containing the new rating and the rating change
 */
export function calculateElo(playerRating: number, opponentRating: number, actualScore: number, kFactor: number = 32) {
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
    const newRating = Math.round(playerRating + kFactor * (actualScore - expectedScore));

    return {
        newRating,
        change: newRating - playerRating
    };
}
