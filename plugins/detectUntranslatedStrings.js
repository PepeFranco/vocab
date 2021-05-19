function isPartOfTExpression(path) {
  if (!path) {
    return false;
  }

  if (
    path.parent.type === 'CallExpression' &&
    path.parent.callee.name === 't'
  ) {
    return true;
  }
  return isPartOfTExpression(path.parentPath);
}

function hasJsx(path) {
  return Boolean(path.findParent((p) => p.type === 'JSXElement'));
}

const isPropThatWillRender = (path) => {
  const propsThatWillRender = ['message', 'label', 'title'];
  return (
    path.parent.type === 'JSXAttribute' &&
    propsThatWillRender.includes(path.parent.name.name)
  );
};

const isProp = (path) => {
  return Boolean(
    path.findParent((p) => {
      return (
        p.type === 'JSXAttribute' ||
        (p.type === 'ObjectProperty' &&
          p.findParent((p2) => p2.type === 'JSXElement'))
      );
    }),
  );
};

const getValue = (path) => path && path.node && path.node.value;

const getFile = (path) =>
  path &&
  path.hub &&
  path.hub.file &&
  path.hub.file.opts &&
  path.hub.file.opts.filename;

const getLineStart = (path) => {
  const parentWithLoc = path.findParent(
    (p) =>
      p && p.node && p.node.loc && p.node.loc.start && p.node.loc.start.line,
  );
  return parentWithLoc && parentWithLoc.node.loc.start.line;
};

const getColumnStart = (path) => {
  const parentWithLoc = path.findParent(
    (p) =>
      p && p.node && p.node.loc && p.node.loc.start && p.node.loc.start.column,
  );
  return parentWithLoc && parentWithLoc.node.loc.start.column;
};

const getKey = (path) =>
  `${getValue(path)},${getFile(path)}:${getLineStart(path)}:${getColumnStart(
    path,
  )}`;

let translated = {};
let untranslated = {};
let ignored = {};

function detectUntranslatedStrings() {
  return {
    visitor: {
      StringLiteral(path) {
        const key = getKey(path);
        if (!path.node.value.toString().trim()) {
          return;
        }
        if (translated[key] || untranslated[key] || ignored[key]) {
          return;
        }
        const isInNodeModules = path.hub.file.opts.filename.includes(
          'node_modules',
        );
        if (isInNodeModules) {
          return;
        }

        const shouldBeTranslated =
          hasJsx(path) && (!isProp(path) || isPropThatWillRender(path));
        if (!shouldBeTranslated) {
          return;
        }
        const hasBeenTranslated = isPartOfTExpression(path);
        if (hasBeenTranslated) {
          translated[key] = true;
          return;
        }
        if (!hasBeenTranslated) {
          untranslated[key] = true;
          console.log('Vocab detected untranslated string: ', key);
          return;
        }
      },
    },
  };
}

module.exports = detectUntranslatedStrings;
