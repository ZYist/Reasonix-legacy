import { createContext } from 'react';

export type Props = {
  /** Tear down the root and unmount the whole app. */
  readonly exit: (error?: Error) => void;
  /** Immediately erase + fully repaint the screen from scratch. */
  readonly forceRedraw: () => void;
};

/** Provides the imperative `exit()` handle to descendants. */
// eslint-disable-next-line @typescript-eslint/naming-convention
const AppContext = createContext<Props>({
  exit() {},
  forceRedraw() {},
});

// eslint-disable-next-line custom-rules/no-top-level-side-effects
AppContext.displayName = 'InternalAppContext';

export default AppContext;
