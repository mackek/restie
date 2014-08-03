var Model, Restie, bakeModels, merge, setRequestOptions;

Function.prototype.clone = function() {
  var clone, property;
  clone = function() {};
  for (property in this) {
    if (this.hasOwnProperty(property)) {
      clone[property] = this[property];
    }
  }
  return clone;
};

Restie = (function() {
  function Restie() {}

  Restie.set = function(options) {
    var key, _results;
    if (options == null) {
      options = {};
    }
    if (!this.options) {
      this.options = {
        primaryKey: 'id'
      };
    }
    _results = [];
    for (key in options) {
      _results.push(this.options[key] = options[key]);
    }
    return _results;
  };

  Restie.define = function(name, parent, options) {
    var action, key, model;
    if (options == null) {
      options = {};
    }
    model = Model.clone();
    if (parent) {
      model.prototype = new parent;
    } else {
      model.prototype = new Model();
    }
    console.log("Model: ", model);
    model.prototype.resourceName = model.resourceName = name.pluralize().toLowerCase();
    model.prototype.options = model.options = {};
    for (key in this.options) {
      model.prototype.options[key] = model.options[key] = this.options[key];
    }
    model["find_by_" + (model.options.primaryKey.underscore())] = model["findBy" + (model.options.primaryKey.camelize())] = model.findByPrimaryKey;
    for (action in options.actions) {
      this.addActionToModel(model, action, options.actions[action]);
    }
    model.prototype.model = model.model = model;
    return model;
  };

  Restie.addActionToModel = function(model, action, options) {
    return model.prototype[action] = function() {
      var callback, i, lastArg, param, paramVals, params, request, _i, _len, _ref;
      lastArg = arguments[arguments.length - 1];
      if (typeof lastArg === "function") {
        callback = arguments[arguments.length - 1];
      }
      if (options.params) {
        paramVals = Array.prototype.slice.call(arguments, 0, callback ? -1 : void 0);
        params = {};
        _ref = options.params;
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          param = _ref[i];
          params[param] = paramVals[i];
        }
      }
      request = {
        url: "" + model.options.urls.base + "/" + model.resourceName + "/" + this[model.options.primaryKey] + "/" + (options.path ? options.path : action),
        method: options.method ? options.method : 'PUT',
        params: params
      };
      console.log("Making request " + action);
      request = this.setRequestOptions(request);
      return Restie.request(request, function(err, res, body) {
        if (callback) {
          return callback(err, res, body);
        }
      });
    };
  };

  return Restie;

})();

setRequestOptions = function(options, request) {
  var field, header, param;
  if (!request.headers) {
    request.headers = {};
  }
  if (!request.form) {
    request.form = {};
  }
  request.qs = !request.params ? {} : request.params;
  if (options.defaults) {
    if (options.defaults.headers) {
      for (header in options.defaults.headers) {
        request.headers[header] = options.defaults.headers[header];
      }
    }
    if (options.defaults.fields) {
      for (field in options.defaults.fields) {
        request.form[field] = options.defaults.fields[field];
      }
    }
    if (options.defaults.params) {
      for (param in options.defaults.params) {
        request.qs[param] = options.defaults.params[param];
      }
    }
  }
  return request;
};

bakeModels = function(items, _model) {
  var item, key, model, models, _i, _len;
  models = [];
  for (_i = 0, _len = items.length; _i < _len; _i++) {
    item = items[_i];
    model = new _model;
    for (key in item) {
      model[key] = item[key];
    }
    models.push(model);
  }
  return models;
};

merge = function(a, b) {
  var key;
  for (key in a) {
    b[key] = a[key];
  }
  return b;
};

Model = (function() {
  function Model(fields) {
    var key;
    for (key in fields) {
      this[key] = fields[key];
    }
  }

  Model.set = function(options) {
    var key, _results;
    if (options == null) {
      options = {};
    }
    if (!this.options) {
      this.options = {};
    }
    _results = [];
    for (key in options) {
      _results.push(this.options[key] = options[key]);
    }
    return _results;
  };

  Model.bakeModels = function(items) {
    return bakeModels(items, this.model);
  };

  Model.prototype.bakeModels = function(items) {
    return bakeModels(items, this.model);
  };

  Model.prototype.setRequestOptions = function(request) {
    return setRequestOptions(this.options, request);
  };

  Model.setRequestOptions = function(request) {
    return setRequestOptions(this.options, request);
  };

  Model.all = function(callback) {
    var request, that;
    request = {
      url: "" + this.options.urls.base + "/" + this.resourceName,
      method: 'GET'
    };
    request = this.setRequestOptions(request);
    that = this;
    return Restie.request(request, function(err, res, body) {
      if (res.statusCode === 200) {
        return callback(false, that.bakeModels(body));
      } else {
        return callback(res, []);
      }
    });
  };

  Model.where = function(options, callback) {
    var request;
    request = {
      url: "" + this.options.urls.base + "/" + this.resourceName,
      method: 'GET',
      params: options
    };
    request = this.setRequestOptions(request);
    return Restie.request(request, (function(_this) {
      return function(err, res, body) {
        if (res.statusCode === 200) {
          return callback(false, _this.bakeModels(body));
        } else {
          return callback(res, []);
        }
      };
    })(this));
  };

  Model.findByPrimaryKey = function(value, callback) {
    var request, that;
    request = {
      url: "" + this.options.urls.base + "/" + this.resourceName + "/" + value,
      method: 'GET'
    };
    request = this.setRequestOptions(request);
    that = this;
    return Restie.request(request, function(err, res, body) {
      if (res.statusCode === 200) {
        return callback(false, that.bakeModels([body])[0]);
      } else {
        return callback(res, {});
      }
    });
  };

  Model.create = function(fields, callback) {
    var key, model;
    model = new this.model;
    for (key in fields) {
      model[key] = fields[key];
    }
    return model.save(callback);
  };

  Model.prototype.save = function(callback) {
    var fields, key, primaryKey, request, that;
    fields = {};
    for (key in this) {
      if (this.hasOwnProperty(key)) {
        fields[key] = this[key];
      }
    }
    request = {
      url: "" + this.options.urls.base + "/" + this.resourceName,
      method: 'POST'
    };
    if (this.options.wrapFields) {
      key = this.resourceName.singularize();
      request.form = {
        key: fields
      };
    } else {
      request.form = fields;
    }
    primaryKey = this.options.primaryKey || 'id';
    if (fields[primaryKey]) {
      request.url += "/" + fields[primaryKey];
      request.method = 'PUT';
      request.form._method = 'PUT';
    }
    request = this.setRequestOptions(request);
    that = this;
    return Restie.request(request, function(err, res, body) {
      if (res.statusCode === 201 || res.statusCode === 200) {
        that[primaryKey] = body[primaryKey];
        return callback(false, that.bakeModels([body])[0]);
      } else {
        return callback(res);
      }
    });
  };

  Model.prototype.remove = function(callback) {
    var primaryKey, request;
    primaryKey = this.options.primaryKey || 'id';
    request = {
      url: "" + this.options.urls.base + "/" + this.resourceName + "/" + this[primaryKey],
      method: 'POST',
      form: {
        _method: 'DELETE'
      }
    };
    request = this.setRequestOptions(request);
    return Restie.request(request, callback);
  };

  return Model;

})();

if (window.location != null) {
  Restie.env = 'browser';
  Restie.adapter = new jQueryRequestAdapter;
  Restie.set({
    urls: {
      base: window.location.host
    }
  });
  window.Restie = Restie;
} else {
  Restie.env = 'nodejs';
  Restie.adapter = new NodejsRequestAdapter;
  module.exports = Restie;
}

Restie.request = function(options, callback) {
  if (Restie.options.before) {
    Restie.options.before(options);
  }
  return Restie.adapter.request(options, function(err, res, body) {
    body = JSON.parse(body);
    if (res.statusCode === 200 || res.statusCode === 201) {
      if (Restie.options.after) {
        return Restie.options.after(false, res, body, callback);
      } else {
        return callback(err, res, body);
      }
    } else {
      return callback(err, res, body);
    }
  });
};
