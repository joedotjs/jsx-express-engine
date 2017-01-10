'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _reactJsx = require('react-jsx');

var _react = require('react');

var _fs = require('fs');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var read = function read(filepath) {
  return new Promise(function (resolve, reject) {
    (0, _fs.readFile)(filepath, function (err, contents) {
      if (err) reject(err);else resolve(contents);
    });
  });
};

var createTemplateMachine = function createTemplateMachine(filename, templateText) {
  return (0, _reactJsx.server)(templateText, {
    raw: true, // removes data-react-ids from HTML.
    filename: filename // for debugging
  });
};

var createFromFileSystem = function createFromFileSystem(filename) {
  return read(filename).then(function (contents) {
    return createTemplateMachine(filename, contents);
  });
};

var buildRetrieve = function buildRetrieve(caching) {

  if (caching) {
    var _ret = function () {

      var cache = {};
      return {
        v: function v(filePath) {
          if (!cache[filePath]) {
            return createFromFileSystem(filePath).then(function (templateRenderer) {
              // A template renderer -- not the text itself -- is cached
              cache[filePath] = templateRenderer;
              return cache[filePath];
            });
          } else {
            return Promise.resolve(cache[filePath]);
          }
        }
      };
    }();

    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
  } else {
    return createFromFileSystem;
  }
};

var buildLayoutRetrieve = function buildLayoutRetrieve(filePath, shouldCache) {

  if (!filePath) {
    // No supplied layout.
    return function () {
      return function (_Component) {
        _inherits(_class, _Component);

        function _class() {
          _classCallCheck(this, _class);

          return _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).apply(this, arguments));
        }

        _createClass(_class, [{
          key: 'render',
          value: function render() {
            return this.props.children;
          }
        }]);

        return _class;
      }(_react.Component);
    };
  }

  var createLayoutComponentFromFilePath = function createLayoutComponentFromFilePath() {
    return read(filePath).then(function (layoutContents) {
      return (0, _reactJsx.server)(layoutContents, { filename: filePath });
    }).then(function (renderer) {
      return function (_Component2) {
        _inherits(_class2, _Component2);

        function _class2() {
          _classCallCheck(this, _class2);

          return _possibleConstructorReturn(this, (_class2.__proto__ || Object.getPrototypeOf(_class2)).apply(this, arguments));
        }

        _createClass(_class2, [{
          key: 'render',
          value: function render() {
            return renderer(this);
          }
        }]);

        return _class2;
      }(_react.Component);
    });
  };

  if (shouldCache) {
    var _ret2 = function () {

      var LayoutComponent = void 0;

      return {
        v: function v() {
          if (!LayoutComponent) {
            return createLayoutComponentFromFilePath().then(function (createdComponent) {
              LayoutComponent = createdComponent;
              return LayoutComponent;
            });
          } else {
            return Promise.resolve(LayoutComponent);
          }
        }
      };
    }();

    if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
  } else {

    return function () {
      return createLayoutComponentFromFilePath();
    };
  }
};

exports.default = function () {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};


  options = Object.assign({
    caching: false,
    layoutFile: null
  }, options);

  var retrieveTemplateRenderer = buildRetrieve(options.caching);
  var retrieveLayoutComponent = buildLayoutRetrieve(options.layoutFile, options.caching);

  return function (filePath, templateParameters, callback) {

    Promise.all([retrieveLayoutComponent(), retrieveTemplateRenderer(filePath)]).then(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2),
          LayoutComponent = _ref2[0],
          executeTemplate = _ref2[1];

      templateParameters.Layout = LayoutComponent; // Add Layout to rendering.
      callback(null, executeTemplate(templateParameters, { html: true } // Sets renderer to output HTML instead of React nodes.
      ));
    }).catch(callback);
  };
};
