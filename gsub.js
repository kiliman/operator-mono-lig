const xpath = require('xpath');
//const { XMLSerializer } = require('xmldom');
//const format = require('xml-formatter');
const NodeType = {};
NodeType.TEXT_NODE = 3;

let dom;
let gsubDom;
let scriptListDom;
let featureListDom;
let lookupListDom;
let featureDom;
let lookupIndex = 0;
let chainIndex = 0;
const substLookupMap = {};

const buildGsubTables = (_dom, ligature) => {
  const glyphs = ligature.name.replace(/\.liga$/, '').split('_');

  dom = _dom;
  gsubDom = xpath.select('ttFont/GSUB', dom, true);

  // look for 'calt' feature
  featureListDom = xpath.select('FeatureList', gsubDom, true);

  let featureRecord;
  const featureTag = xpath.select(
    'FeatureRecord/FeatureTag[@value="calt"]',
    featureListDom,
    true
  );
  if (!featureTag) {
    const featureListCount = xpath.select(
      'count(FeatureRecord)',
      featureListDom,
      true
    );
    featureRecord = createElementWithAttributes('FeatureRecord', {
      index: featureListCount
    });
    featureRecord.appendChild(
      createElementWithAttributes('FeatureTag', { value: 'calt' })
    );
    featureRecord.appendChild(dom.createElement('Feature'));
    featureListDom.appendChild(featureRecord);
  } else {
    featureRecord = featureTag.parentNode;
  }
  featureDom = xpath.select('Feature', featureRecord, true);

  const featureIndex = featureRecord.getAttribute('index');

  // add feature to scriptlist for DFLT and latn if not present
  addFeatureToScriptList('DFLT', featureIndex);
  addFeatureToScriptList('latn', featureIndex);

  lookupListDom = xpath.select('LookupList', gsubDom, true);
  lookupIndex = xpath.select('count(Lookup)', lookupListDom, true);

  const lookupDom = createElementWithAttributes('Lookup', {
    index: lookupIndex++
  });
  appendChildren(
    lookupDom,
    createElementWithAttributes('LookupType', { value: 6 }),
    createElementWithAttributes('LookupFlag', { value: 0 })
  );

  lookupListDom.appendChild(lookupDom);

  // add contextual lookup to feature
  const featureLookupCount = xpath.select(
    'count(LookupListIndex)',
    featureDom,
    true
  );
  featureDom.appendChild(
    createElementWithAttributes('LookupListIndex', {
      index: featureLookupCount,
      value: lookupDom.getAttribute('index')
    })
  );

  lookupDom.appendChild(buildBacktrackFirst(glyphs));
  lookupDom.appendChild(buildLookAheadLast(glyphs));
  lookupDom.appendChild(buildLigatureSubst(glyphs, ligature.glyph));
  // remaining context
  for (let n = glyphs.length - 2; n >= 0; n--) {
    lookupDom.appendChild(
      buildChainContext(getLIGs(n), [glyphs[n]], glyphs.slice(n + 1), 'LIG')
    );
  }
};

const finalizeGsubTables = () => {
  // get current LookupList count
  let newIndex = xpath.select('count(Lookup)', lookupListDom, true);

  // append added lookups
  Object.entries(substLookupMap).forEach(lookupEntry => {
    // fixup existing lookups with new index
    const lookup = lookupEntry[1];
    const oldIndex = lookup.getAttribute('index');
    const substLookups = xpath.select(
      `//ChainContextSubst/SubstLookupRecord/LookupListIndex[@value="${oldIndex}"]`,
      lookupListDom,
      false
    );
    substLookups.forEach(substLookup => {
      substLookup.setAttribute('value', newIndex);
    });
    lookup.setAttribute('index', newIndex++);
    lookupListDom.appendChild(lookup);
    lookupListDom.appendChild(lookup);
  });
};

//const dump = dom => console.log(format(serialize(dom)));

const addFeatureToScriptList = (tag, featureIndex) => {
  scriptListDom = xpath.select('ScriptList', gsubDom, true);
  const defaultLangSys = xpath.select(
    `ScriptRecord/ScriptTag[@value="${tag}"]/../Script/DefaultLangSys`,
    scriptListDom,
    true
  );
  const featureIndexNode = xpath.select(
    `FeatureIndex[@value=${featureIndex}]`,
    defaultLangSys,
    true
  );
  if (!featureIndexNode) {
    const count = xpath.select('count(FeatureIndex)', defaultLangSys, true);
    defaultLangSys.appendChild(
      createElementWithAttributes('FeatureIndex', {
        index: count,
        value: featureIndex
      })
    );
  }
};

const buildBacktrackFirst = glyphs => {
  // backtrack = first glyph
  // input = first glphy
  // lookAhead = [1..n]
  return buildChainContext([glyphs[0]], [glyphs[0]], glyphs.slice(1));
};

const buildLookAheadLast = glyphs => {
  // backtrack = none
  // input = first glyph
  // lookAhead = [1..n] + [n]
  return buildChainContext(
    [],
    [glyphs[0]],
    [...glyphs.slice(1), glyphs.slice(-1)]
  );
};

const buildLigatureSubst = (glyphs, lookup) => {
  // backtrack = LIG * n-1
  // input = last glyph
  // lookAhead = none
  return buildChainContext(
    getLIGs(glyphs.length - 1),
    glyphs.slice(-1),
    [],
    lookup
  );
};

const getLIGs = length => new Array(length).fill('LIG', 0, length);

const buildChainContext = (backtrack, input, lookAhead, substitute) => {
  const chainDom = createElementWithAttributes('ChainContextSubst', {
    index: chainIndex++,
    Format: 3
  });

  buildCoverage(chainDom, 'BacktrackCoverage', backtrack);
  buildCoverage(chainDom, 'InputCoverage', input);
  buildCoverage(chainDom, 'LookAheadCoverage', lookAhead);

  if (substitute) {
    const lookup = getSubstLookup(input[0], substitute);
    const listIndex = lookup.getAttribute('index');
    const substLookupRecordDom = chainDom.appendChild(
      createElementWithAttributes('SubstLookupRecord', { index: 0 })
    );
    appendChildren(
      substLookupRecordDom,
      createElementWithAttributes('SequenceIndex', { value: 0 }),
      createElementWithAttributes('LookupListIndex', { value: listIndex })
    );
  }
  return chainDom;
};

const buildCoverage = (chainDom, tagName, coverage) => {
  if (coverage) {
    coverage.forEach((glyph, i) => {
      const coverageDom = createElementWithAttributes(tagName, {
        index: i++,
        Format: 1
      });
      coverageDom.appendChild(
        createElementWithAttributes('Glyph', { value: glyph })
      );
      chainDom.appendChild(coverageDom);
    });
  }
};

const getSubstLookup = (input, output) => {
  let lookupDom = substLookupMap[output];

  if (!lookupDom) {
    lookupDom = createElementWithAttributes('Lookup', {
      index: Object.keys(substLookupMap).length + 1
    });
    lookupDom.appendChild(
      createElementWithAttributes('LookupType', { value: 1 })
    );
    lookupDom.appendChild(
      createElementWithAttributes('LookupFlag', { value: 0 })
    );
    lookupDom.appendChild(
      createElementWithAttributes('SingleSubst', { index: 0, Format: 2 })
    );
    substLookupMap[output] = lookupDom;
  }
  const singleSubstDom = xpath.select('SingleSubst', lookupDom, true);

  // look for input subst
  const substitionDom = xpath.select(
    `Substitution[@in="${input}"]`,
    singleSubstDom,
    true
  );
  if (!substitionDom) {
    singleSubstDom.appendChild(
      createElementWithAttributes('Substitution', { in: input, out: output })
    );
  }
  return lookupDom;
};

const createElementWithAttributes = (tagName, attributes) => {
  const element = dom.createElement(tagName);
  Object.entries(attributes).forEach(attribute => {
    element.setAttribute(attribute[0], attribute[1]);
  });
  return element;
};

const appendChildren = (node, ...children) => {
  children.forEach(child => node.appendChild(child));
};

//const serialize = dom => new XMLSerializer().serializeToString(dom);

exports.buildGsubTables = buildGsubTables;
exports.finalizeGsubTables = finalizeGsubTables;
