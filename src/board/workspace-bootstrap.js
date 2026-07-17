export function workspaceBootstrapPlan({ accessibleBoardCount, hasSettings }) {
  return {
    shouldSeedBoard: accessibleBoardCount === 0,
    shouldCreateSettings: !hasSettings,
  };
}
