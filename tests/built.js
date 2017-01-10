'use strict';

var _require = require('chai'),
    expect = _require.expect;

var _require2 = require('path'),
    join = _require2.join;

var fs = require('fs');

describe('JSX engine', function () {

  var files = void 0;
  beforeEach('File system, so to speak', function () {

    files = {
      './layout.jsx': '\n            <div id="app">\n                {this.props.children}\n            </div>\n          ',
      './index.jsx': '\n            <Layout>\n                <h1>{name}</h1>\n            </Layout>\n          ',
      './page.jsx': '\n            <Layout>\n                <h2>Hi</h2>\n            </Layout>\n          ',
      './page-no-layout.jsx': '<h2>{greeting}</h2>'
    };
  });

  beforeEach('Replace fs.readFile with mock', function () {
    fs.readFile = function (filePath, cb) {
      if (!files[filePath]) cb(new Error('No such file for testing.'));
      cb(null, files[filePath]);
    };
  });

  var createEngine = void 0;
  beforeEach('Get SUT', function () {
    createEngine = require(join(__dirname, '../'));
  });

  describe('without caching', function () {

    it('renders with layout and interpolated data', function () {

      var engine = createEngine({
        layoutFile: './layout.jsx'
      });

      return Promise.all([new Promise(function (resolve, reject) {
        engine('./index.jsx', { name: 'Joe' }, function (err, body) {
          if (err) reject(err);
          expect(body).to.be.equal('<div id="app"><h1>Joe</h1></div>');
          resolve();
        });
      }), new Promise(function (resolve, reject) {
        engine('./page.jsx', {}, function (err, body) {
          if (err) reject(err);
          expect(body).to.be.equal('<div id="app"><h2>Hi</h2></div>');
          resolve();
        });
      })]);
    });

    it('renders without layoutFile provided when templates wrap inside and not', function () {

      var engine = createEngine();

      return Promise.all([new Promise(function (resolve, reject) {
        engine('./page-no-layout.jsx', { greeting: 'Hi' }, function (err, body) {
          if (err) return reject(err);
          expect(body).to.be.equal('<h2>Hi</h2>');
          resolve();
        });
      }), new Promise(function (resolve, reject) {
        engine('./page.jsx', {}, function (err, body) {
          if (err) return reject(err);
          expect(body).to.be.equal('<h2>Hi</h2>');
          resolve();
        });
      })]);
    });

    it('uses updated template files (aka does not cache)', function () {

      var engine = createEngine({
        layoutFile: './layout.jsx'
      });

      return new Promise(function (resolve, reject) {
        engine('./index.jsx', { name: 'Joe' }, function (err, body) {
          if (err) return reject(err);
          expect(body).to.be.equal('<div id="app"><h1>Joe</h1></div>');
          files['./index.jsx'] = '<Layout><h4>{name}</h4></Layout>';
          engine('./index.jsx', { name: 'Gabe' }, function (err, body) {
            if (err) return reject(err);
            expect(body).to.be.equal('<div id="app"><h4>Gabe</h4></div>');
            resolve();
          });
        });
      });
    });

    it('uses updated layout files (aka does not cache)', function () {

      var engine = createEngine({
        layoutFile: './layout.jsx'
      });

      return new Promise(function (resolve, reject) {
        engine('./index.jsx', { name: 'Joe' }, function (err, body) {
          if (err) return reject(err);
          expect(body).to.be.equal('<div id="app"><h1>Joe</h1></div>');
          files['./layout.jsx'] = '<main id="new-app">{this.props.children}</main>';
          engine('./index.jsx', { name: 'Joe' }, function (err, body) {
            if (err) return reject(err);
            expect(body).to.be.equal('<main id="new-app"><h1>Joe</h1></main>');
            resolve();
          });
        });
      });
    });
  });

  describe('with caching', function () {

    it('should not produce new output when file system changes', function () {

      var engine = createEngine({
        layoutFile: './layout.jsx',
        caching: true
      });

      return new Promise(function (resolve, reject) {

        engine('./index.jsx', { name: 'Joe' }, function (err, body) {
          if (err) return reject(err);
          expect(body).to.be.equal('<div id="app"><h1>Joe</h1></div>');
          files['./layout.jsx'] = '<main>{this.props.children}</main>';
          files['./index.jsx'] = '<h4>{name}</h4>';
          engine('./index.jsx', { name: 'Joe' }, function (err, body) {
            if (err) return reject(err);
            expect(body).to.be.equal('<div id="app"><h1>Joe</h1></div>');
            resolve();
          });
        });
      });
    });
  });
});
