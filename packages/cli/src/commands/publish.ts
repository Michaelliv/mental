/**
 * Publish command - generates static site for GitHub Pages deployment
 *
 * This command:
 * 1. Reads the model from .mental/model.ndjson
 * 2. Detects GitHub repo info from git remote
 * 3. Embeds local doc content into the model
 * 4. Builds the web app with static mode + base path
 * 5. Copies assets to output directory
 * 6. Writes model.json with GitHub repo metadata
 * 7. Patches index.html with static mode configuration
 */

import { join, resolve, extname } from 'path';
import { existsSync, readFileSync, mkdirSync, writeFileSync, readdirSync, copyFileSync, statSync } from 'fs';
import { createFileStorage } from '../lib/storage';
import pc from 'picocolors';
import type { StaticMentalModel, EmbeddedDoc, GitHubConfig } from '@mentalmodel/shared';

interface PublishOptions {
  output?: string;
  base?: string;
  branch?: string;
}

/**
 * Parse GitHub remote URL to extract owner and repo
 */
function parseGitHubRemote(remoteUrl: string): { owner: string; repo: string } | null {
  // Handle SSH format: git@github.com:owner/repo.git
  const sshMatch = remoteUrl.match(/git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  // Handle HTTPS format: https://github.com/owner/repo.git
  const httpsMatch = remoteUrl.match(/https?:\/\/github\.com\/([^/]+)\/(.+?)(?:\.git)?$/);
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  return null;
}

/**
 * Detect GitHub repo info from git remote
 */
async function detectGitHubInfo(cwd: string): Promise<GitHubConfig | null> {
  try {
    const result = Bun.spawnSync(['git', 'remote', 'get-url', 'origin'], {
      cwd,
      stdout: 'pipe',
      stderr: 'pipe',
    });

    if (result.exitCode !== 0) {
      return null;
    }

    const remoteUrl = result.stdout.toString().trim();
    const parsed = parseGitHubRemote(remoteUrl);

    if (!parsed) {
      return null;
    }

    // Get current branch
    const branchResult = Bun.spawnSync(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd,
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const branch = branchResult.exitCode === 0 ? branchResult.stdout.toString().trim() : 'main';

    return {
      owner: parsed.owner,
      repo: parsed.repo,
      branch,
    };
  } catch {
    return null;
  }
}

/**
 * Embed local doc content into the model
 */
function embedDocs(model: StaticMentalModel, cwd: string): Record<string, EmbeddedDoc> {
  const embeddedDocs: Record<string, EmbeddedDoc> = {};

  // Collect all doc paths from decisions
  const docPaths = new Set<string>();
  for (const decision of Object.values(model.decisions)) {
    if (decision.docs) {
      for (const docPath of decision.docs) {
        docPaths.add(docPath);
      }
    }
  }

  // Process each doc path
  for (const docPath of docPaths) {
    // External URLs are just marked as external
    if (docPath.startsWith('http://') || docPath.startsWith('https://')) {
      embeddedDocs[docPath] = {
        path: docPath,
        isExternal: true,
      };
      continue;
    }

    // Try to read local file
    const absolutePath = resolve(cwd, docPath);
    if (!absolutePath.startsWith(cwd)) {
      embeddedDocs[docPath] = {
        path: docPath,
        isExternal: false,
        error: 'Invalid path',
      };
      continue;
    }

    if (!existsSync(absolutePath)) {
      embeddedDocs[docPath] = {
        path: docPath,
        isExternal: false,
        error: 'File not found',
      };
      continue;
    }

    try {
      const content = readFileSync(absolutePath, 'utf-8');
      const ext = extname(absolutePath).toLowerCase();
      const isMarkdown = ext === '.md' || ext === '.mdx';

      embeddedDocs[docPath] = {
        path: docPath,
        content,
        isMarkdown,
        isExternal: false,
      };
    } catch {
      embeddedDocs[docPath] = {
        path: docPath,
        isExternal: false,
        error: 'Failed to read file',
      };
    }
  }

  return embeddedDocs;
}

/**
 * Recursively copy directory
 */
function copyDir(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });

  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const stat = statSync(srcPath);

    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

export async function publish(options: PublishOptions): Promise<void> {
  const cwd = process.cwd();
  const storage = createFileStorage();

  // Check if model exists
  if (!storage.isInitialized()) {
    console.error(pc.red('Error: Mental model not initialized'));
    console.error('Run `mental add domain <name>` to create your first entity');
    process.exit(1);
  }

  const outputDir = resolve(cwd, options.output || '.mental/site');

  // Detect GitHub info for base path and file fetching
  console.log(pc.dim('Detecting GitHub repository info...'));
  const githubInfo = await detectGitHubInfo(cwd);

  let basePath = options.base;
  if (!basePath) {
    if (githubInfo) {
      basePath = `/${githubInfo.repo}/`;
      console.log(pc.dim(`  Auto-detected base path: ${basePath}`));
    } else {
      basePath = '/';
      console.log(pc.dim('  No GitHub remote found, using root base path'));
    }
  } else {
    console.log(pc.dim(`  Using provided base path: ${basePath}`));
  }

  // Ensure base path has leading and trailing slashes
  if (!basePath.startsWith('/')) basePath = '/' + basePath;
  if (!basePath.endsWith('/')) basePath = basePath + '/';

  // Override branch if provided
  const github: GitHubConfig | undefined = githubInfo
    ? {
        ...githubInfo,
        branch: options.branch || githubInfo.branch,
      }
    : undefined;

  if (github) {
    console.log(pc.dim(`  Repository: ${github.owner}/${github.repo}`));
    console.log(pc.dim(`  Branch: ${github.branch}`));
  }

  // Read and process model
  console.log(pc.dim('Processing mental model...'));
  const model = storage.readModel() as StaticMentalModel;

  // Embed doc content
  const embeddedDocs = embedDocs(model, cwd);
  const embeddedCount = Object.values(embeddedDocs).filter((d) => d.content).length;
  console.log(pc.dim(`  Embedded ${embeddedCount} local documents`));

  // Add GitHub info and embedded docs to model
  model.github = github;
  model.embeddedDocs = embeddedDocs;

  // Find web dist path
  const bundledWebPath = join(import.meta.dir, 'web');
  const devWebPath = resolve(import.meta.dir, '../../../../packages/web/dist');
  const webPackageDir = resolve(import.meta.dir, '../../../../packages/web');

  let webDistPath: string;

  // Check if we're using bundled assets (npm install) or dev mode
  if (existsSync(bundledWebPath)) {
    // Using bundled assets from npm - these are pre-built
    // Note: bundled assets are built with a placeholder base path that gets patched
    webDistPath = bundledWebPath;
  } else if (existsSync(webPackageDir)) {
    // Dev mode - always rebuild with correct base path
    console.log(pc.dim('Building web app...'));

    const buildResult = Bun.spawnSync(['bun', 'run', 'build'], {
      cwd: webPackageDir,
      env: {
        ...process.env,
        VITE_BASE_PATH: basePath,
      },
      stdout: 'pipe',
      stderr: 'pipe',
    });

    if (buildResult.exitCode !== 0) {
      console.error(pc.red('Error: Failed to build web app'));
      console.error(buildResult.stderr.toString());
      process.exit(1);
    }

    webDistPath = devWebPath;
  } else {
    console.error(pc.red('Error: Web package not found'));
    console.error('This is a packaging error - please report it at https://github.com/Michaelliv/mental/issues');
    process.exit(1);
  }

  // Create output directory
  console.log(pc.dim(`Creating output directory: ${outputDir}`));
  mkdirSync(outputDir, { recursive: true });

  // Copy web assets to output
  console.log(pc.dim('Copying web assets...'));
  copyDir(webDistPath, outputDir);

  // Write model.json
  const modelJsonPath = join(outputDir, 'model.json');
  writeFileSync(modelJsonPath, JSON.stringify(model, null, 2));
  console.log(pc.dim('  Created model.json'));

  // Patch index.html with static mode configuration
  const indexPath = join(outputDir, 'index.html');
  if (existsSync(indexPath)) {
    let indexHtml = readFileSync(indexPath, 'utf-8');

    // Create the config script
    const configScript = `<script>
    window.__MENTAL_STATIC_MODE__ = true;
    window.__MENTAL_BASE_PATH__ = "${basePath}";
    ${github ? `window.__MENTAL_GITHUB__ = ${JSON.stringify(github)};` : ''}
  </script>`;

    // Insert config script before the closing </head> tag
    indexHtml = indexHtml.replace('</head>', `${configScript}\n  </head>`);

    writeFileSync(indexPath, indexHtml);
    console.log(pc.dim('  Patched index.html with static mode configuration'));
  }

  // Success output
  console.log();
  console.log(pc.green('Static site generated successfully!'));
  console.log();
  console.log(pc.bold('Output directory:'), outputDir);
  console.log();
  console.log(pc.dim('To preview locally:'));
  console.log(pc.cyan(`  cd ${outputDir} && python3 -m http.server 8000`));
  console.log();
  console.log(pc.dim('To deploy to GitHub Pages:'));
  console.log(pc.cyan(`  cd ${outputDir} && npx gh-pages -d .`));
  console.log();

  if (!github) {
    console.log(pc.yellow('Warning: No GitHub remote detected.'));
    console.log(pc.yellow('Source file viewing will not work in the published site.'));
    console.log(pc.yellow('Make sure to push your code to GitHub before publishing.'));
    console.log();
  }
}
