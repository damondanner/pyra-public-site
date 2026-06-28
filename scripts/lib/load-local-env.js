const fs = require('fs/promises');
const path = require('path');

async function loadLocalEnv(cwd = process.cwd()) {
  const envPath = path.join(cwd, '.env.local');

  try {
    const content = await fs.readFile(envPath, 'utf8');

    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();

      if (!line || line.startsWith('#')) {
        continue;
      }

      const equalsIndex = line.indexOf('=');

      if (equalsIndex === -1) {
        continue;
      }

      const key = line.slice(0, equalsIndex).trim();
      const value = stripEnvQuotes(line.slice(equalsIndex + 1).trim());

      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

function stripEnvQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

module.exports = {
  loadLocalEnv,
  stripEnvQuotes
};
