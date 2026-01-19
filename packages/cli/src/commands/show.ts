/**
 * Show mental model command
 */

import { readModel } from '../lib/storage';
import pc from 'picocolors';

interface ShowOptions {
  json?: boolean;
}

export function show(options: ShowOptions): void {
  const model = readModel();

  if (options.json) {
    console.log(JSON.stringify(model, null, 2));
    return;
  }

  console.log('\n' + pc.bold(pc.cyan('Mental Model')) + '\n');

  // Domains
  const domainCount = Object.keys(model.domains).length;
  console.log(pc.bold(`Domains (${domainCount}):`));
  if (domainCount === 0) {
    console.log(pc.dim('  (none)'));
  } else {
    for (const [name, domain] of Object.entries(model.domains)) {
      console.log(`  ${pc.green('●')} ${pc.bold(name)}`);
      console.log(`    ${pc.dim(domain.description)}`);
      if (domain.references && domain.references.length > 0) {
        console.log(`    ${pc.dim('References:')} ${domain.references.join(', ')}`);
      }
    }
  }
  console.log();

  // Capabilities
  const capabilityCount = Object.keys(model.capabilities).length;
  console.log(pc.bold(`Capabilities (${capabilityCount}):`));
  if (capabilityCount === 0) {
    console.log(pc.dim('  (none)'));
  } else {
    for (const [name, capability] of Object.entries(model.capabilities)) {
      console.log(`  ${pc.blue('●')} ${pc.bold(name)}`);
      console.log(`    ${pc.dim(capability.description)}`);
      if (capability.operates_on && capability.operates_on.length > 0) {
        console.log(`    ${pc.dim('Operates on:')} ${capability.operates_on.join(', ')}`);
      }
    }
  }
  console.log();

  // Aspects
  const aspectCount = Object.keys(model.aspects).length;
  console.log(pc.bold(`Aspects (${aspectCount}):`));
  if (aspectCount === 0) {
    console.log(pc.dim('  (none)'));
  } else {
    for (const [name, aspect] of Object.entries(model.aspects)) {
      console.log(`  ${pc.magenta('●')} ${pc.bold(name)}`);
      console.log(`    ${pc.dim(aspect.description)}`);
      if (aspect.applies_to?.capabilities && aspect.applies_to.capabilities.length > 0) {
        console.log(
          `    ${pc.dim('Applies to:')} ${aspect.applies_to.capabilities.join(', ')}`
        );
      }
    }
  }
  console.log();

  // Decisions
  const decisionCount = Object.keys(model.decisions).length;
  console.log(pc.bold(`Decisions (${decisionCount}):`));
  if (decisionCount === 0) {
    console.log(pc.dim('  (none)'));
  } else {
    for (const [id, decision] of Object.entries(model.decisions)) {
      console.log(`  ${pc.yellow('●')} ${pc.bold(decision.what)}`);
      console.log(`    ${pc.dim('Why:')} ${decision.why}`);
      console.log(`    ${pc.dim('ID:')} ${id}`);
    }
  }
  console.log();
}
