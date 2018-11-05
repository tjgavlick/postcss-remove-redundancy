const postcss = require('postcss');
const selectorParser = require('postcss-selector-parser');


// delete empty rules
function deleteEmptyRules(css) {
  css.walkRules(function (rule) {
    if (rule.nodes.length === 0) {
      rule.remove();
    }
  });
}


module.exports = postcss.plugin('postcss-remove-redundancy', function () {

  return function (root) {
    // build a map of discrete selectors and their properties
    const selectorMap = new Map();
    root.walkRules(function (rule) {
      selectorParser(function (selectors) {
        selectors.nodes.forEach(function (selector) {
          const selectorString = selector.toString();
          let selectorProps;
          // each selector should be a map of props
          if (selectorMap.get(selectorString) === undefined) {
            selectorMap.set(selectorString, new Map());
          }
          selectorProps = selectorMap.get(selectorString);
          rule.walkDecls(function (decl) {
            let propValues;
            if (selectorProps.get(decl.prop) === undefined) {
              selectorProps.set(decl.prop, []);
            }
            propValues = selectorProps.get(decl.prop);
            propValues.push({
              decl: decl,
              rule: rule
            });
          });
        });
      }).processSync(rule.selector, { lossless: false });
    });

    // walk through our map and collapse values
    selectorMap.forEach(function (props) {
      props.forEach(function (values) {
        const winningValue = values.reduce((acc, cur) => {
          return acc.decl.important && !cur.decl.important ? acc : cur;
        });
        values.forEach(function (value) {
          if (value !== winningValue) {
            value.decl.remove();
          }
        });
      });
    });

    // delete rules that have been left empty
    deleteEmptyRules(root);

    // re-walk rules and combine adjacent duplicate declarations
    root.walkRules(function (rule) {
      if (rule.prev() && rule.parent === rule.prev().parent) {
        const combinedSelectors = [];
        selectorParser(function (selectors) {
          selectors.nodes.forEach(selector => combinedSelectors.push(selector.toString()));
        }).processSync(rule.prev().selector, { lossless: false });
        console.log(combinedSelectors);
      }
    });
  };
});
