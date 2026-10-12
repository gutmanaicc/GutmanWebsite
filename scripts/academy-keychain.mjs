import { loadMorningCredentials } from '../server/morning-credentials.mjs';

// Run on the Mac containing the existing Keychain, never with a secret in CLI arguments.
const args = process.argv.slice(2);
const options = {};
let action = 'check';
try {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--check') action = 'check';
    else if (args[i] === '--serve') action = 'serve';
    else {
      const name = { '--service': 'service', '--id-service': 'idService', '--secret-service': 'secretService', '--account': 'account' }[args[i]];
      if (!name || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error('Usage: node scripts/academy-keychain.mjs --check|--serve [--service NAME | --id-service NAME --secret-service NAME] [--account NAME]');
      options[name] = args[++i];
    }
  }
  const credentials = loadMorningCredentials(options);
  console.log(`Morning API credentials available from ${credentials.source}. Values are withheld; provider connectivity has not been verified.`);
  if (action === 'serve') {
    // Keep keys in this process only. No file, shell command, browser variable or CLI argument.
    process.env.MORNING_API_ID = credentials.id;
    process.env.MORNING_API_SECRET = credentials.secret;
    await import('./academy-server.mjs');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
