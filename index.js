const postcss = require('postcss');
const selectorParser = require('postcss-selector-parser');

module.exports = postcss.plugin('postcss-remove-redundancy', function () {

  return function (root) {
    root.walkRules(function (rule) {
      console.log(rule);
    });
  };

});
