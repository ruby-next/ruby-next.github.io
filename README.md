# Ruby Next in browser

Play with Ruby Next right in the browser (powered by [ruby.wasm](https://github.com/ruby/ruby.wasm)).

## Development

### Prerequisites

- Install Rust toolchain:

  ```sh
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```

- Now you're ready to:

  ```sh
  bundle install
  ```

### Building ruby.wasm

Use the following command:

```sh
bundle exec rbwasm build -o src/ruby.wasm --ruby-version 3.3
```

This would build a JS-compatible WASM module. To build JS-free WASM module, use the `JS=false` env var.

### Testing

Using [wasmtime](https://github.com/bytecodealliance/wasmtime), you can verify the **JS-free** module like this:

```sh
wasmtime run --dir ./::/ src/ruby.wasm ruby-next.rb
```

### Running web version

First, install JS deps (`yarn install`).

Then, run a web server:

```sh
yarn dev
```

Go to [localhost:8000](http://localhost:8000) and see it in action!
