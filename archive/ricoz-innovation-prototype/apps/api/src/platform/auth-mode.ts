export function simpleDevelopmentAuth() {
  return (
    ["development", "test"].includes(process.env.NODE_ENV || "") &&
    process.env.DEV_SIMPLE_AUTH === "true"
  );
}
export function authConfiguration() {
  const simple = simpleDevelopmentAuth();
  return {
    mode: simple ? "developmentSimple" : "standard",
    requiresEmailVerification: !simple,
    requiresStaffMfa: !simple,
    passwordMinimum: simple ? 8 : 12,
  };
}
