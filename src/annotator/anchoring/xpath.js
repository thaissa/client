export { xpathFromNode } from './xpath-util';

/**
 * Return the `index`'th immediate child of `element` whose tag name is
 * `nodeName` (case insensitive).
 *
 * @param {Element} element
 * @param {string} nodeName
 * @param {number} index
 */
function nthChildOfType(element, nodeName, index) {
  nodeName = nodeName.toUpperCase();

  let matchIndex = -1;
  for (let i = 0; i < element.children.length; i++) {
    const child = element.children[i];
    if (child.nodeName.toUpperCase() === nodeName) {
      ++matchIndex;
      if (matchIndex === index) {
        return child;
      }
    }
  }

  return null;
}

/**
 * Evaluate a _simple XPath_ relative to a `root` element and return the
 * matching element.
 *
 * A _simple XPath_ is a sequence of one or more `/tagName[index]` strings.
 *
 * Unlike `document.evaluate` this function:
 *
 *  - Only supports simple XPaths
 *  - Is not affected by the document's _type_ (HTML or XML/XHTML)
 *  - Ignores element namespaces when matching element names in the XPath against
 *    elements in the DOM tree
 *  - Is case insensitive for all elements, not just HTML elements
 *
 * The matching element is returned or `null` if no such element is found.
 * An error is thrown if `xpath` is not a simple XPath.
 *
 * @param {string} xpath
 * @param {Element} root
 * @return {Element|null}
 */
function evaluateSimpleXPath(xpath, root) {
  const isSimpleXPath =
    xpath.match(/^(\/[A-Za-z0-9-]+(\[[0-9]+\])?)+$/) !== null;
  if (!isSimpleXPath) {
    throw new Error('Expression is not a simple XPath');
  }

  const segments = xpath.split('/');
  let element = root;

  // Remove leading empty segment. The regex above validates that the XPath
  // has at least two segments, with the first being empty and the others non-empty.
  segments.shift();

  for (let segment of segments) {
    let elementName;
    let elementIndex;

    const separatorPos = segment.indexOf('[');
    if (separatorPos !== -1) {
      elementName = segment.slice(0, separatorPos);

      const indexStr = segment.slice(separatorPos + 1, segment.indexOf(']'));
      elementIndex = parseInt(indexStr) - 1;
      if (elementIndex < 0) {
        return null;
      }
    } else {
      elementName = segment;
      elementIndex = 0;
    }

    const child = nthChildOfType(element, elementName, elementIndex);
    if (!child) {
      return null;
    }

    element = child;
  }

  return element;
}

/**
 * Finds an element node using an XPath relative to `root`
 *
 * Example:
 *   node = nodeFromXPath('/main/article[1]/p[3]', document.body)
 *
 * @param {string} xpath
 * @param {Element} [root]
 * @return {Node|null}
 */
export function nodeFromXPath(xpath, root = document.body) {
  try {
    return evaluateSimpleXPath(xpath, root);
  } catch (err) {
    return document.evaluate(
      '.' + xpath,
      root,
      null /* nsResolver */,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null /* result */
    ).singleNodeValue;
  }
}
