const postcss = require('postcss');
const plugin = require('./');

function run(input, output, opts) {
  return postcss([ plugin(opts) ]).process(input)
    .then(result => {
      expect(result.css).toEqual(output);
      expect(result.warnings().length).toBe(0);
    });
}


// it('runs', () => {
//   return run('a { }', 'a { }');
// });


// it('does not touch unrelated rules', () => {
//   return run(`
// .foo {
//   display: block;
// }
// .bar {
//   display: inline-block;
// }
// `, `
// .foo {
//   display: block;
// }
// .bar {
//   display: inline-block;
// }
// `);
// });


it('collapses a redundant rule', () => {
  return run(`
.foo {
  display: block;
}
.foo {
  display: inline-block;
}
`, `
.foo {
  display: inline-block;
}
`);
});


// it('collapses into a compound rule', () => {
//   return run(`
// .foo {
//   display: block;
// }
// .foo, .bar {
//   display: inline-block;
// }
// `, `
// .foo, .bar {
//   display: inline-block;
// }
// `);
// });


/*
it('correctly places collapsed rules', () => {
  return run(`
.foo {
  display: block;
  font-size: 2em;
}
.bar {
  font-size: 3em;
}
.foo {
  font-size: 4em;
}
`, `
.foo {
  display: block;
}
.bar {
  font-size: 3em;
}
.foo {
  font-size: 4em;
}
`);
});
*/

/*
it('is not thrown off by formatting', () => {
  return run(`
.foo + .bar {
  display: block;
  font-size: 2em;
}
.foo  +     .bar {
  display: block;
  font-size: 2em;
}
`, `
.foo  +     .bar {
  display: block;
  font-size: 2em;
}
`);
});
*/

/*
it('respects the effect of !important on the cascade', () => {
  return run(`
.foo {
  display: block;
  font-size: 2em !important;
}
.bar {
  font-size: 3em;
}
.foo {
  font-size: 4em;
}
`, `
.foo {
  display: block;
  font-size: 2em !important;
}
.bar {
  font-size: 3em;
}
`);
});
*/

/*
it('handles multiple !importants', () => {
  return run(`
.foo {
  font-size: 2em !important;
}
.foo {
  font-size: 3em;
}
.foo {
  font-size: 4em !important;
}
.foo {
  font-size: 5em;
}
`, `
.foo {
  font-size: 4em !important;
}
`);
});
*/

/*
it('combines adjacent occurrences of the same property', () => {
  return run(`
.foo, .bar {
  font-size: 2em;
}
.bar, .baz {
  font-size: 2em;
}
`, `
.bar, .baz, .foo {
  font-size: 2em;
}
`);
});
*/

/*
it('does not combine non-adjacent occurrences of the same property', () => {
  return run(`
.foo {
  font-size: 2em;
}
.bar {
  font-size: 3em;
}
.baz {
  font-size: 2em;
}
`, `
.foo {
  font-size: 2em;
}
.bar {
  font-size: 3em;
}
.baz {
  font-size: 2em;
}
`);
});
*/

/*
it('collapses properties across different selector permutations', () => {
  return run(`
.foo, .bar {
  display: block;
  font-size: 2em;
}
.bar {
  display: block;
  font-size: 2em;
}
.bar, .foo {
  display: block;
  font-size: 3em;
}
`, `
.bar, .foo {
  display: block;
  font-size: 3em;
}
`);
});*/

/*
it('collapses rules in overlapping media queries', () => {
  return run(`
@media (min-width: 720px) {
  .foo {
    display: block;
    font-size: 2em;
    padding: 2em;
  }
}
@media (min-width: 1000px) {
  .foo {
    display: block;
    font-size: 2em;
    padding: 3em;
  }
}
`, `
@media (min-width: 720px) {
  .foo {
    display: block;
    font-size: 2em;
    padding: 2em;
  }
}
@media (min-width: 1000px) {
  .foo {
    padding: 3em;
  }
}
`);
});


it('recognizes when media queries are superfluous', () => {
  return run(`
.foo {
  display: block;
  font-size: 2em;
}
@media (max-width: 719px) {
  .foo {
    display: block;
    font-size: 2em;
    padding: 1em;
  }
}
@media (min-width: 720px) {
  .foo {
    display: block;
    font-size: 2em;
    padding: 2em;
  }
}
@media (min-width: 1000px) {
  .foo {
    display: block;
    font-size: 4em;
    padding: 3em;
  }
}
`, `
.foo {
  display: block;
  font-size: 2em;
}
@media (min-width: 1000px) {
  .foo {
    font-size: 4em;
    padding: 3em;
  }
}
`);
});


it('does not collapse rules across media types', () => {
  return run(`
@media screen and (min-width: 720px) {
  .foo {
    display: block;
    font-size: 2em;
    padding: 2em;
  }
}
@media print and (min-width: 1000px) {
  .foo {
    display: block;
    font-size: 2em;
    padding: 3em;
  }
}
`, `
@media screen and (min-width: 720px) {
  .foo {
    display: block;
    font-size: 2em;
    padding: 2em;
  }
}
@media print and (min-width: 1000px) {
  .foo {
    display: block;
    font-size: 2em;
    padding: 3em;
  }
}
`);
});
*/
