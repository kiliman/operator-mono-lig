const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));

const xpath = require('xpath');
const { DOMParser, XMLSerializer } = require('xmldom');
const format = require('xml-formatter');
let fontName;

const regEx = /\.liga$/;
const regExBlankLines = /^(?=\n)$|^\s*/gm;
const regExWhitespace = /^\s+$/;
const NodeType = {};
NodeType.TEXT_NODE = 3;

async function main() {
  fontName = process.argv[2];

  const srcFileName = `./ligature_source/${fontName}.ttx`;

  console.log(`Reading file ${srcFileName}`);
  const xml = await fs.readFileAsync(srcFileName, 'utf-8');
  const dom = new DOMParser().parseFromString(xml);

  await extractAndWrite('charstrings', extractCharStrings, dom);
  await extractAndWrite('config', extractConfig, dom);
  await extractAndWrite('hmtx', extractHmtx, dom);
  await extractAndWrite('subrs', extractSubrs, dom);
  await extractAndWrite('gsubrs', extractGlobalSubrs, dom);

  console.log('Done');
}

async function extractAndWrite(name, func, dom) {
  const newDom = func(dom);
  console.log('Finished extracting ' + name);

  const folder = `./ligature/${fontName}`;
  const fileName = `./${folder}/${name}.xml`;
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }
  await fs.writeFileAsync(fileName, format(serialize(newDom)));
  console.log('Finished writing ' + name);
}

const serialize = dom =>
  new XMLSerializer().serializeToString(dom, false, node => {
    if (node.nodeType === NodeType.TEXT_NODE) {
      if (regExWhitespace.test(node.data)) return null;
      const data = node.data
        .split('\r\n')
        .filter(s => /\S+/.test(s))
        .map(s => s.replace(/^\s+/g, ''))
        .join('\n');

      return node.ownerDocument.createTextNode(data);
    }
    return node;
  });

const extractConfig = dom => {
  const newDom = new DOMParser().parseFromString('<ttFont/>');
  const head = xpath.select('/ttFont/head', dom, true);
  const hhea = xpath.select('/ttFont/hhea', dom, true);

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

const extractCmap = dom => {
  const newDom = new DOMParser().parseFromString('<cmap/>');
  const cmap = xpath.select('/ttFont/cmap/cmap_format_4', dom);

  cmap.forEach(node => {
    // for each cmap_format_4 node, need to copy map elements
    // create and append cmap_format_4 node
    const cmap4 = node.cloneNode(false);
    newDom.documentElement.appendChild(cmap4);

    xpath
      .select('map', node)
      .filter(child => regEx.test(child.getAttribute('name')))
      .forEach(child => cmap4.appendChild(child));
  });
  return newDom;
};

const extractClassDef = dom => {
  const newDom = new DOMParser().parseFromString('<GlyphClassDef/>');
  const classDefs = xpath.select('/ttFont/GDEF/GlyphClassDef/ClassDef', dom);

  classDefs
    .filter(node => regEx.test(node.getAttribute('glyph')))
    .forEach(node => newDom.documentElement.appendChild(node));

  return newDom;
};

const extractHmtx = dom => {
  const newDom = new DOMParser().parseFromString('<hmtx/>');
  const mtx = xpath.select('/ttFont/hmtx/mtx', dom);

  mtx
    .filter(node => regEx.test(node.getAttribute('name')))
    .forEach(node => newDom.documentElement.appendChild(node));

  return newDom;
};

const extractLookup = dom => {
  const newDom = new DOMParser().parseFromString('<LookupList/>');
  const lookup = xpath.select(
    '/ttFont/GSUB/LookupList/Lookup[@index="20"]',
    dom,
    true
  );

  newDom.documentElement.appendChild(lookup);

  return newDom;
};

const extractCharStrings = dom => {
  const newDom = new DOMParser().parseFromString('<CharStrings/>');
  const charStrings = xpath.select(
    '/ttFont/CFF/CFFFont/CharStrings/CharString',
    dom
  );

  charStrings
    .filter(node => regEx.test(node.getAttribute('name')))
    .forEach(node => newDom.documentElement.appendChild(node));

  return newDom;
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
