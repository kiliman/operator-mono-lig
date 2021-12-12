const fs = require('fs')

const rules = [
  '',
  `
lookup 1 {
  sub 1 by glyph;
} 1;`,
  `
lookup 1_2 {
  ignore sub 1 1' 2;
  ignore sub 1' 2 2;
  sub 1.spacer 2' by glyph;
  sub 1'       2  by 1.spacer;
} 1_2;`,
  `
lookup 1_2_3 {
  ignore sub 1 1' 2 3;
  ignore sub 1' 2 3 3;
  sub 1.spacer 2.spacer 3' by glyph;
  sub 1.spacer 2'       3  by 2.spacer;
  sub 1'       2        3  by 1.spacer;
} 1_2_3;`,
  `
lookup 1_2_3_4 {
  ignore sub 1 1' 2 3 4;
  ignore sub 1' 2 3 4 4;
  sub 1.spacer 2.spacer 3.spacer 4' by glyph;
  sub 1.spacer 2.spacer 3'       4  by 3.spacer;
  sub 1.spacer 2'       3        4  by 2.spacer;
  sub 1'       2        3        4  by 1.spacer;
} 1_2_3_4;`,
]

const gencalt = ligatures => {
  let calt = 'feature calt {\n'
  const ligs = {}

  ligatures
    .filter(l => !!l.name.match(/\.liga$/) || l.name !== l.glyph)
    .map(l => l.glyph)
    .sort((a, b) => {
      const length = b.split('_').length - a.split('_').length
      if (length !== 0) return length
      return a < b ? -1 : 1
    })
    .forEach(g => {
      g.split('.')
        .slice(0, 1)
        .forEach(l => {
          if (ligs[l]) return
          ligs[l] = true
          const c = l.split('_')
          let rule = rules[c.length]
          rule = rule
            .replace(/\d/g, m => c[parseInt(m) - 1])
            .replace(/glyph/g, g)
          calt += rule + '\n'
        })
    })

  return calt + '\n} calt;\n'
}

exports.gencalt = gencalt
