const TEXT_COMPONENTS = ['Text', 'TextInput'];

module.exports = function ({ types: t }) {
  return {
    visitor: {
      Program: {
        enter(path, state) {
          state.fontScalingTargets = new Set();
          // <Animated.Text> 처럼 멤버 표현식으로 쓰는 Animated 객체의 로컬 이름
          state.animatedObjects = new Set();

          path.get('body').forEach(statement => {
            if (!statement.isImportDeclaration()) {
              return;
            }

            const source = statement.node.source.value;

            statement.node.specifiers.forEach(specifier => {
              if (source === 'react-native' && t.isImportSpecifier(specifier)) {
                if (TEXT_COMPONENTS.includes(specifier.imported.name)) {
                  state.fontScalingTargets.add(specifier.local.name);
                }

                if (specifier.imported.name === 'Animated') {
                  state.animatedObjects.add(specifier.local.name);
                }
              }

              if (
                source === 'react-native-reanimated' &&
                (t.isImportDefaultSpecifier(specifier) || t.isImportNamespaceSpecifier(specifier))
              ) {
                state.animatedObjects.add(specifier.local.name);
              }
            });
          });
        },
      },

      JSXOpeningElement(path, state) {
        const name = path.node.name;

        const isTextIdentifier =
          t.isJSXIdentifier(name) &&
          state.fontScalingTargets?.has(name.name);

        const isAnimatedText =
          t.isJSXMemberExpression(name) &&
          t.isJSXIdentifier(name.object) &&
          state.animatedObjects?.has(name.object.name) &&
          TEXT_COMPONENTS.includes(name.property.name);

        if (!isTextIdentifier && !isAnimatedText) {
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
