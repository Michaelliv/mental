#!/usr/bin/env bun

/**
 * Mental Model CLI
 * The mental model layer for agent-written code
 */

import { Command } from 'commander';
import { addDomain } from './commands/add-domain';
import { addCapability } from './commands/add-capability';
import { addAspect } from './commands/add-aspect';
import { addDecision } from './commands/add-decision';
import { show } from './commands/show';

const program = new Command();

program
  .name('mental')
  .description('The mental model layer for agent-written code')
  .version('0.1.0');

// Add command group
const add = program.command('add').description('Add entities to the mental model');

add
  .command('domain [name]')
  .description('Add a domain')
  .option('-d, --desc <description>', 'Domain description')
  .option('--description <description>', 'Domain description (alias)')
  .option('-r, --refs <references>', 'Referenced domains (comma-separated)')
  .option('--references <references>', 'Referenced domains (alias)')
  .option('-f, --files <files>', 'Related files (comma-separated)')
  .option('--json', 'Output JSON')
  .action(addDomain);

add
  .command('capability [name]')
  .description('Add a capability')
  .option('-d, --desc <description>', 'Capability description')
  .option('--description <description>', 'Capability description (alias)')
  .option('-o, --operates-on <domains>', 'Domains this operates on (comma-separated)')
  .option('--composes <capabilities>', 'Capabilities this composes (comma-separated)')
  .option('-f, --files <files>', 'Related files (comma-separated)')
  .option('--json', 'Output JSON')
  .action(addCapability);

add
  .command('aspect [name]')
  .description('Add an aspect')
  .option('-d, --desc <description>', 'Aspect description')
  .option('--description <description>', 'Aspect description (alias)')
  .option('-a, --applies-to <targets>', 'What this applies to (comma-separated capabilities)')
  .option('-f, --files <files>', 'Related files (comma-separated)')
  .option('--json', 'Output JSON')
  .action(addAspect);

add
  .command('decision [what]')
  .description('Add a decision')
  .option('-w, --why <rationale>', 'Why this decision was made')
  .option('-r, --relates-to <entities>', 'Related entities (format: domain:Name,capability:Name)')
  .option('--json', 'Output JSON')
  .action(addDecision);

// Show command
program
  .command('show')
  .description('Display the current mental model')
  .option('--json', 'Output JSON')
  .action(show);

// Graph command (placeholder for now)
program
  .command('graph')
  .description('Open interactive graph visualization')
  .action(() => {
    console.log('Graph visualization coming soon!');
    console.log('This will start a local server and open your browser.');
  });

program.parse();
