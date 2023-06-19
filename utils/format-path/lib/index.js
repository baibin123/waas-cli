'use strict';
const path = require('path')

module.exports = formatPath;

function formatPath(p) {
  if (p && typeof p === 'string') {
    const seq = path.sep
    if (seq === '/') {
      return p
    } else {
      return p.replaceAll('\\', '/')
    }
  }
  return null
}
