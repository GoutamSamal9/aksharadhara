import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
export default tseslint.config({ ignores: ['archive/**','dist/**','out/**','.next/**','node_modules/**','playwright-report/**','test-results/**'] }, ...tseslint.configs.recommended, {files:['**/*.{ts,tsx}'],plugins:{'react-hooks':hooks},rules:{...hooks.configs.recommended.rules}});
