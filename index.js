const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));

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

  await processPatch('names', patchNames, dom);
  await processPatch('glyphs', patchGlyphs, dom);
  await processPatch('cmap', patchCmap, dom);
  await processPatch('classdef', patchClassDef, dom);
  await processPatch('hmtx', patchHmtx, dom);
  await processPatch('lookup', patchLookup, dom);
  await processPatch('charstrings', patchCharStrings, dom);

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
  const configDom = await loadConfigAsync('glyphs');
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

async function patchCmap(dom) {
  const configDom = await loadConfigAsync('cmap');
  const cmaps = xpath.select('/cmap/cmap_format_4', configDom);

  cmaps.forEach(node => {
    const platformId = node.getAttribute('platformID');
    const platEncId = node.getAttribute('platEncID');

    // search for cmap_format_4 in target dom
    const target = xpath.select(
      `/ttFont/cmap/cmap_format_4[@platformID="${platformId}" and @platEncID="${platEncId}"]`,
      dom,
      true
    );
    if (target) {
      // append all map elements to target cmap_format_4
      const maps = xpath.select('map', node);
      maps.forEach(child => target.appendChild(child));
    }
  });
}

async function patchClassDef(dom) {
  const configDom = await loadConfigAsync('classdef');
  const glyphClassDef = xpath.select('/ttFont/GDEF/GlyphClassDef', dom, true);

  const classDefs = xpath.select('/GlyphClassDef/ClassDefs', configDom);
  classDefs.forEach(node => glyphClassDef.appendChild(node));
}

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
  const configDom = await loadConfigAsync('lookup');
  const featureList = xpath.select('/ttFont/GSUB/FeatureList', dom, true);

  // look for feature with FeatureTag liga
  let featureRecord;
  let featureTag;
  let feature;
  let featureTags = xpath.select(
    '/ttFont/GSUB/FeatureList/FeatureRecord/FeatureTag[@value="liga"]',
    dom
  );

  if (featureTags.length) {
    featureTag = featureTags[0];
    featureRecord = featureTag.parentNode;
    feature = xpath.select('Feature', featureRecord, true);
  } else {
    // need to add feature to FeatureList
    const featuresCount = xpath.select(
      'count(/ttFont/GSUB/FeatureList/FeatureRecord)',
      dom,
      true
    );

    featureRecord = dom.createElement('FeatureRecord');
    featureRecord.setAttribute('index', featuresCount);
    featureTag = dom.createElement('FeatureTag');
    featureTag.setAttribute('value', 'liga');
    feature = dom.createElement('Feature');
    featureRecord.appendChild(featureTag);
    featureRecord.appendChild(feature);
    featureList.appendChild(featureRecord);
  }
  let lookupListIndex = xpath.select(
    'LookupListIndex[@value="20"]',
    feature,
    true
  );
  if (!lookupListIndex) {
    const count = xpath.select('count(LookupListIndex)', feature, true);
    lookupListIndex = dom.createElement('LookupListIndex');
    lookupListIndex.setAttribute('index', count);
    lookupListIndex.setAttribute('value', '20');
    feature.appendChild(lookupListIndex);
  }

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

  // nead to add feature  to ScriptList
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

  // finally add LigatureSubst to Lookup index=20
  const lookupList = xpath.select('/ttFont/GSUB/LookupList', dom, true);
  const newLookup = xpath.select('/LookupList/Lookup', configDom, true);

  let lookup = xpath.select(
    '/ttFont/GSUB/LookupList/Lookup[@index="20"]',
    dom,
    true
  );
  if (!lookup) {
    lookupList.appendChild(newLookup);
  } else {
    lookupList.replaceChild(newLookup, lookup);
  }
}

async function patchCharStrings(dom) {
  const configDom = await loadConfigAsync('charstrings');
  const nameDom = await loadConfigAsync('names');

  const cffFont = xpath.select('/ttFont/CFF/CFFFont', dom, true);

  cffFont.setAttribute('name', ligFontName);
  // get names from name config
  const fullName = nameDom.documentElement.getAttribute('fullName');
  const familyName = nameDom.documentElement.getAttribute('familyName');
  setAttribute(cffFont, 'FullName', 'value', fullName);
  setAttribute(cffFont, 'FamilyName', 'value', familyName);

  const targetCharStrings = xpath.select('CharStrings', cffFont, true);

  const charStrings = xpath.select('/CharStrings/CharString', configDom);
  charStrings.forEach(node => targetCharStrings.appendChild(node));
}

const setAttribute = (parent, path, name, value) => {
  var node = xpath.select(path, parent, true);
  node.setAttribute(name, value);
};

const copyConfigAttribute = (dom, configDom, path, name) => {
  const value = xpath.select(path, configDom, true).getAttribute(name);
  setAttribute(dom, path, name, value);
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
