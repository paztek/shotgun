import { execSync } from 'child_process';

const ARGS = [
    '--remote-only',
    '--config fly.toml',
].join(' ');

function run(label, command) {
    console.log(`\n==> Deploying ${label}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`==> ${label} deployed.\n`);
}

run('shotgun', `fly deploy ${ARGS}`);
