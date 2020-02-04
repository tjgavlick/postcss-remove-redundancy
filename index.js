const postcss = require('postcss');
const selectorParser = require('postcss-selector-parser');

module.exports = postcss.plugin('postcss-remove-redundancy', function () {
  return function (root) {
    root.walkRules(function (originRule) {
      const originSelectors = generateSelectorSet(originRule.selector);
      const originStart = originRule.source.start;

      root.walkRules(function (newRule) {
        // do not process until we're past our origin point in the stylesheet
        const newStart = newRule.source.start;
        if (newStart.line < originStart.line || (newStart.line === originStart.line && newStart.column <= originStart.column)) {
          return;
        }

        const newSelectors = generateSelectorSet(newRule.selector);
        if (isSuperset(newSelectors, originSelectors)) {
          // we have a possible candidate for redundancy
        }
      });
    });
  };
});


/*
 * Generate a set of normalized component selectors
 *
 * Each separate selector (that is, selectors separated by a comma) in the
 * string will be normalized with regards to whitespace and then included as an
 * element in the resultant set
 *
 * Args:
 *   selector (string): the selector string to work with
 *
 * Returns:
 *   A Set of normalized selectors
 */
function generateSelectorSet(selector) {
  let normalizedSelector = selectorParser().processSync(selector, { lossless: false });
  return new Set(normalizedSelector.split(','));
}


/*
 * Determine whether a set is a superset of another
 *
 * Args:
 *   superset (Set): the proposed superset
 *   subset (Set): the proposed subset
 *
 * Returns:
 *   true if the first set is a superset of the second, false otherwse
 */
function isSuperset(superset, subset) {
  for (let el of subset) {
    if (!superset.has(el)) {
      return false;
    }
  }
  return true;
}
