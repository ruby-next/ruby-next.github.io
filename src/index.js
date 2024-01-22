import App from "./app.js";

const loaderDone = (name) => {
  const el = document.getElementById(`loader-${name}`);
  if (!el) return;

  el.querySelector('[data-icon="loading"]').classList.add("hidden");
  el.querySelector('[data-icon="check"]').classList.remove("hidden");
};

const loaderError = (name) => {
  const el = document.getElementById(`loader-${name}`);
  if (!el) return;

  el.querySelector('[data-icon="loading"]').classList.add("hidden");
  el.querySelector('[data-icon="error"]').classList.remove("hidden");
};

await Promise.all([
  import("./editor.js")
    .then(({ default: monaco }) => {
      loaderDone("editor");
      return monaco;
    })
    .catch((e) => {
      loaderError("editor");
      throw e;
    }),
  import("./vm.js")
    .then(async ({ default: initVM }) => {
      const vm = await initVM();
      loaderDone("ruby");
      return vm;
    })
    .catch((e) => {
      loaderError("ruby");
      throw e;
    }),
])
  .then(async ([monaco, vm]) => {
    // Add a bit of delay to make sure loading animation is visible
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Hide loader
    document.getElementById("loader").classList.add("hidden");

    const appNode = document.getElementById("app");

    // Show main app
    appNode.classList.remove("hidden");
    const app = new App(appNode, vm, monaco);
    app.bootstrap();
  })
  .catch((e) => {
    console.error(e);
  });
