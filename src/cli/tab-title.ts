const PRODUCT_NAME = "reasonix-legacy";
const REEMIT_MS = 2000;

let keeperId: NodeJS.Timeout | null = null;

// OSC 0 sets the icon name + window title. ST terminator (\x1b\\) instead of
// BEL keeps the sequence valid regardless of strip-bel's Windows-only BEL→ST
// rewrite — both are legal OSC terminators and Windows Terminal honours either.
function emit(): void {
  process.stdout.write(`\x1b]0;${PRODUCT_NAME}\x1b\\`);
}

// Windows Terminal's ConPTY syncs child-process titles (npx, ollama, shell
// tools, …) onto the tab via SetConsoleTitle, so a single OSC 0 emitted at
// startup gets overwritten seconds later. Re-emit on a light timer to keep
// our title while the process runs. The timer is unref'd (never blocks exit)
// and a singleton (repeated calls don't stack intervals).
export function setTabTitle(): void {
  if (process.stdout.isTTY !== true) return;
  emit();
  if (keeperId === null) {
    const id = setInterval(emit, REEMIT_MS);
    // Node timers expose unref so this never keeps the process alive; vitest
    // fake timers don't, hence the guard.
    (id as { unref?: () => void }).unref?.();
    keeperId = id;
  }
}

/** Clear the singleton re-emit timer. Test/teardown hook. */
export function stopTabTitleKeeper(): void {
  if (keeperId !== null) {
    clearInterval(keeperId);
    keeperId = null;
  }
}
