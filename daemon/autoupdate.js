/**
 * Auto-Update Scheduler
 *
 * Two independent update processes:
 *
 * 1. App autoupdate — runs watchtower --run-once --label-enable to update any
 *    user-deployed container with com.centurylinklabs.watchtower.enable=true.
 *    Controlled by: YANTR_AUTOUPDATE (default: enabled), YANTR_AUTOUPDATE_INTERVAL hours (default: 24)
 *
 * 2. Self-update — runs watchtower --run-once targeting only the yantr container
 *    by name so yantr always stays current, independent of the label mechanism.
 *    Controlled by: YANTR_SELFUPDATE (default: enabled), YANTR_SELFUPDATE_INTERVAL hours (default: 24)
 *    Container name: YANTR_CONTAINER_NAME (default: "yantr")
 */

import { spawnProcess } from "./utils.js";
import { socketPath } from "./shared.js";

let _log = () => {};

// ── Shared watchtower runner ───────────────────────────────────────────────────

async function runWatchtower(args, label) {
  try {
    const { exitCode, stdout, stderr } = await spawnProcess("docker", [
      "run", "--rm",
      "-v", `${socketPath}:/var/run/docker.sock`,
      "containrrr/watchtower",
      "--run-once",
      "--cleanup",
      ...args,
    ], { env: { ...process.env, DOCKER_HOST: `unix://${socketPath}` } });

    if (exitCode === 0) {
      _log("info", `🔄 [${label}] Completed successfully`);
    } else {
      _log("warn", `🔄 [${label}] Finished with exit code ${exitCode}: ${stderr.trim()}`);
    }
    return { exitCode, stdout, stderr };
  } catch (e) {
    _log("error", `🔄 [${label}] Failed: ${e.message}`);
    return { error: e.message };
  }
}

// ── App autoupdate (label-based) ───────────────────────────────────────────────

let appUpdateRunning = false;

export async function runAutoUpdate() {
  if (appUpdateRunning) {
    _log("info", "🔄 [AUTOUPDATE] Already in progress, skipping");
    return { skipped: true };
  }
  appUpdateRunning = true;
  _log("info", "🔄 [AUTOUPDATE] Updating labeled containers...");
  const result = await runWatchtower(["--label-enable"], "AUTOUPDATE");
  appUpdateRunning = false;
  return result;
}

// ── Yantr self-update (by container name) ─────────────────────────────────────

let selfUpdateRunning = false;

export async function runSelfUpdate() {
  if (selfUpdateRunning) {
    _log("info", "🔄 [SELFUPDATE] Already in progress, skipping");
    return { skipped: true };
  }
  const containerName = process.env.YANTR_CONTAINER_NAME || "yantr";
  selfUpdateRunning = true;
  _log("info", `🔄 [SELFUPDATE] Checking for yantr update (container: ${containerName})...`);
  const result = await runWatchtower([containerName], "SELFUPDATE");
  selfUpdateRunning = false;
  return result;
}

// ── Schedulers ────────────────────────────────────────────────────────────────

export function startAutoUpdateScheduler(log) {
  _log = log;

  // App autoupdate
  if (process.env.YANTR_AUTOUPDATE !== "false") {
    const intervalHours = parseFloat(process.env.YANTR_AUTOUPDATE_INTERVAL) || 24;
    setTimeout(runAutoUpdate, 5 * 60 * 1000);
    setInterval(runAutoUpdate, intervalHours * 60 * 60 * 1000);
    log("info", `🔄 [AUTOUPDATE] Scheduler started — every ${intervalHours}h (first run in 5m)`);
  } else {
    log("info", "🔄 [AUTOUPDATE] Disabled via YANTR_AUTOUPDATE=false");
  }

  // Yantr self-update
  if (process.env.YANTR_SELFUPDATE !== "false") {
    const intervalHours = parseFloat(process.env.YANTR_SELFUPDATE_INTERVAL) || 24;
    // Offset by 10 minutes so both don't fire at the same time on startup
    setTimeout(runSelfUpdate, 10 * 60 * 1000);
    setInterval(runSelfUpdate, intervalHours * 60 * 60 * 1000);
    log("info", `🔄 [SELFUPDATE] Scheduler started — every ${intervalHours}h (first run in 10m)`);
  } else {
    log("info", "🔄 [SELFUPDATE] Disabled via YANTR_SELFUPDATE=false");
  }
}
