import "./index.css";

console.log("Loading Ruby...");

import("./vm.js").then(async ({ default: initVM }) => {
  const vm = await initVM();
  console.log("Ruby VM initialized");

  document.getElementById("btn").removeAttribute("disabled");

  document.getElementById("btn").addEventListener("click", () => {
    const code = document.getElementById("editor").value;
    const result = vm
      .eval("RubyNext::Language.transform(%q(" + code + "), using: false)")
      .toString();

    document.getElementById("output").value = result;
  });
});
