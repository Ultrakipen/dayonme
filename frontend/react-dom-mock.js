// react-dom-mock.js
// React Native에서 react-dom을 모킹하기 위한 파일

const flushSync = (callback) => {
  // React Native에서는 flushSync가 필요하지 않으므로 콜백을 바로 실행
  if (typeof callback === 'function') {
    return callback();
  }
  return callback;
};

const createPortal = () => {
  // createPortal is not supported in React Native - silently return null
  return null;
};

const findDOMNode = () => {
  // findDOMNode is not supported in React Native - silently return null
  return null;
};

const render = () => {
  // ReactDOM.render is not supported in React Native - silently return undefined
  return undefined;
};

const unmountComponentAtNode = () => {
  // unmountComponentAtNode is not supported in React Native - silently return undefined
  return undefined;
};

module.exports = {
  flushSync,
  createPortal,
  findDOMNode,
  render,
  unmountComponentAtNode,
};

// Also support named exports
module.exports.flushSync = flushSync;
module.exports.createPortal = createPortal;
module.exports.findDOMNode = findDOMNode;
module.exports.render = render;
module.exports.unmountComponentAtNode = unmountComponentAtNode;