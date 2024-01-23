export default class Store {
  constructor(prefix = "next/v1") {
    this.prefix = prefix;
  }

  all() {
    const val = localStorage.getItem(`${this.prefix}/$all`);
    if (val) {
      return JSON.parse(val);
    } else {
      return [];
    }
  }

  fetch(key) {
    const val = localStorage.getItem(`${this.prefix}/${key}`);
    if (val) {
      return JSON.parse(val);
    } else {
      return null;
    }
  }

  save(key, value) {
    localStorage.setItem(`${this.prefix}/${key}`, JSON.stringify(value));

    const all = this.all();
    all.push(key);

    localStorage.setItem(`${this.prefix}/$all`, JSON.stringify(all));
  }
}
