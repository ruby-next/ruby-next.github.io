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

const CONFIG = `# Here you can define custom source rewriters.`;

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
      .addEventListener("click", () => {
        const result = this.transpile(this.codeEditor.getValue());

        this.previewEditor.setValue(result);
        this.showEditor("previewEditor");
      });

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

    this.setCurrentVersion();
  }

  transpile(code) {
    const result = this.vm
      .eval("RubyNext.transform(%q(" + code + "))")
      .toString();

    return result;
  }

  execute(source) {
    try {
      return this.vm.eval(source).toString();
    } catch (e) {
      console.error(e);
      return e.message;
    }
  }

  async setCurrentVersion() {
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
