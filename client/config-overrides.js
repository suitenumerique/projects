const fs = require('fs');
const path = require('path');

const BASE_URL_PLACEHOLDER = 'BASE_URL_PLACEHOLDER';
const THEME_PREFIX_PLACEHOLDER = 'THEME_PREFIX_PLACEHOLDER';
const DISABLE_DARK_MODE_PLACEHOLDER = 'DISABLE_DARK_MODE_PLACEHOLDER';
const SERVICE_NAME_PLACEHOLDER = 'SERVICE_NAME_PLACEHOLDER';

const replaceInFile = (file, ...pairs) => {
  fs.readFile(file, 'utf8', (readError, data) => {
    if (readError) {
      throw new Error(`${readError}`);
    }

    let res = data;

    // eslint-disable-next-line no-restricted-syntax
    for (const [search, replace] of pairs) {
      res = res.replaceAll(search, replace);
    }

    fs.writeFile(file, res, 'utf8', (writeError) => {
      if (writeError) {
        throw new Error(`${writeError}`);
      }
    });
  });
};

const replacePlaceholders = (compiler) => {
  compiler.hooks.assetEmitted.tap('ReplacePlaceholders', (file, info) => {
    const hasBaseUrl = info.content.indexOf(BASE_URL_PLACEHOLDER) >= 0;
    const hasThemePrefix = info.content.indexOf(THEME_PREFIX_PLACEHOLDER) >= 0;
    const hasDisableDarkMode = info.content.indexOf(DISABLE_DARK_MODE_PLACEHOLDER) >= 0;
    const hasServiceName = info.content.indexOf(SERVICE_NAME_PLACEHOLDER) >= 0;

    if (!hasBaseUrl && !hasThemePrefix && !hasDisableDarkMode && !hasServiceName) {
      return;
    }

    if (/\.css$/.exec(info.targetPath)) {
      // For CSS 'url(...)' import we can use relative import
      const relPath = path
        .relative(path.dirname(info.targetPath), info.outputPath)
        .replace(/\\/g, '/');
      replaceInFile(info.targetPath, [BASE_URL_PLACEHOLDER, `${relPath}/`]);
    } else if (/\.js$/.exec(info.targetPath)) {
      // For JS 'import ... from "some-asset"' we can get the variable injected in the window object
      // eslint-disable-next-line no-template-curly-in-string
      replaceInFile(info.targetPath, [`"${BASE_URL_PLACEHOLDER}"`, '`${window.BASE_URL}/`']);
    } else if (/index\.html$/.exec(info.targetPath)) {
      // For the main html file, we set placeholders for sails to inject the correct values at runtime
      replaceInFile(
        info.targetPath,
        [BASE_URL_PLACEHOLDER, '<%= BASE_URL %>'],
        [THEME_PREFIX_PLACEHOLDER, '<%= THEME_PREFIX %>'],
        [SERVICE_NAME_PLACEHOLDER, '<%= SERVICE_NAME %>'],
      );
    }
  });
};

module.exports = function override(config, env) {
  if (env === 'production') {
    const plugins = config.plugins.map((plugin) => {
      if (plugin.constructor.name === 'InterpolateHtmlPlugin') {
        const newPlugin = plugin;
        newPlugin.replacements.PUBLIC_URL = BASE_URL_PLACEHOLDER;
        newPlugin.replacements.THEME_PREFIX = THEME_PREFIX_PLACEHOLDER;
        newPlugin.replacements.SERVICE_NAME = SERVICE_NAME_PLACEHOLDER;

        return newPlugin;
      }

      return plugin;
    });

    return {
      ...config,
      output: { ...config.output, publicPath: BASE_URL_PLACEHOLDER },
      plugins: [...plugins, { apply: replacePlaceholders }],
    };
  }

  // In dev mode, also inject THEME_PREFIX/SERVICE_NAME into the HTML interpolation
  const plugins = config.plugins.map((plugin) => {
    if (plugin.constructor.name === 'InterpolateHtmlPlugin') {
      const newPlugin = plugin;
      newPlugin.replacements.THEME_PREFIX = process.env.THEME_PREFIX || '';
      newPlugin.replacements.SERVICE_NAME = process.env.SERVICE_NAME || 'Projets';

      return newPlugin;
    }

    return plugin;
  });

  return { ...config, plugins };
};
