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
import { deleteEntity } from './commands/delete';
import { updateDomain, updateCapability, updateAspect, updateDecision } from './commands/update';
import { supersedeDecision } from './commands/supersede-decision';
import { show } from './commands/show';
import { view } from './commands/view';
import { onboard } from './commands/onboard';

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
  .option('-c, --context <context>', 'Context when decision was made')
  .option('-r, --relates-to <entities>', 'Related entities (format: domain:Name,capability:Name)')
  .option('-d, --docs <docs>', 'Related docs (comma-separated paths or URLs)')
  .option('--json', 'Output JSON')
  .action(addDecision);

// Delete command group
const del = program.command('delete').description('Delete entities from the mental model');

del
  .command('domain <name>')
  .description('Delete a domain')
  .option('--json', 'Output JSON')
  .action((name, options) => deleteEntity('domain', name, options));

del
  .command('capability <name>')
  .description('Delete a capability')
  .option('--json', 'Output JSON')
  .action((name, options) => deleteEntity('capability', name, options));

del
  .command('aspect <name>')
  .description('Delete an aspect')
  .option('--json', 'Output JSON')
  .action((name, options) => deleteEntity('aspect', name, options));

del
  .command('decision <id>')
  .description('Delete a decision')
  .option('--json', 'Output JSON')
  .action((id, options) => deleteEntity('decision', id, options));

// Update command group
const update = program.command('update').description('Update entities in the mental model');

update
  .command('domain <name>')
  .description('Update a domain')
  .option('-n, --name <newName>', 'Rename the domain')
  .option('-d, --desc <description>', 'New description')
  .option('--description <description>', 'New description (alias)')
  .option('-r, --refs <references>', 'New references (comma-separated)')
  .option('--references <references>', 'New references (alias)')
  .option('-f, --files <files>', 'New files (comma-separated)')
  .option('--cascade', 'Update references in other entities when renaming')
  .option('--json', 'Output JSON')
  .action(updateDomain);

update
  .command('capability <name>')
  .description('Update a capability')
  .option('-n, --name <newName>', 'Rename the capability')
  .option('-d, --desc <description>', 'New description')
  .option('--description <description>', 'New description (alias)')
  .option('-o, --operates-on <domains>', 'New operates-on (comma-separated)')
  .option('--composes <capabilities>', 'New composes (comma-separated)')
  .option('-f, --files <files>', 'New files (comma-separated)')
  .option('--cascade', 'Update references in other entities when renaming')
  .option('--json', 'Output JSON')
  .action(updateCapability);

update
  .command('aspect <name>')
  .description('Update an aspect')
  .option('-n, --name <newName>', 'Rename the aspect')
  .option('-d, --desc <description>', 'New description')
  .option('--description <description>', 'New description (alias)')
  .option('-a, --applies-to <targets>', 'New applies-to (comma-separated)')
  .option('-f, --files <files>', 'New files (comma-separated)')
  .option('--cascade', 'Update references in other entities when renaming')
  .option('--json', 'Output JSON')
  .action(updateAspect);

update
  .command('decision <id>')
  .description('Update a decision')
  .option('--what <what>', 'New decision text')
  .option('-w, --why <why>', 'New rationale')
  .option('-c, --context <context>', 'New context')
  .option('-r, --relates-to <entities>', 'New relations (format: domain:Name,capability:Name)')
  .option('-d, --docs <docs>', 'New docs (comma-separated paths or URLs)')
  .option('--json', 'Output JSON')
  .action(updateDecision);

// Supersede command group
const supersede = program.command('supersede').description('Supersede entities in the mental model');

supersede
  .command('decision <id>')
  .description('Supersede a decision with a new one')
  .option('--what <decision>', 'The new decision')
  .option('-w, --why <rationale>', 'Why superseding')
  .option('-c, --context <context>', 'Context for new decision')
  .option('-r, --relates-to <entities>', 'New relations (format: domain:Name,capability:Name)')
  .option('--json', 'Output JSON')
  .action(supersedeDecision);

// Show command
program
  .command('show')
  .description('Display the current mental model')
  .option('--json', 'Output JSON')
  .action(show);

// View command
program
  .command('view')
  .description('Open interactive visualization')
  .action(view);

// Onboard command
program
  .command('onboard')
  .description('Add mental section to CLAUDE.md or AGENTS.md')
  .option('-f, --force', 'Update existing section')
  .option('-g, --global', 'Add to ~/.claude/CLAUDE.md instead of project root')
  .action(onboard);

program.parse();
