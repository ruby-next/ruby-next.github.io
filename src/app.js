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

export default class App {
  constructor(el, vm, monaco) {
    this.el = el;
    this.vm = vm;
    this.monaco = monaco;
  }

  bootstrap() {
    this.currentEditor = this.initEditor(
      this.el.querySelector('[target="editor"]'),
      DEFAULT_SOURCE
    );

    this.previewEditor = this.initEditor(
      this.el.querySelector('[target="preview"]'),
      DEFAULT_PREVIEW,
      {
        readOnly: true,
      }
    );

    this.el
      .querySelector('[target="transpile-btn"]')
      .addEventListener("click", () => {
        const code = this.currentEditor.getValue();
        const result = this.vm
          .eval("RubyNext::Language.transform(%q(" + code + "), using: false)")
          .toString();

        this.previewEditor.setValue(result);
      });
  }

  initEditor(target, value, opts = {}) {
    return this.monaco.editor.create(target, {
      value,
      language: "ruby",
      theme: "vs-dark",
      automaticLayout: true,
      minimap: {
        enabled: false,
      },
      ...opts,
    });
  }
}
