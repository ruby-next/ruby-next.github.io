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
      .addEventListener("click", () => {
        const newSource = this.transpile(this.codeEditor.getValue());
        this.previewEditor.setValue(newSource);

        const result = this.execute(newSource);
        let output = window.$puts.flush();

        if (result) output += "\n\n> " + result;

        this.outputEditor.setValue(output);

        this.showEditor("outputEditor");
      });

    this.el.addEventListener("change", this.onSelectEditor);

    this.versionSelect = document.getElementById("versionSelect");

    if (theme === "dark") this.versionSelect.classList.add("sl-theme-dark");

    this.versionSelect.addEventListener("sl-change", this.invalidatePreview);

    this.setCurrentVMVersion();
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
        .eval("RubyNext.transform(%q(" + code + "), **" + rubyOptions + ")")
        .toString();

      return result;
    } catch (e) {
      console.error(e);
      return e.message;
    }
  }

  execute(source) {
    try {
      return this.vm.eval(source).toString();
    } catch (e) {
      console.error(e);
      return e.message;
    }
  }

  async setCurrentVMVersion() {
    const versionContainer = document.getElementById("currentVersion");
    if (!versionContainer) return;

    const version = this.execute("RUBY_VERSION + '-' + RUBY_PLATFORM");

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

  invalidatePreview() {
    const version = this.versionSelect.value;
    const newSource = this.transpile(this.codeEditor.getValue(), { version });
    this.previewEditor.setValue(newSource);

    this.showEditor("previewEditor");
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
    if (!e.target.value) return;

    this.showEditor(e.target.value);
  }
}
