import { onDestroy } from 'svelte';
import { createBaseHistory } from './baseHistory';
const globalHistory = window.history;

export function createBrowserHistory() {
  const {
    currentPath,
    setPath,
    block,
    unblock,
    isBlocked,
    acceptLeave,
    cancelLeave,
    onLeave,
    offLeave,
    wasTriedToLeave,
  } = createBaseHistory(getCurrentPath());

  let isStateChangedFromUI = false;
  let pendingAction = null;
  let currentState = globalHistory.state || 0;

  globalHistory.replaceState(currentState, '', getCurrentPath());

  function push(to) {
    if (isBlocked()) return [push, [to]];
    globalHistory.pushState(++currentState, null, to);
    setCurrentPath();
  }

  function back() {
    if (isBlocked()) return [back, []];
    isStateChangedFromUI = true;
    globalHistory.back();
    setCurrentPath();
    currentState--;
  }

  function forward() {
    if (isBlocked()) return [forward, []];
    isStateChangedFromUI = true;
    globalHistory.forward();
    setCurrentPath();
    currentState++;
  }

  function replace(to) {
    if (isBlocked()) return [replace, [to]];
    globalHistory.replaceState(currentState, null, to);
    setCurrentPath();
  }

  function onStateChange(e) {
    if (isStateChangedFromUI) {
      isStateChangedFromUI = false;
      return;
    }

    if (isBlocked()) {
      globalHistory[e.state < currentState ? 'forward' : 'back']();
      isStateChangedFromUI = true;
      return [e.state < currentState ? back : forward, []];
    }
    currentState = e.state;
    setCurrentPath();
  }

  function wrapAfterAction(action) {
    return (...args) => {
      const presentedPendingAction = action(...args);
      if (presentedPendingAction) {
        pendingAction = presentedPendingAction;
        wasTriedToLeave();
      }
    };
  }

  function onAcceptLeave() {
    acceptLeave();
    const [fn, args] = pendingAction;
    fn(...args);
  }

  function getCurrentPath() {
    return `${location.pathname}${location.search}${location.hash}`;
  }

  function setCurrentPath() {
    setPath(getCurrentPath());
  }

  const wrappedOnStateChange = wrapAfterAction(onStateChange);

  window.addEventListener('popstate', wrappedOnStateChange);

  onDestroy(() => {
    pendingAction = null;
    window.removeEventListener('popstate', wrappedOnStateChange);
  });

  return {
    currentPath,
    push: wrapAfterAction(push),
    back: wrapAfterAction(back),
    forward: wrapAfterAction(forward),
    replace: wrapAfterAction(replace),
    block,
    unblock,
    acceptLeave: onAcceptLeave,
    cancelLeave,
    onLeave,
    offLeave,
  };
}
