0.2.0 / 2014-08-01
==================
  * Including a template from a layout changed from `{{=it.content}}` to `{{#def._content}}`
  * Exposed the compiled template cache as `require('dot-view').cache`
  * Removed the `clearCache()` method of `View` as the cache is now exposed
  * Added enabling/disabling usage of the template cache trough the Express `view cache` setting or explicitly through `options.cache` in `res.render()`

0.1.1 / 2014-07-30
==================
  * Added more documentation

0.1.0 / 2014-07-29
==================
  * Initial public release