const {expect} = require('chai');
const {join} = require('path');
const fs = require('fs');

describe('JSX engine', function () {

  let files;
  beforeEach('File system, so to speak', () => {

    files = {
      './layout.jsx': `
            <div id="app">
                {this.props.children}
            </div>
          `,
      './index.jsx': `
            <Layout>
                <h1>{name}</h1>
            </Layout>
          `,
      './page.jsx': `
            <Layout>
                <h2>Hi</h2>
            </Layout>
          `,
      './page-no-layout.jsx': '<h2>{greeting}</h2>'
    };

  });

  beforeEach('Replace fs.readFile with mock', () => {
    fs.readFile = (filePath, cb) => {
      if (!files[filePath]) cb(new Error('No such file for testing.'));
      cb(null, files[filePath]);
    };
  });

  let createEngine;
  beforeEach('Get SUT', () => {
    createEngine = require(join(__dirname, '../'));
  });

  describe('without caching', () => {

    it('renders with layout and interpolated data', () => {

      const engine = createEngine({
        layoutFile: './layout.jsx'
      });

      return Promise.all([
        new Promise((resolve, reject) => {
          engine('./index.jsx', {name: 'Joe'}, (err, body) => {
            if (err) reject(err);
            expect(body).to.be.equal('<div id="app"><h1>Joe</h1></div>');
            resolve();
          });
        }),
        new Promise((resolve, reject) => {
          engine('./page.jsx', {}, (err, body) => {
            if (err) reject(err);
            expect(body).to.be.equal('<div id="app"><h2>Hi</h2></div>');
            resolve();
          });
        })
      ]);

    });

    it('renders without layoutFile provided when templates wrap inside and not', () => {

      const engine = createEngine();

      return Promise.all([
        new Promise((resolve, reject) => {
          engine('./page-no-layout.jsx', {greeting: 'Hi'}, (err, body) => {
            if (err) return reject(err);
            expect(body).to.be.equal('<h2>Hi</h2>');
            resolve();
          });
        }),
        new Promise((resolve, reject) => {
          engine('./page.jsx', {}, (err, body) => {
            if (err) return reject(err);
            expect(body).to.be.equal('<h2>Hi</h2>');
            resolve();
          });
        })
      ]);

    });

    it('uses updated template files (aka does not cache)', () => {

      const engine = createEngine({
        layoutFile: './layout.jsx'
      });

      return new Promise((resolve, reject) => {
        engine('./index.jsx', {name: 'Joe'}, (err, body) => {
          if (err) return reject(err);
          expect(body).to.be.equal('<div id="app"><h1>Joe</h1></div>');
          files['./index.jsx'] = '<Layout><h4>{name}</h4></Layout>';
          engine('./index.jsx', { name: 'Gabe' }, (err, body) => {
            if (err) return reject(err);
            expect(body).to.be.equal('<div id="app"><h4>Gabe</h4></div>');
            resolve();
          })
        });
      });

    });

    it('uses updated layout files (aka does not cache)', () => {

      const engine = createEngine({
        layoutFile: './layout.jsx'
      });

      return new Promise((resolve, reject) => {
        engine('./index.jsx', {name: 'Joe'}, (err, body) => {
          if (err) return reject(err);
          expect(body).to.be.equal('<div id="app"><h1>Joe</h1></div>');
          files['./layout.jsx'] = '<main id="new-app">{this.props.children}</main>';
          engine('./index.jsx', { name: 'Joe' }, (err, body) => {
            if (err) return reject(err);
            expect(body).to.be.equal('<main id="new-app"><h1>Joe</h1></main>');
            resolve();
          })
        });
      });

    });

  });

  describe('with caching', () => {

    it('should not produce new output when file system changes', () => {

      const engine = createEngine({
        layoutFile: './layout.jsx',
        caching: true
      });

      return new Promise((resolve, reject) => {
        engine('./index.jsx', {name: 'Joe'}, (err, body) => {
          if (err) return reject(err);
          expect(body).to.be.equal('<div id="app"><h1>Joe</h1></div>');
          files['./layout.jsx'] = '<main>{this.props.children}</main>';
          files['./index.jsx'] = '<h4>{name}</h4>';
          engine('./index.jsx', {name: 'Joe'}, (err, body) => {
            if (err) return reject(err);
            expect(body).to.be.equal('<div id="app"><h1>Joe</h1></div>');
            resolve();
          });
        });
      });

    });

  });

});