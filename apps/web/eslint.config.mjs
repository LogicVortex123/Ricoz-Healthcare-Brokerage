import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  ...nextVitals,
  globalIgnores(['.next/**', 'next-env.d.ts']),
  {
    rules: {
      // Client pages load account data after sign-in. The effect updates state when that request returns.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/incompatible-library': 'off',
    },
  },
]);
