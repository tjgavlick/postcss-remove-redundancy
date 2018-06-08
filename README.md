# PostCSS Remove Redundancy [![Build Status][ci-img]][ci]

[PostCSS] plugin that removes redundant rules for a slimmer stylesheet.

[PostCSS]: https://github.com/postcss/postcss
[ci-img]:  https://travis-ci.org/tjgavlick/postcss-remove-redundancy.svg
[ci]:      https://travis-ci.org/tjgavlick/postcss-remove-redundancy

```css
.foo {
    /* Input example */
}
```

```css
.foo {
  /* Output example */
}
```

## Usage

```js
postcss([ require('postcss-remove-redundancy') ])
```

See [PostCSS] docs for examples for your environment.
