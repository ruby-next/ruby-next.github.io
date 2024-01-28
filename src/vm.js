import { DefaultRubyVM } from "@ruby/wasm-wasi/dist/browser";
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

        source = Language.transform(code, **options)
        source += "\n # Transformed with RubyNext v#{RubyNext::VERSION} for Ruby #{version}"
      end
    end
  `);

  return vm;
}
