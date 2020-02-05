const postcss = require('postcss');
const selectorParser = require('postcss-selector-parser');

module.exports = postcss.plugin('postcss-remove-redundancy', function () {
  return function (root) {
    root.walkRules(function walkRulesOuter(originRule) {
      const originSelectors = generateSelectorSet(originRule.selector);
      const originStart = originRule.source.start;
      const originProps = new Set();

      // populate set of this node's declarations for quick checking later
      originRule.walkDecls(function gatherOriginProps(decl) {
        originProps.add(decl.prop);
      });

      // if rule is empty, kill it and move on
      if (originProps.size === 0) {
        originRule.remove();
        return;
      }

      root.walkRules(function walkRulesInner(newRule) {
        // do not process until we're past our origin point in the stylesheet
        const newStart = newRule.source.start;
        if (newStart.line < originStart.line ||
            (newStart.line === originStart.line &&
             newStart.column <= originStart.column)) {
          return;
        }

        // if new set includes all the origin selectors, it's a candidate
        const newSelectors = generateSelectorSet(newRule.selector);
        if (isSuperset(newSelectors, originSelectors)) {
          // remove all dupes from origin
          newRule.walkDecls(function checkNewDecls(decl) {
            if (originProps.has(decl.prop)) {
              originRule.walkDecls(decl.prop, function removeDecl(decl) {
                decl.remove();
              });
              originProps.delete(decl.prop);
            }
          });
          // finally, if this leaves the origin rule empty, kill it
          if (originProps.size === 0) {
            originRule.remove();
          }
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
