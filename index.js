const postcss = require('postcss');
const selectorParser = require('postcss-selector-parser');

module.exports = postcss.plugin('postcss-remove-redundancy', function () {
  return function (root) {

    // iterating through all the rules in a stylesheet, we're going to look
    // ahead and see if their declarations are rendered redundant by something
    // further down the cascade
    root.walkRules(function walkRulesOuter(originRule) {

      // store this rule's attributes for quick access later
      const originSelectors = generateSelectorSet(originRule.selector);
      const originStart = originRule.source.start;
      const originProps = gatherProps(originRule);

      // if this rule is empty, kill it and move on
      if (Object.keys(originProps).length === 0) {
        originRule.remove();
        return;
      }

      root.walkRules(function walkRulesInner(newRule) {
        // do not process until we're past our origin rule
        const newStart = newRule.source.start;
        if (newStart.line < originStart.line ||
            (newStart.line === originStart.line &&
             newStart.column <= originStart.column)) {
          return;
        }

        // store this rule's attributes for faster comparison operations
        const newSelectors = generateSelectorSet(newRule.selector);
        const newProps = gatherProps(newRule);

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
 * Store a rule's props in a dictionary structure
 *
 * Args:
 *   rule (Rule): a PostCSS Rule object
 *
 * Returns:
 *   An object whose keys are css property names and whose values are objects
 *     containing the attributes of that property
 */
function gatherProps(rule) {
  const result = Object.create(null);
  rule.walkDecls(function gatherProp(decl) {
    result[decl.prop] = Object.create(null);
    result[decl.prop].value = decl.value;
    result[decl.prop].important = decl.important;
  });
  return result;
}


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
  // I know, technically, any non-empty set contains the empty set. But
  // practicelly, that just muddies the waters here
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


/*
 * Perform a union of two sets
 *
 * Args:
 *   a, b (Set): the two Sets to union
 *
 * Returns:
 *   A new Set containing the elements of a ∪ b
 */
function union(a, b) {
  const result = new Set(a);
  for (let el of b) {
    result.add(el);
  }
  return result;
}


/*
 * Perform an intersection of two sets
 *
 * Args:
 *   a, b (Set): the two Sets to intersect
 *
 * Returns:
 *   A new Set containing the elements of a ∩ b
 */
function intersection(a, b) {
  const result = new Set();
  for (let el of a) {
    if (b.has(el)) {
      result.add(el);
    }
  }
  return result;
}
