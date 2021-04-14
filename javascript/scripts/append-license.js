const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(path.join(__dirname, '../'));
const EXTNAMES = ['.ts', '.js', '.html', '.css'];
const EXCLUDE = ['node_modules', 'dist'];
const SEARCH_TEXT = 'Copyright (c)';

function getLicense() {
  return `
`;
}

function getCommentedText(text, ext) {
  if (ext === '.html') {
    return `<!--${text}-->\n\n`;
  } else if (ext === '.css') {
    return `/*${text}*/\n\n`;
  } else if (ext === '.ts' || ext === '.js') {
    const splitedText = text.split('\n');

    return splitedText.map((line, index) => {
      if (index === 0) {
        return '/**';
      } else if (index === splitedText.length - 1) {
        return ' */';
      }

      return ` * ${line}`.trimRight();
    }).join('\n') + '\n\n';
  }

  return text;
}

function findFiles(directory, filepaths = []) {
  const files = fs.readdirSync(directory);
  for (let filename of files) {
      const filepath = path.join(directory, filename);
      if (fs.statSync(filepath).isDirectory() && !EXCLUDE.includes(filename)) {
          findFiles(filepath, filepaths);
      } else if (EXTNAMES.includes(path.extname(filename))) {
        filepaths.push(filepath);
      }
  }
  return filepaths;
}

function prepend(filepath, text) {
  const data = fs.readFileSync(filepath);
  const fd = fs.openSync(filepath, 'w+');
  const insert = new Buffer.from(text);
  fs.writeSync(fd, insert, 0, insert.length, 0);
  fs.writeSync(fd, data, 0, data.length, insert.length);
  fs.close(fd, (err) => {
    if (err) throw err;
  });
}

console.info(" > Checking misseed license prephaces... ");

const files = findFiles(ROOT);
let fixed = 0;

for (let filepath of files) {
  const data = fs.readFileSync(filepath);

  if (!data.includes(SEARCH_TEXT)) {
    const filename = path.basename(filepath);
    let license = getLicense();
    license = getCommentedText(license, path.extname(filename));

    prepend(filepath, license);

    console.info("     Add license prephace to", "\033[1;96m", filepath, "\033[0;0m");
    fixed++;
  }
}

if (fixed === 0) {
  console.info("   ...\033[1;32m", "ALL OK", "\033[0;0m");
  process.exit(0);
} else {
  console.error("   ...\033[1;31m", `${fixed}`, "\033[0;0m fixed");
  process.exit(1);
}
