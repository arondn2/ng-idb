'use strict';

export default function (Clazzer, io, $log) { 'ngInject';

  // ---------------------------------------------------------------------------
  // Atributos falntantes por definir
  // $socket

  return new
  // ---------------------------------------------------------------------------
  // Constructor
  Clazzer(function idbSocket(url, accessTokenId, currentUserId){

    new Clazzer(this)
      .static('$url', url || idbSocket.$defUrlServer)
      .static('$accessTokenId', accessTokenId || idbSocket.$defAccessTokenId)
      .static('$currentUserId', currentUserId || idbSocket.$defCurrentUserId);

    this.$connect();

  })

  // ---------------------------------------------------------------------------
  .property('$_listeners', { value:[] })

  // ---------------------------------------------------------------------------
  // Conectarse al servidor
  .method('$connect', function () {

    // Creating connection with server
    const socket = this.$socket = io.connect(this.$url);

    // This part is only for login users for authenticated $socket connection between client and server.
    // If you are not using login page in you website then you should remove rest piece of code..
    socket.on('connect', function(){
      $log.log('connected');

      socket.emit('authentication', {
        id: this.$accessTokenId,
        userId: this.$currentUserId,
      });
      
      socket.on('authenticated', function() {
        // use the $socket as usual
        $log.log('User is authenticated');
      });

    });

  })

  // ---------------------------------------------------------------------------
  .method('$subscribe', function (options, cb) {

    let name = options.modelName + '.' + options.eventName;

    if (typeof options.modelId === 'number') {
      name = name + '.' + options.modelId;
    }

    this.$socket.on(name, cb);
    
    //Push the container..
    this.$pushListener(name, cb);

  })

  // ---------------------------------------------------------------------------
  .method('$pushListener', function (name, cb) {

    this.$_listeners.push(name);

  })

  // ---------------------------------------------------------------------------
  .method('$unsubscribe',function (subscriptionName) {

    this.$socket.removeAllListeners(subscriptionName);  
    var idx = this.$_listeners.indexOf(subscriptionName);
    if (idx != -1){
      this.$_listeners.splice(idx, 1);
    }

  })

  // ---------------------------------------------------------------------------
  // Asigna la URL de servidor por defecto
  .static('$setUrlServer', function (url) {

    this.$defUrlServer = url;
    return this;

  })

  // ---------------------------------------------------------------------------
  // ASigna las credenciales por defecto
  .static('$setCredentials', function (accessTokenId, currentUserId) {

    this.$defAccessTokenId = accessTokenId;
    this.$defCurrentUserId = currentUserId;
    return this;

  })

  // ---------------------------------------------------------------------------
  .clazz

  // ---------------------------------------------------------------------------
  .$setUrlServer(null)
  .$setCredentials(null, null);

}