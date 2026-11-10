import next from 'eslint-config-next/core-web-vitals';
const config = [...next, { ignores: ['.next/**', '.next-*/**', 'node_modules/**', 'next-env.d.ts', 'test-results/**', 'playwright-report/**'] }, { rules: { 'react-hooks/set-state-in-effect': 'off', 'react-hooks/immutability': 'off', 'react-hooks/exhaustive-deps': 'off', 'react-hooks/purity': 'off', 'react/no-unescaped-entities': 'off' } }];

export default config;
