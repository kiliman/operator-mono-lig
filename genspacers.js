const fs = require('fs');
const lig = `<Glyph name="LIG" lsb="0" width="625">
<CharString>
    endchar
</CharString>
<Subrs/>
<GlobalSubrs/>
</Glyph>`;

fs.readdirSync('./ligature')
  .filter((f) => !!f.match(/^OperatorMono/))
  .forEach((f) => {
    console.log(f);
    fs.readdirSync(`./ligature/${f}/glyphs`)
      .filter((g) => !!g.match(/\.liga\.xml$/))
      .forEach((g) => {
        console.log(g);
        g.split('.')
          .slice(0, 1)
          .forEach((l) => {
            l.split('_').forEach((c) => {
              const path = `./ligature/${f}/glyphs/${c}.spacer.xml`;
              const exists = fs.existsSync(path);
              console.log(path, exists);
              if (exists) return;

              const width = !!f.match(/SSm/) ? 625 : 600;
              const spacer = lig
                .replace('LIG', `${c}.spacer`)
                .replace('625', width);
              console.log(f, c, width);
              fs.writeFileSync(path, spacer);
            });
          });
      });
  });
