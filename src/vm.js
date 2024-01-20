import { DefaultRubyVM } from "@ruby/wasm-wasi/dist/browser";
import ruby from "./ruby.wasm";

export default async function initVM() {
  const module = await ruby();
  const { vm } = await DefaultRubyVM(module);

  vm.eval(`
    require "/bundle/setup"
    require "rubygems"
    # Make gem no-op
    define_singleton_method(:gem) { |*| nil }

    require "ruby-next/language"
    require "ruby-next/language/rewriters/edge"
    require "ruby-next/language/rewriters/proposed"
  `);

  return vm;
}
