const postcss = require('postcss');
const selectorParser = require('postcss-selector-parser');

module.exports = postcss.plugin('postcss-remove-redundancy', function () {

  /*
  {
    normalizedRuleText: {
      decl: {
        all: {
          value: winningValue,
          ref: decl,
        },
        'width:768px,Infinity': {
          value: winningValue,
          ref: decl,
        },
        'width:0,767px': {
          value: winningValue,
          ref: decl,
        },
        'width:480px,767px width:1024px,Infinity': {
          value: winningValue,
          ref: decl,
        },
        print: { ... }
      }
    }
  }
  */

  // for each rule:
  //  - look up previous statements of the rule
  //  - if matching statements exist:
  //    - should this rule override?
  //      - superset of media query range?
  //      - respects !important cascade?
  //    - if so, delete previous dec
  //      - check if that rule is now empty. if so, delete it
  //        - if this results in empty mq, delete it too
  // consider combining rules with same media restrictions

  return function (root) {

    // this structure will store the last winning value of each previously-
    // encountered rule and declaration
    const state = Object.create(null);

    root.walkRules(function (rule) {
      // normalize our selector's whitespace so we can use it as a key
      rule.selector = selectorParser(normalizeSelectors)
        .transformSync(rule.selector);
      rule.raws.between = ' ';

      // verify we have an entry for this selector
      if (!state[rule.selector]) {
        state[rule.selector] = Object.create(null);
      }
    });
  };


  /*
   * Normalize the whitespace of a given selector
   */
  function normalizeSelectors(selectors) {
    selectors.walk(function walkSelectors(selector) {
      if (selector.type === 'combinator') {
        selector.spaces.before = ' ';
        selector.spaces.after = ' ';
      } else {
        selector.spaces.before = '';
        selector.spaces.after = '';
      }
      if (selector.type === 'attribute') {
        selector.raws.spaces.attribute = { before: '', after: '' };
        selector.raws.spaces.operator = { after: '' };
        selector.raws.spaces.value = { after: '' };
      }
    });
    return selectors.nodes.join(', ').trim();
  }

});
