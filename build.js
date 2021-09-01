import {rollup} from "rollup";
import vue from "rollup-plugin-vue";
import postcss from "rollup-plugin-postcss";
import replace from "@rollup/plugin-replace";
import resolve from "@rollup/plugin-node-resolve";
import {minify as terser} from "terser";
import MagicString from "magic-string";
import fs from "fs/promises";

const dist = "./dist/";
const filename = "index";


/** @type {import("rollup").InputOptions} */
const inputOptions = {
    input: `${filename}.js`,
    plugins: [
        vue({
            preprocessStyles: true
        }),
        postcss(),
        sourceMapsPathChangerPlugin([
            ["../node_modules/", "node-modules:///"],
            ["../", "source-maps:///"],
        ]),
        cssBundlePlugin({
            async callback(result) {
                await write(result, null, `style.css`, dist);
                // console.log("extracted css was written");
            },
            importFromModule: true
        }),
        replace({
            preventAssignment: true,
            values: {
                // Change to `dev` if you want to debug the site with the Vue.js browser extension
                // It's required only if you include Vue.js to the build (when `external: ["vue"]` is commented)
                "process.env.NODE_ENV": `"production"`
            }
        }),
        resolve({
            browser: true
        }),
        appendFinallyPlugin(sourceMappingURL(filename)) // I use it since I write maps manually
    ],
    // In order to use Vue.js from CDN. (So, it possible to use minified Vue.js with not minified main code)
    // V2: "vue.runtime.min.js"         / "vue.runtime.js"
    // V3: "vue.runtime.global.prod.js" / "vue.runtime.global.js"
    external: ["vue"],
    // BUG: I get `'withCtx' is imported from external module 'vue' but never used` warning with this option enabled.
};

/** @type {import("rollup").OutputOptions} */
const outputOptions = {
    format: "iife",
    file: `${dist}${filename}.js`,
    globals: {
        "vue": "Vue"
    },
    sourcemap: true,
};

async function build() {
    const {code, map} = await bundle(inputOptions, outputOptions);
    await write(code, map, filename + ".js", dist);

    const {code: codeMin, map: mapMin} = await minify(code, map, filename);
    await write(codeMin, mapMin, filename + ".min.js", dist);
}

/** @returns {Promise<{code: String, map: import("rollup").SourceMap}>} */
async function bundle(inputOptions, outputOptions) {
    const bundle = await rollup(inputOptions);
    const result = await bundle.generate(outputOptions);
    return {
        code: result.output[0].code,
        map:  result.output[0].map
    };
}

/** @returns {Promise<{code: String, map: import("terser").RawSourceMap}>} */
async function minify(code, map, filename) {
    /** @type {import("terser").MinifyOptions} */
    const options = {
        sourceMap: {
            content: map,
            url: filename + ".min.js.map",
            includeSources: true
        },
        compress: false,
        mangle: false
    };
    /** @type {{code: string, map: string}} */
    const result = await terser(code, options);
    return {
        code: result.code,
        map: JSON.parse(result.map)
    };
}

function sourceMapsPathChangerPlugin(pathsMapping = []) {
    function changeSourceMapPaths(map) {
        function _beautify(str) {
            return pathsMapping.reduce((pre, [value, replacer]) => {
                return pre.replace(value, replacer)
            }, str);
        }
        for (let i = 0; i < map.sources.length; i++) {
            map.sources[i] = _beautify(map.sources[i]);
        }
        return map;
    }
    return {
        name: "source-maps-path-changer-plugin",
        async generateBundle(options, bundle, isWrite) {
            Object.keys(bundle).forEach(key => {
                const map = bundle[key]?.map;
                if (map) {
                    bundle[key].map = changeSourceMapPaths(map);
                }
            });
        }
    }
}

/**
 * NOTE: Works only in module project [!] Since it uses `import()`
 *
 * NOTES FOR VITE.JS:
 * - `removeCode` works only if it used as Vite plugin;
 * - `overwriteBundle` works only if it used as Rollup plugin (and did not use `removeCode`);
 *
 * @param options
 * @param options.callback - function to handle the result CSS bundle. Use to write CSS to disk, ot just for debug.
 * @param options.overwriteBundle - the name of CSS bundle that Rollup.js (Vite.js) writes to disk,
 * for example: "index.css" even if the real file name will be: "assets/index.e2206225.css".
 * @param options.importFromModule - set to `true` to get CSS from module that exports it, or `false` if it is a pure CSS code.
 * @param options.removeCode - remove code after `transform` hook. Use it if you do not use `overwriteBundle` option.
 */
function cssBundlePlugin({callback, overwriteBundle, importFromModule, removeCode} = {}) {
    const btoa = str => Buffer.from(str, "binary").toString("base64");
  //const atob = b64 => Buffer.from(b64, "base64").toString("binary");

    const entries = [];
    async function resultCssBundle() {
        const results = [];
        entries.sort((a, b) => a.id.localeCompare(b.id));
        for (const {code, id} of entries) {
            // C:\Projects\formatted-number\components\Main.vue?vue&type=style&index=0&id=f889b9d8&scoped=true&lang.css
            const filenameWithQueryParams = id.match(/[^\\\/]+$/)[0];    // Main.vue?vue&type=style&index=0&id=f889b9d8&scoped=true&lang.css
            const filename = filenameWithQueryParams.match(/^[^?]+/)[0]; // Main.vue

            let css;
            if (importFromModule) {
                try {
                    // import styleInject from 'C:/Projects...
                    // styleInject(css_248z);
                    const importIndex = code.indexOf("import styleInject");
                    const trimStart = importIndex === -1 ? code.length : importIndex;
                    const trimmedCode = code.substring(0, trimStart);

                    const base64Code = "data:text/javascript;base64," + btoa(trimmedCode);
                    css = (await import(base64Code)).default;
                } catch (e) {
                    console.log("Failed to load CSS as a module. Returns as pure code. Use `importFromModule: false`");
                    css = code;
                }
            } else {
                css = code;
            }

            const indexOfSourceMap = css.indexOf("/*# sourceMappingURL");
            const to = indexOfSourceMap === -1 ? css.length : indexOfSourceMap;
            const from = css.charAt(0) === "\n" ? 1 : 0;
            if (css.trim()) {
                const result = "/* " + filename + " */\n" + css.substring(from, to);
                results.push(result);
            }
        }
        return results.join("\n");
    }

    return {
        name: "css-bundle-plugin",
        transform(code, id) {
            const isCss = [".css", ".sass", ".scss", ".less", ".stylus"].some(ext => id.endsWith(ext));
            if (isCss) {
                entries.push({code, id});
                if (removeCode) {
                    return {code: "", map: {mappings: ""}};
                }
            }
        },
        async generateBundle(opts, bundles, isWrite) {
            const bunchCss = await resultCssBundle();
            if (isWrite && overwriteBundle) {
                const bundle = Object.values(bundles).find(bundle => bundle.name === overwriteBundle);
                if (bundle) {
                    bundle.source = bunchCss;
                }
            }
            if (typeof callback === "function") {
                callback(bunchCss);
            }
        }
    }
}


async function write(code, map, name, dist) {
    await fs.mkdir(dist, {recursive: true});
    await fs.writeFile(`${dist}${name}`, code);
    if (map) {
        const _map = JSON.stringify(map);
        await fs.writeFile(`${dist}${name}.map`, _map);
    }
}

// It's used to append `//# sourceMappingURL=name.js.map`
function appendFinallyPlugin(text) {
    return {
        name: "append-text-before-end",
        renderChunk(code, chunkInfo, outputOptions) {
            if (!code) {
                return null;
            }

            const magicString = new MagicString(code);
            magicString.append(text);
            code = magicString.toString();
            const map = magicString.generateMap({
                hires: true,
                includeContent: true,
            });
            return {code, map};
        }
    };
}
function sourceMappingURL(name, ext = "js") {
    return `\n//# sourceMappingURL=${name}.${ext}.map`
}

!async function main() {
    console.time("build");
    await build();
    console.timeEnd("build");
}();
