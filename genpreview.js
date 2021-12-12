const fs = require('fs')
const { createCanvas } = require('canvas')

const width = 64
const height = 48
const weight = 300

const map = {
  ampersand: '&',
  bar: '|',
  colon: ':',
  equal: '=',
  exclam: '!',
  greater: '>',
  hyphen: '-',
  less: '<',
  plus: '+',
  question: '?',
  slash: '/',
  underscore: '_',
  w: 'w',
}

function generateLigaturePreview(style, filename) {
  const ligature = filename.split('.').slice(0, 1)[0]
  const chars = ligature.split('_')

  const text = chars.reduce((t, c) => t + map[c], '')

  const canvas = createCanvas(width, height)
  const context = canvas.getContext('2d')

  context.fillStyle = '#000'
  context.fillRect(0, 0, width, height)

  context.font = `${weight} ${style} 18pt "Operator Mono SSm Lig"`
  context.textAlign = 'center'
  context.fillStyle = '#fff'
  context.text = text
  context.fillText(text, 32, 32)

  const buffer = canvas.toBuffer('image/png')
  console.log(ligature)
  fs.writeFileSync(`./images/preview/${style}/${ligature}.png`, buffer)

  return { text, ligature, filename: `${ligature}.png` }
}

function generate(style, filenames) {
  let html = `<html><head>
  <style>
    body { background-color: #000; color: #fff; font-family: sans-serif; margin: 16px;}
    a { color: #fff; text-decoration: none; padding: 4px;}
    a.active {color: #000; background-color: #fff;}
    .container { display: grid;  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
    .ligature { display: flex; flex-direction: column; align-items: center; margin: 8px; }
  </style>
  </head>
  <body>
    <h1>Operator Mono Ligatures</h1>
    <a href="https://htmlpreview.github.io/?https://github.com/kiliman/operator-mono-lig/blob/master/images/preview/normal/index.html" class="${
      style === 'normal' ? 'active' : ''
    }">Normal</a> |
    <a href="https://htmlpreview.github.io/?https://github.com/kiliman/operator-mono-lig/blob/master/images/preview/italic/index.html" class="${
      style === 'italic' ? 'active' : ''
    }">Italic</a>
    <div class="container">
  `

  filenames.forEach(f => {
    const { ligature, filename } = generateLigaturePreview(style, f)
    html += `<div class="ligature"><img src="${filename}"/><div>${ligature}</div></div>`
  })

  html += `</div></body></html>`

  fs.writeFileSync(`./images/preview/${style}/index.html`, html)
}

const filenames = fs
  .readdirSync('./ligature/OperatorMonoSSmLig-Book/glyphs')
  .filter(f => !!f.match(/[^\d]\.liga\.xml$/))

generate('normal', filenames)
generate('italic', filenames)
