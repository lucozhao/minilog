var microeep = require('microee').prototype;

var callbacks = [],
    log = { readable: true },
    def = { format: function() { return ''; } };

for (var k in microeep) {
  if(microeep.hasOwnProperty(k)) {
    log[k] = microeep[k];
  }
}

exports = module.exports = function create(name) {
  var o   = function() { log.emit('item', name, undefined, Array.prototype.slice.call(arguments)); return o; };
  o.debug = function() { log.emit('item', name, 'debug', Array.prototype.slice.call(arguments)); return o; };
  o.info  = function() { log.emit('item', name, 'info',  Array.prototype.slice.call(arguments)); return o; };
  o.warn  = function() { log.emit('item', name, 'warn',  Array.prototype.slice.call(arguments)); return o; };
  o.error = function() { log.emit('item', name, 'error', Array.prototype.slice.call(arguments)); return o; };
  return o;
};

exports.format = function(formatter) {
  def.format = formatter;
};

exports.pipe = function(dest) {
  var config = {};
  // prevent double piping
  log.emit('unpipe', dest);
  function onItem(name, level, args) {
    var formatter = def;
    if(config.filter && !config.filter(name, level, args)) return;
    if(dest.format) {
      formatter = dest;
    }
    if(config.format) {
      formatter = config;
    }
    dest.write(formatter.format(name, level, args));
  }
  function onEnd() { !dest._isStdio && dest.end(); }

  log.on('item', onItem);
  log.on('end', onEnd);

  log.when('unpipe', function(from) {
    var match = (from == dest);
    if(match) {
      log.removeListener('item', onItem);
      log.removeListener('end', onEnd);
    }
    return match;
  });

  var chain = {
    filter: function(cb) { config.filter = cb; return chain; },
    format: function(cb) { config.format = cb; return chain; },
    pipe: exports.pipe
  };
  return chain;
};

exports.unpipe = function(from) {
  log.emit('unpipe', from);
};

// filled in separately
exports.defaultBackend = null;

exports.enable = function() {
  Minilog.pipe(exports.defaultBackend);
};

exports.disable = function() {
  Minilog.unpipe(exports.defaultBackend);
};

exports.end = function() {
  log.emit('end');
  log.removeAllListeners();
};
