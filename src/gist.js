const BASE_URL = "https://api.github.com/gists/";

export default async function importFromGist(gistUrl) {
  const id = gistUrl.split("/").pop();

  const url = `${BASE_URL}${id}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Gist ${id} not found`);
  }

  const data = await response.json();

  if (!data.files) {
    throw new Error(`Gist has no files`);
  }

  const config = data.files["config.rb"].content;
  const code = data.files["example.rb"].content;

  if (!config || !code) {
    throw new Error(`Gist must have example.rb and config.rb files`);
  }

  return { config, code, id };
}
