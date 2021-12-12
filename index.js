// @ts-nocheck
const fs = require('fs');
const os = require('os');
if (!os.EOL) {
  os.EOL = process.platform === 'win32' ? '\r\n' : '\n';
}

const calt = require('./calt');

const xpath = require('xpath');
const { DOMParser, XMLSerializer } = require('xmldom');
const format = require('xml-formatter');
let fontName;
let ligFontName;

const regExWhitespace = /^\s+$/;
const NodeType = {};
NodeType.TEXT_NODE = 3;

let dom;
let italicsHack = false;
function main() {
  fontName = process.argv[2];
  italicsHack =
    fontName.includes('Italic') && process.argv[3] !== '--italics-hack-off';

  ligFontName = fontName.split('-').join('Lig-');

  const srcFileName = `./original/${fontName}.ttx`;
  console.log(`Reading original font file ${srcFileName}`);
  const xml = fs.readFileSync(srcFileName, 'utf-8');
  dom = new DOMParser().parseFromString(xml);

  const profiles = getProfiles();

  // process settings (there may be more than one font to build)
  profiles.forEach((profile) => buildFont(profile, { italicsHack }));

  console.log('Done');
}

const buildFont = (profile, options) => {
  // add suffix to dstFileName if present
  const dstFileName = `./build/${ligFontName}${profile.suffixWithLeadingHyphen}.ttx`;
  console.log(
    `Building ligature font file ${dstFileName} name = ${profile.name}`
  );

  const ligatures = sortLigatures(
    fs
      .readdirSync(`./ligature/${ligFontName}/glyphs`)
      .filter((file) => /\.xml$/.test(file))
      .map((file) => file.replace('.xml', ''))
  )
    .filter((name) => !/\d+\.liga$/.test(name)) // skip alternates (ends with .#)
    .filter((name) => filterLigatures(name, profile.ligatures))
    .map((name) => mapLigatures(name, profile.ligatures))
    .filter((entry) => filterGlyphsExists(entry));

  const ligaturesWithLIG = ligatures;
  //[...ligatures, { name: 'LIG', glyph: 'LIG' }];

  processPatch('names', patchNames, dom, ligatures, profile);
  processPatch('charstrings', patchCharStrings, dom, ligaturesWithLIG);
  processPatch('glyphs', patchGlyphs, dom, ligaturesWithLIG);
  processPatch('hmtx', patchHmtx, dom);

  const feature = calt.gencalt(ligatures);
  fs.writeFileSync('./features/calt.fea', feature);

  console.log(`Writing ligature font file ${dstFileName}`);
  fs.writeFileSync(dstFileName, format(serialize(dom)));
};

const getProfiles = () => {
  const profilePath = './original/profiles.ini';
  // return default profiles if profile doesn't exist
  if (!fs.existsSync(profilePath)) {
    return [
      {
        name: 'default',
        suffix: '',
        suffixWithLeadingSpace: '',
        suffixWithLeadingHyphen: '',
        ligatures: [],
      },
    ];
  }

  const profiles = [];
  let profile = null;

  const content = fs.readFileSync(profilePath, 'utf-8');
  content
    .split(/\r|\r\n|\n/g)
    .filter((line) => /^[#]/.test(line) === false && line.length > 0)
    .forEach((line) => {
      const ch = line.trim()[0];
      if (ch === '[') {
        let name = line.substr(1, line.indexOf(']') - 1);
        profile = {
          name,
          suffix: name === 'default' ? '' : name,
          suffixWithLeadingSpace: name === 'default' ? '' : ' ' + name,
          suffixWithLeadingHyphen: name === 'default' ? '' : '-' + name,
          ligatures: [],
        };
        profiles.push(profile);
      } else {
        if (!profile) {
          throw new Error('You must provide a profile name in []');
        }
        profile.ligatures.push(line);
      }
    });

  return profiles;
};

const filterLigatures = (name, mappings) => {
  // loop through mappings and return if name applies or not
  // skip if setting is !name
  return mappings.filter((entry) => entry === '!' + name).length === 0;
};

const mapLigatures = (name, mappings) => {
  let mapping = { name, glyph: name };
  mappings.forEach((entry) => {
    const [val1, val2] = entry.split('=');
    // handle lig=altliga
    if (val1 === name) {
      mapping.glyph = val2;
    } else if (val2 === name) {
      mapping.name = val1;
    }
  });
  return mapping;
};

const filterGlyphsExists = ({ glyph }) => {
  const exists = fs.existsSync(`./ligature/${ligFontName}/glyphs/${glyph}.xml`);
  return exists;
};

const sortLigatures = (ligatures) => {
  // sort by most glyphs then alphabetically
  const sorted = ligatures
    .map((ligature) => {
      return { count: ligature.split('_').length + 1, ligature: ligature };
    })
    .sort(
      (a, b) =>
        -compareProperty(a.count, b.count) || // sort by count descending
        compareProperty(a.ligature, b.ligature) // then by ligature alphabetically
    )
    .map((entry) => entry.ligature);
  return sorted;
};

const compareProperty = (a, b) => {
  if (typeof a === 'number') {
    return a || b ? (!a ? -1 : !b ? 1 : a === b ? 0 : a < b ? -1 : 1) : 0;
  } else {
    return a || b ? (!a ? -1 : !b ? 1 : a.localeCompare(b)) : 0;
  }
};

const loadXml = (name) => {
  const fileName = `./ligature/${ligFontName}/${name}.xml`;
  const xml = fs.readFileSync(fileName, 'utf-8');
  return new DOMParser().parseFromString(xml);
};

const processPatch = (name, patchFunc, dom, ligatures, profile, options) => {
  console.log(`Patching ${name}`);
  patchFunc(dom, ligatures, profile, options);
};

const PlatformId = {
  mac: 1,
  win: 3,
};

const NameId = {
  familyName: 1,
  fontStyle: 2,
  uniqueId: 3,
  fullName: 4,
  version: 5,
  postscriptName: 6,
  windowsFamilyName: 16,
  fontStyleName: 17,
};

const patchNames = (dom, ligatures, profile) => {
  const names = JSON.parse(
    fs.readFileSync(`./ligature/${ligFontName}/names.json`)
  );

  const [name, style] = names.fontName.split('-');
  const [familyStyle, fullNameStyleTry] = names.fontStyle.split(' ');

  let fullNameStyleTemp;
  if (fullNameStyleTry) {
    fullNameStyleTemp = fullNameStyleTry;
  } else {
    fullNameStyleTemp = '';
  }

  const fullNameStyle = fullNameStyleTemp;
  const fontName = `${name}${profile.suffixWithLeadingHyphen}-${style}`;
  const familyNamePlat = `${names.familyName}${profile.suffixWithLeadingSpace}`;
  const familyName = `${familyNamePlat} ${familyStyle}`;
  const fullName = `${familyName} ${fullNameStyle}`;
  const uniqueId = `${names.foundry}: ${fullName}: ${names.version}`;
  // patch CFFFont
  const cffFont = xpath.select('/ttFont/CFF/CFFFont', dom, true);

  cffFont.setAttribute('name', ligFontName);
  setAttribute(cffFont, 'FullName', 'value', fullName);
  setAttribute(cffFont, 'FamilyName', 'value', familyNamePlat);

  // update existing names with new names
  // mac family name does not include style
  updateName(PlatformId.mac, NameId.familyName, familyNamePlat);
  updateName(PlatformId.mac, NameId.fontStyle, names.fontStyle);
  updateName(PlatformId.mac, NameId.uniqueId, uniqueId);
  updateName(PlatformId.mac, NameId.fullName, fullName);
  updateName(PlatformId.mac, NameId.postscriptName, fontName);
  updateName(PlatformId.mac, NameId.windowsFamilyName, familyNamePlat);
  updateName(PlatformId.mac, NameId.fontStyleName, names.fontStyle);

  // windows family name includes style
  updateName(PlatformId.win, NameId.familyName, familyName);
  updateName(PlatformId.win, NameId.fontStyle, names.windowsFontStyle);
  updateName(PlatformId.win, NameId.uniqueId, uniqueId);
  updateName(PlatformId.win, NameId.fullName, fullName);
  updateName(PlatformId.win, NameId.postscriptName, fontName);
  updateName(PlatformId.win, NameId.windowsFamilyName, familyNamePlat);
  updateName(PlatformId.win, NameId.fontStyleName, names.fontStyle);
};

const updateName = (platformId, nameId, value) => {
  // search for namerecord in target dom and replace with this one or append node
  const target = xpath.select(
    `/ttFont/name/namerecord[@nameID="${nameId}" and @platformID="${platformId}"]`,
    dom,
    true
  );
  if (target) {
    target.childNodes[0].textContent = value;
  }
};

const patchGlyphs = (dom, ligatures) => {
  // get number of glyphs in target dom
  const targetGlyphs = xpath.select('/ttFont/GlyphOrder', dom, true);
  const glyphsCount = xpath.select('count(GlyphID)', targetGlyphs, true);

  // only import glyphs specified
  let n = glyphsCount;
  // get ligature glyphs
  ligatures.forEach((ligature) => {
    targetGlyphs.appendChild(
      createElementWithAttributes('GlyphID', { id: n++, name: ligature.glyph })
    );
  });
  // update glyph count
  setAttribute(dom, '/ttFont/maxp/numGlyphs', 'value', n);
};

const patchGsub = (dom, ligatures, options) => {
  // don't patch if no ligatures other than LIG
  if (ligatures.length <= 1) return;
  gsub.initGsubTables(dom, options);

  ligatures.forEach((ligature) => {
    // build gsub tables
    gsub.buildGsubTables(dom, ligature, options);
  });
  gsub.finalizeGsubTables();
};

const patchHmtx = (dom) => {
  const mtxCount = xpath.select('count(/ttFont/hmtx/mtx)', dom, true);
  setAttribute(dom, '/ttFont/hhea/numberOfHMetrics', 'value', mtxCount);

  const configDom = loadXml('config');
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
};

const patchCharStrings = (dom, ligatures) => {
  // patch CFFFont
  const cffFont = xpath.select('/ttFont/CFF/CFFFont', dom, true);
  const targetHmtx = xpath.select('/ttFont/hmtx', dom, true);
  const targetCmaps = xpath.select('/ttFont/cmap/cmap_format_4', dom);
  const targetCharStrings = xpath.select('CharStrings', cffFont, true);
  const targetSubrs = xpath.select(
    '/ttFont/CFF/CFFFont/Private/Subrs',
    dom,
    true
  );
  const targetGsubrs = xpath.select('/ttFont/CFF/GlobalSubrs', dom, true);
  const fingerprints = {};
  ligatures.forEach((ligature) => {
    console.log(
      `* ${ligature.name}${
        ligature.name === ligature.glyph ? '' : ' => ' + ligature.glyph
      }`
    );
    const glyphDom = loadXml(`glyphs/${ligature.glyph}`).documentElement;
    const node = xpath.select('/Glyph/CharString', glyphDom, true);
    node.setAttribute('name', ligature.glyph);

    const subrs = {
      sourcePath: '/Glyph/Subrs',
      target: targetSubrs,
    };
    const gsubrs = {
      sourcePath: '/Glyph/GlobalSubrs',
      target: targetGsubrs,
    };

    patchCharStringSubrs(glyphDom, node, fingerprints, subrs, gsubrs);

    targetCharStrings.appendChild(node);
    targetHmtx.appendChild(
      createElementWithAttributes('mtx', {
        name: ligature.glyph,
        width: glyphDom.getAttribute('width'),
        lsb: glyphDom.getAttribute('lsb'),
      })
    );
    const code = glyphDom.getAttribute('code');
    if (code) {
      Array.from(targetCmaps).forEach((node) => {
        node.appendChild(
          createElementWithAttributes('map', {
            code,
            name: ligature.glyph,
          })
        );
      });
    }
  });
};

const patchCharStringSubrs = (glyphDom, node, fingerprints, subrs, gsubrs) => {
  // check for callsubr/callgsubr

  const lines = node.childNodes[0].textContent.split(/\r|\r\n|\n/g);
  const newLines = [];
  lines.forEach((line) => {
    if (line.trim().length === 0) return;
    const matches = line.match(/(.*?)\{([0-9a-z]+)\} (callsubr|callgsubr)$/);
    if (matches != null) {
      const { sourcePath, target } = matches[3] === 'callsubr' ? subrs : gsubrs;
      const fingerprint = matches[2];
      let newIndex = fingerprints[fingerprint];
      if (!newIndex) {
        const srcSubr = xpath.select(
          `/${sourcePath}/CharString[@fingerprint="${fingerprint}"]`,
          glyphDom,
          true
        );

        // append subr to target dom and get new index
        newIndex = xpath.select('count(CharString)', target, true);

        const clone = srcSubr.cloneNode(true);
        clone.setAttribute('index', newIndex);
        target.appendChild(clone);

        // add new index to map and rewrite call
        newIndex = newIndex - 107;
        fingerprints[fingerprint] = newIndex;

        // patch up source in case it also has any callsubrs
        patchCharStringSubrs(glyphDom, clone, fingerprints, subrs, gsubrs);
      }

      // rewrite line with new subr index
      line = `${matches[1]}${newIndex} ${matches[3]}`;
    }
    newLines.push(line);
  });
  node.childNodes[0].textContent = newLines.join(os.EOL);
};

const setAttribute = (parent, path, name, value) => {
  var node = xpath.select(path, parent, true);
  node.setAttribute(name, value);
};

const copyConfigAttribute = (dom, configDom, path, name) => {
  const value = xpath.select(path, configDom, true).getAttribute(name);
  setAttribute(dom, path, name, value);
};

const createElementWithAttributes = (tagName, attributes) => {
  const element = dom.createElement(tagName);
  Object.entries(attributes).forEach((attribute) => {
    element.setAttribute(attribute[0], attribute[1]);
  });
  return element;
};

//const dump = dom => console.log(serialize(dom));
const serialize = (dom) =>
  new XMLSerializer().serializeToString(dom, false, (node) => {
    if (node.nodeType === NodeType.TEXT_NODE) {
      if (regExWhitespace.test(node.data)) return null;
      const data = node.data
        .split(/\r|\r\n|\n/g)
        .filter((s) => /\S+/.test(s))
        .map((s) => s.replace(/^\s+/g, ''))
        .join(os.EOL);

      return node.ownerDocument.createTextNode(data);
    }
    return node;
  });

main();
