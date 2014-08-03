Function::clone = () ->
  clone = ->
  for property of @
    clone[property] = @[property] if @hasOwnProperty property
  clone

class Restie
  @set: (options = {}) -> # setting default options for all models
    @options = {primaryKey: 'id'} if not @options
    for key of options
      @options[key] = options[key]
  
  @define: (name, parent, options = {}) ->
    model = Model.clone()
    if parent
      #parent.prototype = new Model()
      model.prototype = new parent
    else
      model.prototype = new Model()
    console.log("Model: ", model)
    model::resourceName = model.resourceName = name.pluralize().toLowerCase() # Post -> posts
    model::options = model.options = {}
    for key of @options
      model::options[key] = model.options[key] = @options[key]
    model["find_by_#{ model.options.primaryKey.underscore() }"] = model["findBy#{ model.options.primaryKey.camelize() }"] = model.findByPrimaryKey
    for action of options.actions
      @addActionToModel(model, action, options.actions[action])
    model::model = model.model = model
    model
  @addActionToModel: (model, action, options) ->
    model::[action] = () ->
      lastArg = arguments[arguments.length - 1]
      if typeof(lastArg) == "function"
        callback = arguments[arguments.length - 1]
      if options.params
        paramVals = Array.prototype.slice.call(arguments, 0, if callback then -1 else undefined)
        params = {}
        for param, i in options.params
          params[param] = paramVals[i]
      request=
        url: "#{model.options.urls.base}/#{model.resourceName}/#{@[model.options.primaryKey]}/#{if options.path then options.path else action}"
        method: if options.method then options.method else 'PUT'
        params: params
      console.log("Making request #{action}")
      request = @setRequestOptions request
      Restie.request request, (err,res,body) ->
        if callback
          callback err,res,body
 
setRequestOptions = (options, request) ->
  request.headers = {} if not request.headers
  request.form = {} if not request.form
  request.qs = if not request.params then {} else request.params
  
  if options.defaults
    if options.defaults.headers
      for header of options.defaults.headers
        request.headers[header] = options.defaults.headers[header]
    
    if options.defaults.fields
      for field of options.defaults.fields
        request.form[field] = options.defaults.fields[field]
    
    if options.defaults.params
      for param of options.defaults.params
        request.qs[param] = options.defaults.params[param]
  
  request

bakeModels = (items, _model) ->
  models = []
  for item in items
    model = new _model
    for key of item # setting keys and values
      model[key] = item[key]
    models.push model
  models

merge = (a, b) -> # merge object a into object b
  for key of a
    b[key] = a[key]
  b

class Model # Generic model for all resources
  constructor: (fields) ->
    for key of fields
      @[key] = fields[key]
  
  @set: (options = {}) -> # setting default options for a specific model
    @options = {} if not @options
    for key of options
      @options[key] = options[key]
  
  @bakeModels: (items) -> # converting plain objects into Restie models
    #console.log("@bakeModels #{JSON.stringify(@)}")
    bakeModels items, @model
  
  bakeModels: (items) ->
    #console.log("bakeModels #{JSON.stringify(@)}")
    bakeModels items, @model
  
  setRequestOptions: (request) ->
    #console.log("setRequestOptions #{JSON.stringify(@)}")
    setRequestOptions @options, request
  
  @setRequestOptions: (request) ->
    #console.log("@setRequestOptions #{JSON.stringify(@)}")
    setRequestOptions @options, request
  
  @all: (callback) -> # getting all items
    request=
      url: "#{ @options.urls.base }/#{ @resourceName }"
      method: 'GET'
    
    request = @setRequestOptions request
      
    that = @
    Restie.request request, (err, res, body) ->
      if res.statusCode is 200
        callback no, that.bakeModels body
      else
        callback res, []
  @where: (options, callback) ->
    request=
      url: "#{ @options.urls.base }/#{ @resourceName }"
      method: 'GET'
      params: options
    request = @setRequestOptions request
    Restie.request request, (err, res, body) =>
      if res.statusCode is 200
        callback no, @.bakeModels body
      else
        callback res, []

  @findByPrimaryKey: (value, callback) -> # finding by primary key
    request=
      url: "#{ @options.urls.base }/#{ @resourceName }/#{ value }"
      method: 'GET'
    
    request = @setRequestOptions request
    
    that = @
    Restie.request request, (err, res, body) ->
      if res.statusCode is 200
        callback no, that.bakeModels([body])[0]
      else
        callback res, {}

  @create: (fields, callback) -> # creating item
    model = new @model
    for key of fields
      model[key] = fields[key]
    model.save callback
  
  save: (callback) -> # creating or updating item
    fields = {}
    for key of @ # finding item's fields
      fields[key] = @[key] if @hasOwnProperty key
    
    request=
      url: "#{ @options.urls.base }/#{ @resourceName }"
      method: 'POST'
    
    if @options.wrapFields # post[key] or key, in POST body
      key = @resourceName.singularize()
      request.form=
        key: fields
    else
      request.form = fields
    
    primaryKey = @options.primaryKey or 'id'
    
    if fields[primaryKey]
      request.url += "/#{ fields[primaryKey] }"
      request.method = 'PUT'
      request.form._method = 'PUT'
    
    request = @setRequestOptions request
    
    that = @
    Restie.request request, (err, res, body) ->
      if res.statusCode is 201 or res.statusCode is 200
        that[primaryKey] = body[primaryKey]
        callback no, that.bakeModels([body])[0]
      else
        callback res
  
  remove: (callback) ->
    primaryKey = @options.primaryKey or 'id'
    request=
      url: "#{ @options.urls.base }/#{ @resourceName }/#{ @[primaryKey] }"
      method: 'POST'
      form:
        _method: 'DELETE'
    
    request = @setRequestOptions request
    
    Restie.request request, callback

if window.location?
  Restie.env = 'browser'
  Restie.adapter = new jQueryRequestAdapter
  Restie.set
    urls:
      base: window.location.host
  window.Restie = Restie
else
  Restie.env = 'nodejs'
  Restie.adapter = new NodejsRequestAdapter
  module.exports = Restie

Restie.request = (options, callback) ->
  if Restie.options.before
    Restie.options.before options
  Restie.adapter.request options, (err, res, body) ->
    body = JSON.parse(body)
    if res.statusCode is 200 or res.statusCode is 201
      if Restie.options.after
        Restie.options.after(no, res, body, callback)
      else
        #console.log("Request response", err, res, body)
        callback(err, res, body)
    else
      callback(err, res, body)
