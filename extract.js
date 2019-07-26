const fs = require('fs');
const os = require('os');
if (!os.EOL) {
  os.EOL = process.platform === 'win32' ? '\r\n' : '\n';
}
const xpath = require('xpath');
const { DOMParser, XMLSerializer } = require('xmldom');
const format = require('xml-formatter');
const hash = require('hash.js');

let fontName;

const NodeType = {};
NodeType.TEXT_NODE = 3;

function main() {
  fontName = process.argv[2];

  const glyphsRegEx = getGlyphsRegEx('./ligature_source/glyphs');
  const srcFileName = `./ligature_source/${fontName}.ttx`;

  const folder = `./ligature/${fontName}`;
  const fileName = `./${folder}/names.json`;
  if (!fs.existsSync(fileName)) {
    return 0;
  }

  console.log(`Reading file ${srcFileName}`);
  const xml = fs.readFileSync(srcFileName, 'utf-8');
  const dom = new DOMParser().parseFromString(xml);

  extractAndWrite('config', extractConfig, dom);

  extractCharStrings(dom, glyphsRegEx);

  extractAndWrite('subrs', extractSubrs, dom);
  extractAndWrite('gsubrs', extractGlobalSubrs, dom);

  console.log('Done');
}

function getGlyphsRegEx(path) {
  const glyphs = fs.readFileSync(path, 'utf-8');
  const patterns = ['LIG'];

  glyphs
    .split(os.EOL)
    .filter(line => line.length > 0)
    .forEach(line => {
      const pattern = line
        .replace(/\s*#.*/, '')
        .replace(/[.]/g, '\\.')
        .replace(/[*]/g, '.*');
      if (pattern.length) {
        patterns.push(pattern);
      }
    });
  return new RegExp(`^(${patterns.join('|')})$`);
}

function extractAndWrite(name, func, dom) {
  const newDom = func(dom);
  console.log('Finished extracting ' + name);

  const folder = `./ligature/${fontName}`;
  const fileName = `./${folder}/${name}.xml`;
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }
  fs.writeFileSync(fileName, format(serialize(newDom)));
  console.log('Finished writing ' + name);
}
//const dump = dom => console.log(serialize(dom));
const serialize = dom => new XMLSerializer().serializeToString(dom);

const extractConfig = dom => {
  const newDom = new DOMParser().parseFromString('<ttFont/>');
  const head = xpath.select('/ttFont/head', dom, true);
  const hhea = xpath.select('/ttFont/hhea', dom, true);

  // remove elements that change after each save
  // but we don't care about
  head.removeChild(xpath.select('checkSumAdjustment', head, true));
  head.removeChild(xpath.select('created', head, true));
  head.removeChild(xpath.select('modified', head, true));

  const bbox = extractFromPath('/ttFont/CFF/CFFFont/FontBBox', dom);
  const widthX = extractFromPath(
    '/ttFont/CFF/CFFFont/Private/nominalWidthX',
    dom
  );
  newDom.documentElement.appendChild(head);
  newDom.documentElement.appendChild(hhea);
  newDom.documentElement.appendChild(bbox);
  newDom.documentElement.appendChild(widthX);
  return newDom;
};

const extractFromPath = (path, dom) => {
  const parentPath = path.substring(0, path.lastIndexOf('/'));
  const childPath = parentPath.substring(path.indexOf('/', 1));
  const elements = parentPath.split('/').slice(2);
  let xml = '';
  elements.forEach(e => (xml += `<${e}>`));
  elements.reverse().forEach(e => (xml += `</${e}>`));

  const newDom = new DOMParser().parseFromString(xml);
  const node = xpath.select(path, dom, true);
  const parentNode = xpath.select(childPath, newDom, true);
  parentNode.appendChild(node);
  return newDom.documentElement;
};

const extractCharStrings = (dom, glyphsRegEx) => {
  const charStrings = xpath.select(
    '/ttFont/CFF/CFFFont/CharStrings/CharString',
    dom
  );

  charStrings
    .filter(node => glyphsRegEx.test(node.getAttribute('name')))
    .forEach(node => writeGlyphData(dom, node));
  console.log('Finished writing charstrings');
};

const writeGlyphData = (dom, node) => {
  const newDom = new DOMParser().parseFromString('<Glyph/>').documentElement;
  const name = node.getAttribute('name');
  newDom.setAttribute('name', name);

  // get map and set code
  const map = xpath.select(
    `/ttFont/cmap/cmap_format_4/map[@name="${name}"]`,
    dom,
    true
  );
  if (map) {
    newDom.setAttribute('code', map.getAttribute('code'));
  }

  // get mtx
  const mtx = xpath.select(`/ttFont/hmtx/mtx[@name="${name}"]`, dom, true);
  newDom.setAttribute('lsb', mtx.getAttribute('lsb'));
  newDom.setAttribute('width', mtx.getAttribute('width'));

  const charStringDom = dom.createElement('CharString');

  const subrsDom = dom.createElement('Subrs');
  const gsubrsDom = dom.createElement('GlobalSubrs');
  newDom.appendChild(charStringDom);
  newDom.appendChild(subrsDom);
  newDom.appendChild(gsubrsDom);

  const subrs = {
    map: [],
    fingerprints: [],
    sourcePath: '/ttFont/CFF/CFFFont/Private/Subrs',
    target: subrsDom
  };
  const gsubrs = {
    map: [],
    fingerprints: [],
    sourcePath: '/ttFont/CFF/GlobalSubrs',
    target: gsubrsDom
  };

  extractCharStringSubrs(dom, node, subrs, gsubrs, 8);

  const outline = indentTextContent(node.childNodes[0].textContent, 8);
  charStringDom.appendChild(dom.createTextNode(outline));

  const folder = `./ligature/${fontName}/glyphs`;
  const fileName = `./${folder}/${name}.xml`;
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }
  fs.writeFileSync(fileName, format(serialize(newDom)));
  console.log('* ' + name);
};

const extractCharStringSubrs = (dom, node, subrs, gsubrs, indent) => {
  // check for callsubr/callgsubr

  const lines = node.childNodes[0].textContent.split(os.EOL);
  const newLines = [];
  let fingerprint = '';

  lines.forEach(line => {
    if (line.trim().length === 0) return;
    const matches = line.match(/(.*?)(-?\d+) (callsubr|callgsubr)$/);
    if (matches != null) {
      const { map, fingerprints, sourcePath, target } =
        matches[3] === 'callsubr' ? subrs : gsubrs;
      const index = matches[2];
      const srcIndex = parseInt(index) + 107;
      let newIndex = map[srcIndex];

      if (!newIndex) {
        // find subr in source dom and copy to target dom
        const srcSubr = xpath.select(
          `/${sourcePath}/CharString[@index="${srcIndex}"]`,
          dom,
          true
        );

        // append subr to target dom and get new index
        newIndex = xpath.select('count(CharString)', target, true);
        map[srcIndex] = newIndex;

        const clone = srcSubr.cloneNode(true);
        clone.setAttribute('index', newIndex);
        target.appendChild(clone);

        // patch up source in case it also has any callsubrs
        fingerprint = extractCharStringSubrs(dom, clone, subrs, gsubrs, 12);
        fingerprints[newIndex] = fingerprint;
      } else {
        fingerprint = fingerprints[newIndex];
      }

      // rewrite line with fingerprint
      line = `${matches[1]}{${fingerprint}} ${matches[3]}`;
    }
    newLines.push(line.trim());
  });
  const content = newLines.join('\n');
  fingerprint = hash
    .sha256()
    .update(content)
    .digest('hex')
    .substr(0, 8);
  node.setAttribute('fingerprint', fingerprint);

  node.childNodes[0].textContent = indentTextContent(content, indent);
  return fingerprint;
};

const indentTextContent = (text, indent) => {
  return text
    .split('\n')
    .map(line => ' '.repeat(indent) + line.trim())
    .join('\n')
    .trim();
};

const extractSubrs = dom => {
  const subrs = xpath.select('/ttFont/CFF/CFFFont/Private/Subrs', dom, true);
  return subrs;
};

const extractGlobalSubrs = dom => {
  const subrs = xpath.select('/ttFont/CFF/GlobalSubrs', dom, true);
  return subrs;
};

main();
