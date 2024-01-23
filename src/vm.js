import { DefaultRubyVM } from "@ruby/wasm-wasi/dist/browser";
import { consolePrinter } from "@ruby/wasm-wasi";
import ruby from "./ruby.wasm";

export default async function initVM() {
  const module = await ruby();

  const output = [];
  const originalLog = console.log;
  window.$puts = function (val) {
    originalLog(val);
    output.push(val);
  };

  const { vm } = await DefaultRubyVM(module);

  window.$puts.flush = () => output.splice(0, output.length).join("\n");

  vm.eval(`
    require "/bundle/setup"
    require "rubygems"
    # Make gem no-op
    define_singleton_method(:gem) { |*| nil }

    require "js"

    module Kernel
      def puts(val)
        JS.eval("window.$puts('#{val.inspect}')")
        nil
      end

      def p(val)
        JS.eval("window.$puts('#{val}')")
        nil
      end
    end

    require "ruby-next/language"
    require "ruby-next/language/rewriters/edge"
    require "ruby-next/language/rewriters/proposed"

    module RubyNext
      def self.transform(code, version: RUBY_VERSION, using: false)
        options = {using:}
        options[:rewriters] = Language.rewriters.select { |rw| rw.unsupported_version?(version) }

        source = Language.transform(code, **options)
        source += "\n # Transformed with RubyNext v#{RubyNext::VERSION} for Ruby #{version}"
      end
    end
  `);

  return vm;
}
