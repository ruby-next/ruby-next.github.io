import Store from "./store.js";
import importFromGist from "./gist.js";
import initVM from "./vm.js";

const DEFAULT_SOURCE = `# Welcome to Ruby Next playground!
# Here you can write Ruby code and see how it will be transformed by Ruby Next.
# You can also execute it and see the result.

greet = proc do
case it
  in hello: hello if hello =~ /human/i
    '🙂'
  in hello: 'martian'
    '👽'
  end
end

puts greet.call(hello: 'martian')
`;

const DEFAULT_PREVIEW = `# Here you will see the transpiled source code.`;

const CONFIG = `# Here you can define custom source rewriters.
# For example, you can add ":=" operator (if you miss C) as follows:
#
# RubyNext.define_text_rewriter "operator_assign" do
#   def safe_rewrite(source)
#     source.gsub(":=", "=")
#   end
# end
`;

const OUTPUT = "// Here will be the output of your program";

const THEMES = {
  light: "vs",
  dark: "vs-dark",
};

export default class App {
  constructor(el, vm, monaco) {
    this.el = el;
    this.vm = vm;
    this.monaco = monaco;

    this.onSelectEditor = this.onSelectEditor.bind(this);
    this.invalidatePreview = this.invalidatePreview.bind(this);
    this.openSavedExamples = this.openSavedExamples.bind(this);

    this.store = new Store();
  }

  bootstrap() {
    const theme = window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";

    this.monaco.editor.setTheme(THEMES[theme]);

    this.codeEditor = this.initEditor(
      this.el.querySelector("#codeEditor"),
      DEFAULT_SOURCE
    );

    this.configEditor = this.initEditor(
      this.el.querySelector("#configEditor"),
      CONFIG
    );

    this.previewEditor = this.initEditor(
      this.el.querySelector("#previewEditor"),
      DEFAULT_PREVIEW,
      {
        readOnly: true,
      }
    );

    this.outputEditor = this.initEditor(
      this.el.querySelector("#outputEditor"),
      OUTPUT,
      {
        readOnly: true,
        language: "shell",
        lineNumbers: "off",
      }
    );

    this.el
      .querySelector('[target="transpile-btn"]')
      .addEventListener("click", this.invalidatePreview);

    this.el
      .querySelector('[target="run-btn"]')
      .addEventListener("click", async () => {
        this.invalidatePreview(false);

        const source = this.previewEditor.getValue();

        let { result, output } = await this.executeWithOutput(source);

        if (result) output += "\n\n> " + result;

        this.outputEditor.setValue(output);

        this.showEditor("outputEditor");
      });

    this.autorunCb = document.getElementById("autorun");
    let refreshDebounceId;

    this.codeEditor.onDidChangeModelContent((ev) => {
      this._dirty = true;

      if (!this.autorunCb.checked) return;

      if (refreshDebounceId) {
        clearTimeout(refreshDebounceId);
      }

      refreshDebounceId = setTimeout(() => {
        this.refresh();
        refreshDebounceId = undefined;
      }, 500);
    });

    this.el.addEventListener("change", this.onSelectEditor);

    this.versionSelect = document.getElementById("versionSelect");

    this.versionSelect.addEventListener("sl-change", this.invalidatePreview);

    const saveDialog = document.getElementById("saveDialog");

    if (saveDialog) {
      this.el
        .querySelector('[target="save-btn"]')
        .addEventListener("click", () => saveDialog.show());

      saveDialog.addEventListener("submit", (e) => {
        e.preventDefault();

        const input = e.target.querySelector('[name="name"]');
        const name = input.value;
        const code = this.codeEditor.getValue();
        const config = this.configEditor.getValue();

        this.store.save(name, { code, config });

        input.value = "";
        saveDialog.hide();
      });
    }

    const openDialog = document.getElementById("openDialog");

    if (openDialog) {
      this.el
        .querySelector('[target="open-btn"]')
        .addEventListener("click", this.openSavedExamples);

      openDialog.addEventListener("click", (e) => {
        if (e.target.tagName !== "A") return;

        e.preventDefault();

        const key = e.target.dataset.key;

        const example = this.store.fetch(key);

        if (example) {
          const { code, config } = example;

          this.codeEditor.setValue(code);
          this.configEditor.setValue(config);
        }

        openDialog.hide();
      });
    }

    const importDialog = document.getElementById("importDialog");

    if (importDialog) {
      this.el
        .querySelector('[target="import-btn"]')
        .addEventListener("click", () => importDialog.show());

      importDialog.addEventListener("submit", (e) => {
        e.preventDefault();

        const input = e.target.querySelector('[name="gistId"]');
        const url = input.value;

        importDialog.hide();

        this.importGist(url);
      });

      importDialog.addEventListener("click", (e) => {
        if (e.target.tagName !== "A" || !e.target.dataset.url) return;

        e.preventDefault();

        const url = e.target.dataset.url;

        importDialog.hide();

        this.importGist(url);
      });
    }

    this.setCurrentVMVersion();

    if (theme === "dark")
      document.documentElement.classList.add("sl-theme-dark");

    this.loadExampleFromUrl();
  }

  async refresh() {
    let newSource;
    try {
      newSource = this.transpile(this.codeEditor.getValue(), { raise: true });
    } catch (e) {
      return;
    }

    this.previewEditor.setValue(newSource);

    let { result, output } = await this.executeWithOutput(newSource);

    if (result) output += "\n\n> " + result;

    this.outputEditor.setValue(output);
  }

  transpile(code, opts = {}) {
    let rubyOptions = "{";

    if (opts.version) {
      rubyOptions += `version: "${opts.version}"`;
    }

    rubyOptions += "}";

    try {
      // eval configuration
      // first, reset custom rewriters
      this.vm.eval("RubyNext.custom_rewriters.clear");
      this.vm.eval(this.configEditor.getValue());

      const result = this.vm
        .eval(`
code = <<~'RUBY'
${code}
RUBY

RubyNext.transform(code, **${rubyOptions})
        `)
        .toString();

      return result;
    } catch (e) {
      if (opts.raise) {
        throw e;
      }

      console.error(e);
      return e.message;
    }
  }

  async execute(source) {
    try {
      const vm = await initVM();
      return vm.eval(source).toString();
    } catch (e) {
      console.error(e);
      return e.message;
    }
  }

  async executeWithOutput(source) {
    try {
      const vm = await initVM();
      vm.$output.flush();
      const result = vm.eval(source).toString();
      const output = vm.$output.flush() || "";
      console.log(result, output);
      return { result, output };
    } catch (e) {
      console.error(e);
      return { output: "💥 " + e.message };
    }
  }

  async setCurrentVMVersion() {
    const versionContainer = document.getElementById("currentVersion");
    if (!versionContainer) return;

    const version = await this.execute("RUBY_VERSION + '-' + RUBY_PLATFORM");

    versionContainer.innerText = version;
  }

  initEditor(target, value, opts = {}) {
    return this.monaco.editor.create(target, {
      value,
      language: "ruby",
      automaticLayout: true,
      minimap: {
        enabled: false,
      },
      ...opts,
    });
  }

  invalidatePreview(showPreview = true) {
    const version = this.versionSelect.value;
    if (this._dirty || this._curVersion != version) {
      const newSource = this.transpile(this.codeEditor.getValue(), { version });
      this.previewEditor.setValue(newSource);
    }
    this._dirty = false;
    this._curVersion = version;

    if (showPreview) this.showEditor("previewEditor");
  }

  showEditor(editorName) {
    const editor = this.el.querySelector(`#${editorName}`);
    if (!editor) return;

    const containerId = editor.dataset.pane;
    if (!containerId) return;

    const container = this.el.querySelector(`#${containerId}`);
    if (!container) return;

    // Hide previous editor
    container
      .querySelector("[data-pane]:not(.hidden)")
      ?.classList.add("hidden");

    // Make sure the correct radio is checked
    const radio = container.querySelector(`input[value="${editorName}"]`);
    if (radio) radio.checked = true;

    // Show the editor
    editor.classList.remove("hidden");
  }

  onSelectEditor(e) {
    if (!e.target.value || !e.target.value.match(/Editor$/)) return;

    this.showEditor(e.target.value);
  }

  openSavedExamples() {
    const dialog = document.getElementById("openDialog");

    if (!dialog) return;

    const examples = this.store.all();

    const content = dialog.querySelector('[target="list"]');

    if (!examples.length) {
      content.innerHTML = `<p>No saved examples yet</p>`;
    } else {
      content.innerHTML = examples
        .map(
          (key) =>
            `<a class="text-blue-600 dark:text-blue-200 hover:text-blue-500 dark:hover:text-blue-100 cursor-pointer py-2 inline-block" href="#" data-key="${key}">${key}</a>`
        )
        .join("");
    }

    dialog.show();
  }

  async importGist(url) {
    try {
      const { id, code, config } = await importFromGist(url);

      this.codeEditor.setValue(code);
      this.configEditor.setValue(config);

      // Set URL fragment to include gist ID
      window.location.hash = `gist:${id}`;
    } catch (e) {
      alert(e.message);
    }
  }

  async loadExampleFromUrl() {
    if (!window.location.hash) return;

    const [type, id] = window.location.hash.slice(1).split(":");

    if (type !== "gist") return;

    await this.importGist(`https://gist.github.com/${id}`);
  }
}
