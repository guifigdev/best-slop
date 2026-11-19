import {defineConfig} from 'vite';
import {localPhaseApi} from './server/local-phase-api.js';
export default defineConfig({plugins:[localPhaseApi()]});
