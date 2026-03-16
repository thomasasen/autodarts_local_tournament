  function createFakeStorage(initialValues = {}) {
    const values = { ...initialValues };
    return {
      getItem(key) {
        return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null;
      },
      setItem(key, value) {
        values[key] = String(value);
      },
      dump() {
        return cloneSerializable(values);
      },
    };
  }


  function createFakeWindow(options = {}) {
    const openedUrls = [];
    const windowRef = {
      localStorage: options.localStorage || createFakeStorage(),
      location: {
        href: "",
        reloadCalled: false,
        reload() {
          this.reloadCalled = true;
        },
      },
      open(url) {
        openedUrls.push(String(url || ""));
        return {
          focus() {},
        };
      },
      __openedUrls: openedUrls,
    };
    if (typeof options.fetch === "function") {
      windowRef.fetch = options.fetch;
    }
    if (options.loaderActive) {
      windowRef[LOADER_GUARD_KEY] = true;
    }
    return windowRef;
  }


  function buildUserscriptMeta(version) {
    return `// ==UserScript==
// @name         Autodarts Tournament Assistant
// @version      ${version}
// ==/UserScript==
`;
  }


  function getUrlWithoutQuery(url) {
    const parsed = new URL(String(url || ""));
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  }


  function createHeaders(values = {}) {
    const normalized = Object.entries(values).reduce((result, [key, value]) => {
      result[String(key || "").toLowerCase()] = String(value || "");
      return result;
    }, {});

    return {
      get(name) {
        return normalized[String(name || "").toLowerCase()] || null;
      },
    };
  }


  test("update check adds cache-busting query to meta request", async () => {
    const requests = [];
    const windowRef = createFakeWindow({
      fetch: async (url, options = {}) => {
        requests.push({ url: String(url || ""), options });
        return {
          ok: true,
          status: 200,
          async text() {
            return buildUserscriptMeta("0.3.9");
          },
        };
      },
    });

    const now = 1_770_300_000_000;
    const status = await resolveLatestUpdateStatus({
      windowRef,
      installedVersion: "0.3.8",
      force: true,
      now,
    });

    assertEqual(status.available, true);
    assertEqual(status.remoteVersion, "0.3.9");
    assertEqual(requests.length, 1);
    assertEqual(getUrlWithoutQuery(requests[0].url), USERSCRIPT_UPDATE_URL);
    assertEqual(new URL(requests[0].url).searchParams.get(UPDATE_CACHE_BUST_PARAM), String(now));
    assertEqual(requests[0].options.cache, "no-store");
  });


  test("update check falls back from meta url to userscript url", async () => {
    const requests = [];
    const windowRef = createFakeWindow({
      fetch: async (url) => {
        requests.push(String(url || ""));
        if (requests.length === 1) {
          throw new Error("network down");
        }
        return {
          ok: true,
          status: 200,
          async text() {
            return buildUserscriptMeta("0.4.0");
          },
        };
      },
    });

    const now = 1_770_300_123_456;
    const status = await resolveLatestUpdateStatus({
      windowRef,
      installedVersion: "0.3.8",
      force: true,
      now,
    });

    assertEqual(status.available, true);
    assertEqual(status.remoteVersion, "0.4.0");
    assertEqual(status.sourceUrl, USERSCRIPT_DOWNLOAD_URL);
    assertEqual(requests.length, 2);
    assertEqual(getUrlWithoutQuery(requests[0]), USERSCRIPT_UPDATE_URL);
    assertEqual(getUrlWithoutQuery(requests[1]), USERSCRIPT_DOWNLOAD_URL);
  });


  test("update check reuses cached validator version on 304", async () => {
    const localStorage = createFakeStorage({
      [UPDATE_STATUS_STORAGE_KEY]: JSON.stringify({
        remoteVersion: "0.4.1",
        checkedAt: 0,
        sourceUrl: USERSCRIPT_UPDATE_URL,
        validators: {
          [USERSCRIPT_UPDATE_URL]: {
            remoteVersion: "0.4.1",
            etag: "\"etag-1\"",
            lastModified: "Mon, 01 Jan 2024 00:00:00 GMT",
          },
        },
      }),
    });
    const requests = [];
    const windowRef = createFakeWindow({
      localStorage,
      fetch: async (url, options = {}) => {
        requests.push({ url: String(url || ""), options });
        return {
          ok: false,
          status: 304,
          headers: createHeaders({
            etag: "\"etag-1\"",
            "last-modified": "Mon, 01 Jan 2024 00:00:00 GMT",
          }),
          async text() {
            return "";
          },
        };
      },
    });

    const status = await resolveLatestUpdateStatus({
      windowRef,
      installedVersion: "0.4.0",
      force: true,
      now: 1_770_301_000_000,
    });

    assertEqual(status.available, true);
    assertEqual(status.remoteVersion, "0.4.1");
    assertEqual(requests.length, 1);
    assertEqual(requests[0].options.headers["If-None-Match"], "\"etag-1\"");
    assertEqual(requests[0].options.headers["If-Modified-Since"], "Mon, 01 Jan 2024 00:00:00 GMT");
  });


  test("update check throttles repeated failed checks inside ttl", async () => {
    let callCount = 0;
    const windowRef = createFakeWindow({
      fetch: async () => {
        callCount += 1;
        throw new Error("network down");
      },
    });

    const firstNow = 1_770_302_000_000;
    const firstStatus = await resolveLatestUpdateStatus({
      windowRef,
      installedVersion: "0.3.8",
      force: true,
      now: firstNow,
    });
    const callsAfterFirstAttempt = callCount;
    const secondStatus = await resolveLatestUpdateStatus({
      windowRef,
      installedVersion: "0.3.8",
      force: false,
      now: firstNow + 10_000,
    });

    assertEqual(firstStatus.status, "error");
    assertEqual(secondStatus.checkedAt, firstNow);
    assertEqual(callCount, callsAfterFirstAttempt);
  });


  test("update actions support direct install and loader reload", () => {
    const directWindow = createFakeWindow();
    const loaderWindow = createFakeWindow({ loaderActive: true });
    const originalNow = Date.now;
    Date.now = () => 1_770_300_999_000;

    try {
      assertEqual(openUserscriptInstall(directWindow), true);
      assertEqual(reloadForLoaderUpdate(loaderWindow), true);
    } finally {
      Date.now = originalNow;
    }

    const installUrl = String(directWindow.__openedUrls[0] || "");
    assertEqual(getUrlWithoutQuery(installUrl), USERSCRIPT_DOWNLOAD_URL);
    assertEqual(new URL(installUrl).searchParams.get(UPDATE_CACHE_BUST_PARAM), "1770300999000");
    assertEqual(loaderWindow.location.reloadCalled, true);
    assertEqual(isLoaderRuntimeActive(loaderWindow), true);
  });
