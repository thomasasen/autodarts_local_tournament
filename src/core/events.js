// Auto-generated module split from dist source.
  function addCleanup(fn) {
    state.cleanupStack.push(fn);
    return fn;
  }


  function addListener(target, eventName, handler, options) {
    target.addEventListener(eventName, handler, options);
    addCleanup(() => target.removeEventListener(eventName, handler, options));
  }


  function addInterval(handler, ms) {
    const handle = window.setInterval(handler, ms);
    addCleanup(() => clearInterval(handle));
    return handle;
  }


  function addObserver(observer) {
    addCleanup(() => observer.disconnect());
    return observer;
  }


