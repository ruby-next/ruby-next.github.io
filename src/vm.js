import { RubyVM } from "@ruby/wasm-wasi";
import {
  File,
  WASI,
  OpenFile,
  ConsoleStdout,
} from "@bjorn3/browser_wasi_shim";

import ruby from "./ruby.wasm";

let rubyModule;

export default async function initVM() {
  if (!rubyModule) rubyModule = await ruby();

  const module = rubyModule;

  const output = [];
  output.flush = function () {
    return this.splice(0, this.length).join("\n");
  };

  const setStdout = function (val) {
    console.log(val);
    output.push(val);
  };

  const setStderr = function (val) {
    console.warn(val);
    output.push(`[warn] ${val}`);
  };

  const fds = [
    new OpenFile(new File([])),
    ConsoleStdout.lineBuffered(setStdout),
    ConsoleStdout.lineBuffered(setStderr),
  ];
  const wasi = new WASI([], ["RUBYOPT=-EUTF-8 -W0", "NO_COLOR=1"], fds, { debug: false });
  const { vm, instance } = await RubyVM.instantiateModule({
    module, wasip1: wasi
  });

  wasi.initialize(instance);
  vm.initialize();
  vm.$output = output;

  vm.eval(`
    require "/bundle/setup"
    require "rubygems"

    require "js"

    require "ruby-next/language"
    require "ruby-next/language/rewriters/edge"
    require "ruby-next/language/rewriters/proposed"

    module RubyNext
      class << self
        attr_accessor :custom_rewriters
      end

      self.custom_rewriters = []

      def self.define_text_rewriter(name, &block)
        Class.new(RubyNext::Language::Rewriters::Text, &block).tap do |rw|
          rw.const_set(:NAME, name)
          rw.const_set(:MIN_SUPPORTED_VERSION, Gem::Version.new(RubyNext::NEXT_VERSION))
          custom_rewriters << rw
        end
      end

      def self.transform(code, version: RUBY_VERSION, using: false)
        options = {using:}
        options[:rewriters] = Language.rewriters.select { |rw| rw.unsupported_version?(version) } + custom_rewriters

        start = Time.now
        source = Language.transform(code, **options)
        time = Time.now - start
        source += "\n # Transformed with RubyNext v#{RubyNext::VERSION} for Ruby #{version} (took #{time}s)"
      end
    end
  `);

  return vm;
}
