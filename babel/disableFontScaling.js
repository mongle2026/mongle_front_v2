module.exports = function ({ types: t }) {
  return {
    visitor: {
      Program: {
        enter(path, state) {
          state.fontScalingTargets = new Set();

          path.get('body').forEach(statement => {
            if (
              statement.isImportDeclaration() &&
              statement.node.source.value === 'react-native'
            ) {
              statement.node.specifiers.forEach(specifier => {
                if (
                  t.isImportSpecifier(specifier) &&
                  ['Text', 'TextInput'].includes(specifier.imported.name)
                ) {
                  state.fontScalingTargets.add(specifier.local.name);
                }
              });
            }
          });
        },
      },

      JSXOpeningElement(path, state) {
        const name = path.node.name;

        if (
          !t.isJSXIdentifier(name) ||
          !state.fontScalingTargets?.has(name.name)
        ) {
          return;
        }

        const hasAllowFontScaling = path.node.attributes.some(
          attribute =>
            t.isJSXAttribute(attribute) &&
            t.isJSXIdentifier(attribute.name, {
              name: 'allowFontScaling',
            })
        );

        if (hasAllowFontScaling) {
          return;
        }

        path.node.attributes.push(
          t.jsxAttribute(
            t.jsxIdentifier('allowFontScaling'),
            t.jsxExpressionContainer(
              t.booleanLiteral(false)
            )
          )
        );
      },
    },
  };
};