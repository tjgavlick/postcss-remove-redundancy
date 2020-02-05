const postcss = require('postcss');
const selectorParser = require('postcss-selector-parser');

module.exports = postcss.plugin('postcss-remove-redundancy', function () {
  return function (root) {
    root.walkRules(function walkRulesOuter(originRule) {
      const originSelectors = generateSelectorSet(originRule.selector);
      const originStart = originRule.source.start;
      const originProps = Object.create(null);

      // populate object of this node's declarations for quick lookup
      originRule.walkDecls(function gatherOriginProps(decl) {
        originProps[decl.prop] = Object.create(null);
        originProps[decl.prop].value = decl.value;
        originProps[decl.prop].important = decl.important;
      });

      // if rule is empty, kill it and move on
      if (Object.keys(originProps).length === 0) {
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

        const newSelectors = generateSelectorSet(newRule.selector);

        // if the origin is a superset of the new, check for forward redundancy
        // in the importance cascade
        if (isSuperset(originSelectors, newSelectors)) {
          newRule.walkDecls(function checkForwardRedundancy(decl) {
            if (originProps[decl.prop] &&
                originProps[decl.prop].important &&
                !decl.important) {
              decl.remove();
            }
          });
        }

        // new selector supersets are candidates for reducing backward
        // redundancy
        if (isSuperset(newSelectors, originSelectors)) {
          // check if we have a duplicate of an origin prop
          newRule.walkDecls(function checkBackwardRedundancy(decl) {
            if (originProps[decl.prop]) {
              // account for backwards-looking !importance cascade
              if (!originProps[decl.prop].important ||
                  (originProps[decl.prop].important &&
                   decl.important)) {
                // delete original prop if all conditions are satisfied
                originRule.walkDecls(decl.prop, function removeDecl(decl) {
                  decl.remove();
                });
                delete originProps[decl.prop];
              }
            }
          });
        }

        // finally, if these actions leave either rule empty, kill it
        if (Object.keys(originProps).length === 0) {
          originRule.remove();
        }
        if (newRule.nodes.length === 0) {
          newRule.remove();
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
 *   true if the first set is a superset of the second, false otherwse. An
 *     empty superset or subset automatically resolves to false
 */
function isSuperset(superset, subset) {
  // empty sets do not apply to this question
  if (superset.size === 0 || subset.size === 0) {
    return false;
  }
  for (let el of subset) {
    if (!superset.has(el)) {
      return false;
    }
  }
  return true;
}
