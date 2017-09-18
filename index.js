const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const os = require('os');
if (!os.EOL) {
  os.EOL = process.platform === 'win32' ? '\r\n' : '\n';
}

const xpath = require('xpath');
const { DOMParser, XMLSerializer } = require('xmldom');
const format = require('xml-formatter');
let fontName;
let ligFontName;

const regEx = /\.liga$/;
const regExBlankLines = /^(?=\n)$|^\s*/gm;
const regExWhitespace = /^\s+$/;
const NodeType = {};
NodeType.TEXT_NODE = 3;

async function main() {
  fontName = process.argv[2];
  ligFontName = fontName.split('-').join('Lig-');

  const srcFileName = `./original/${fontName}.ttx`;
  const dstFileName = `./build/${ligFontName}.ttx`;
  console.log(`Reading original font file ${srcFileName}`);
  const xml = await fs.readFileAsync(srcFileName, 'utf-8');
  const dom = new DOMParser().parseFromString(xml);

  try {
    await processPatch('names', patchNames, dom);
    await processPatch('glyphs', patchGlyphs, dom);
    await processPatch('gpos', patchGpos, dom);
    await processPatch('gsub', patchGsub, dom);
    await processPatch('hmtx', patchHmtx, dom);
    //await processPatch('lookup', patchLookup, dom);
    await processPatch('charstrings', patchCharStrings, dom);
  } catch (err) {
    console.log(err);
  }

  console.log(`Writing ligature font file ${dstFileName}`);
  await fs.writeFileAsync(dstFileName, format(serialize(dom)));
  console.log('Done');
}

async function loadConfigAsync(name) {
  const fileName = `./ligature/${ligFontName}/${name}.xml`;
  const xml = await fs.readFileAsync(fileName, 'utf-8');
  return new DOMParser().parseFromString(xml);
}

async function processPatch(name, patchFunc, dom) {
  console.log(`Patching ${name}`);
  await patchFunc(dom);
}

async function patchNames(dom) {
  const configDom = await loadConfigAsync('names');

  const names = xpath.select('/name/namerecord', configDom);
  const targetName = xpath.select('/ttFont/name', dom, true);

  // get font and family name
  const familyName = getTextNode(
    configDom,
    '/name/namerecord[@nameID="1" and @platformID="1"]'
  );
  const fullName = getTextNode(
    configDom,
    '/name/namerecord[@nameID="4" and @platformID="1"]'
  );

  // patch CFFFont
  const cffFont = xpath.select('/ttFont/CFF/CFFFont', dom, true);

  cffFont.setAttribute('name', ligFontName);
  setAttribute(cffFont, 'FullName', 'value', fullName);
  setAttribute(cffFont, 'FamilyName', 'value', familyName);

  // update existing names with new names
  names.forEach(node => {
    const nameId = node.getAttribute('nameID');
    const platformId = node.getAttribute('platformID');

    // search for namerecord in target dom and replace with this one or append node
    const target = xpath.select(
      `/ttFont/name/namerecord[@nameID="${nameId}" and @platformID="${platformId}"]`,
      dom,
      true
    );
    if (target) {
      target.parentNode.replaceChild(node, target);
    } else {
      targetName.appendChild(node);
    }
  });
}

async function patchGlyphs(dom) {
  const configDom = await loadConfigAsync('../glyphs');
  // get number of glyphs in target dom
  const targetGlyphs = xpath.select('/ttFont/GlyphOrder', dom, true);
  const glyphsCount = xpath.select('count(GlyphID)', targetGlyphs, true);

  let n = glyphsCount;
  // get ligature glyphs
  const glyphs = xpath.select('/GlyphOrder/GlyphID', configDom);
  glyphs.forEach(node => {
    node.setAttribute('id', n++);
    targetGlyphs.appendChild(node);
  });

  // update glyph count
  setAttribute(dom, '/ttFont/maxp/numGlyphs', 'value', n);
}

async function patchGpos(dom) {
  const newGpos = await loadConfigAsync('gpos');
  const oldGpos = xpath.select('/ttFont/GPOS', dom, true);
  dom.documentElement.replaceChild(newGpos, oldGpos);
}

async function patchGsub(dom) {
  const newGsub = await loadConfigAsync('gsub');

  // loop through Substituion/Ligature nodes and remap chars
  remap(newGsub, dom, '//Substitution', 'out');
  remap(newGsub, dom, '//Ligature', 'glyph');

  const oldGsub = xpath.select('/ttFont/GSUB', dom, true);
  dom.documentElement.replaceChild(newGsub, oldGsub);
}

const remap = (patchDom, cmapDom, path, attr) => {
  const cmap = [];
  let nodes = xpath.select(path, patchDom);
  nodes.forEach(n => {
    const out = n.getAttribute(attr);
    if (out.startsWith('uni')) {
      // get cmap entry
      const code = '0x' + out.replace(/uni0*/g, '').toLowerCase();
      let name = cmap[code];
      if (!name) {
        const map = xpath.select(
          `/ttFont/cmap/cmap_format_4/map[@code="${code}"]`,
          cmapDom,
          true
        );
        name = map == null ? out : map.getAttribute('name');
        cmap[code] = name;
      }
      n.setAttribute(attr, name);
    }
  });
};

async function patchHmtx(dom) {
  const hmtxDom = await loadConfigAsync('hmtx');
  const targetHmtx = xpath.select('/ttFont/hmtx', dom, true);

  const mtx = xpath.select('/hmtx/mtx', hmtxDom);
  mtx.forEach(node => targetHmtx.appendChild(node));

  const mtxCount = xpath.select('count(/ttFont/hmtx/mtx)', dom, true);
  setAttribute(dom, '/ttFont/hhea/numberOfHMetrics', 'value', mtxCount);

  const configDom = await loadConfigAsync('config');
  copyConfigAttribute(dom, configDom, '/ttFont/head/xMin', 'value');
  copyConfigAttribute(dom, configDom, '/ttFont/head/yMin', 'value');
  copyConfigAttribute(dom, configDom, '/ttFont/head/xMax', 'value');
  copyConfigAttribute(dom, configDom, '/ttFont/head/yMax', 'value');
  copyConfigAttribute(dom, configDom, '/ttFont/hhea/advanceWidthMax', 'value');
  copyConfigAttribute(dom, configDom, '/ttFont/hhea/xMaxExtent', 'value');
  copyConfigAttribute(dom, configDom, '/ttFont/CFF/CFFFont/FontBBox', 'value');
  copyConfigAttribute(
    dom,
    configDom,
    '/ttFont/CFF/CFFFont/Private/nominalWidthX',
    'value'
  );
}

async function patchLookup(dom) {
  const configDom = await loadConfigAsync('../lookup');
  const featureList = xpath.select('/ttFont/GSUB/FeatureList', dom, true);

  const featuresCount = xpath.select(
    'count(/ttFont/GSUB/FeatureList/FeatureRecord)',
    dom,
    true
  );
  const featureRecord = dom.createElement('FeatureRecord');
  featureRecord.setAttribute('index', featuresCount);
  const featureTag = dom.createElement('FeatureTag');
  featureTag.setAttribute('value', 'liga');
  const feature = dom.createElement('Feature');
  featureRecord.appendChild(featureTag);
  featureRecord.appendChild(feature);
  featureList.appendChild(featureRecord);

  const lookupCount = xpath.select(
    'count(/ttFont/GSUB/LookupList/Lookup)',
    dom,
    true
  );
  const lookupListIndex = dom.createElement('LookupListIndex');
  lookupListIndex.setAttribute('index', '0');
  lookupListIndex.setAttribute('value', lookupCount);
  feature.appendChild(lookupListIndex);

  // helper function for adding feature to ScriptRecord
  const addFeature = (scriptRecord, featureRecord, lang) => {
    if (!lang) return;
    const index = featureRecord.getAttribute('index');
    if (xpath.select(`FeatureIndex[@value="${index}"]`, lang, true)) return;

    const count = xpath.select('count(FeatureIndex)', lang, true);
    const featureIndex = dom.createElement('FeatureIndex');
    featureIndex.setAttribute('index', count);
    featureIndex.setAttribute('value', index);
    lang.appendChild(featureIndex);
  };

  // nead to add feature to ScriptList
  const scriptList = xpath.select('/ttFont/GSUB/ScriptList', dom, true);
  const scriptRecords = xpath.select('ScriptRecord', scriptList);
  scriptRecords.forEach(node => {
    // check for feature in DefaultLangSys
    addFeature(
      node,
      featureRecord,
      xpath.select('Script/DefaultLangSys', node, true)
    );
    // add features to any other languages
    xpath
      .select('Script/LangSysRecord/LangSys', node)
      .forEach(lang => addFeature(node, featureRecord, lang));
  });

  // finally add LigatureSubst to Lookup
  const lookupList = xpath.select('/ttFont/GSUB/LookupList', dom, true);
  const newLookup = xpath.select('/LookupList/Lookup', configDom, true);
  newLookup.setAttribute('index', lookupCount);
  lookupList.appendChild(newLookup);
}

async function patchCharStrings(dom) {
  const configDom = await loadConfigAsync('charstrings');
  const nameDom = await loadConfigAsync('names');

  // get font and family name
  const familyName = getTextNode(
    nameDom,
    '/name/namerecord[@nameID="1" and @platformID="1"]'
  );
  const fullName = getTextNode(
    nameDom,
    '/name/namerecord[@nameID="4" and @platformID="1"]'
  );

  // patch CFFFont
  const cffFont = xpath.select('/ttFont/CFF/CFFFont', dom, true);

  cffFont.setAttribute('name', ligFontName);
  setAttribute(cffFont, 'FullName', 'value', fullName);
  setAttribute(cffFont, 'FamilyName', 'value', familyName);

  const charStrings = xpath.select('/CharStrings/CharString', configDom);
  const targetCharStrings = xpath.select('CharStrings', cffFont, true);

  const subrs = {
    map: [],
    source: await loadConfigAsync('subrs'),
    target: xpath.select('/ttFont/CFF/CFFFont/Private/Subrs', dom, true)
  };
  const gsubrs = {
    map: [],
    source: await loadConfigAsync('gsubrs'),
    target: xpath.select('/ttFont/CFF/GlobalSubrs', dom, true)
  };

  charStrings.forEach(node => {
    patchCharStringSubrs(node, subrs, gsubrs);
    targetCharStrings.appendChild(node);
  });
}

const patchCharStringSubrs = (node, subrs, gsubrs) => {
  // check for callsubr/callgsubr

  const lines = node.childNodes[0].textContent.split(os.EOL);
  const newLines = [];
  let patched = false;
  lines.forEach(line => {
    const matches = line.match(/(.*?)(-?\d+) (callsubr|callgsubr)$/);
    if (matches != null) {
      const { map, source, target } =
        matches[3] === 'callsubr' ? subrs : gsubrs;
      const index = matches[2];
      let newIndex = 0;
      if (!map[index]) {
        // find subr in source dom and copy to target dom
        const srcIndex = parseInt(index) + 107;
        const srcSubr = xpath.select(
          `//CharString[@index="${srcIndex}"]`,
          source,
          true
        );

        // patch up source in case it also has any callsubrs
        patchCharStringSubrs(srcSubr, subrs, gsubrs);

        // append subr to target dom and get new index
        newIndex = xpath.select('count(CharString)', target, true);
        srcSubr.setAttribute('index', newIndex);
        target.appendChild(srcSubr);

        // add new index to map and rewrite call
        newIndex = newIndex - 107;
        map[index] = newIndex;
      } else {
        newIndex = map[index];
      }

      // rewrite line with new subr index
      line = `${matches[1]}${newIndex} ${matches[3]}`;
      patched = true;
    }
    newLines.push(line);
  });
  if (patched) {
    node.childNodes[0].textContent = newLines.join(os.EOL);
  }
};

const setAttribute = (parent, path, name, value) => {
  var node = xpath.select(path, parent, true);
  node.setAttribute(name, value);
};

const copyConfigAttribute = (dom, configDom, path, name) => {
  const value = xpath.select(path, configDom, true).getAttribute(name);
  setAttribute(dom, path, name, value);
};

const getTextNode = (dom, path) => {
  var node = xpath.select(path, dom, true);
  return node && node.childNodes.length
    ? node.childNodes[0].nodeValue.trim()
    : '';
};

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

main();
