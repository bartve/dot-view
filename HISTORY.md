0.3.0 / 2015-01-22
==================
  * Added the possibility to define a layout from within a template file with `{{##def._layout:path/to/layout.dot#}}`
  * Added the possibility to include a sub-template file from a within template file with `{{#def.include('path/to/sub-template.dot')}}`

0.2.1 / 2014-10-31
==================
  * Better JSDoc 3 documentation

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