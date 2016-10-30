'use strict';

/**
 * idb
 * -----------------------------------------------------------------------------
 * [Exposed=(Window,Worker)]
 * interface IDBFactory {
 *   IDBOpenDBRequest open(DOMString name, [EnforceRange] optional unsigned long long version);
 *   IDBOpenDBRequest deleteDatabase(DOMString name);
 *   short cmp(any first, any second);
 * };
 * -----------------------------------------------------------------------------
 * [Exposed=(Window,Worker)]
 * interface IDBDatabase : EventTarget {
 *   readonly attribute DOMString          name;
 *   readonly attribute unsigned long long version;
 *   readonly attribute DOMStringList      objectStoreNames;
 * 
 *   IDBTransaction transaction((DOMString or sequence<DOMString>) storeNames, optional IDBTransactionMode mode = "readonly");
 *   void           close();
 *   IDBObjectStore createObjectStore(DOMString name, optional IDBObjectStoreParameters options);
 *   void           deleteObjectStore(DOMString name);
 * 
 *   // Event handlers:
 *   attribute EventHandler onabort;
 *   attribute EventHandler onclose;
 *   attribute EventHandler onerror;
 *   attribute EventHandler onversionchange;
 * };
 * 
 * dictionary IDBObjectStoreParameters {
 *   (DOMString or sequence<DOMString>)? keyPath = null;
 *   boolean                             autoIncrement = false;
 * };me
 */
export default function (Clazzer, idbStore, idbModel2, idbOpenDBRequest, idbTransaction, $log) { 'ngInject';
  
  // En la siguiente linea, puede incluir prefijos de implementacion que quiera probar.
  const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
  // No use "const indexedDB = ..." Si no está en una función.
  // Por otra parte, puedes necesitar referencias a algun objeto window.IDB*:
  const IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
  const IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
  // (Mozilla nunca ha prefijado estos objetos, por lo tanto no necesitamos window.mozIDB*)
  
  if (!indexedDB) {
    alert('Su navegador no soporta una versión estable de indexedDB. Tal y como las características no serán validas');
    return;
  }
  
  // ---------------------------------------------------------------------------
  // Atributos falntantes por definir
  // $me
  // $opened
  
  // ---------------------------------------------------------------------------
  // Constructor  
  const idb = function idb(name, version, socket) {

    new Clazzer(this)

      .static('$name', name)
      .static('$version', version)
      .static('$socket', socket)
      
      .static('$upgradeneededs', [])
      .static('$models', []);

  };

  return new
  // ---------------------------------------------------------------------------
  // Constructor
  Clazzer(idb)

  // ---------------------------------------------------------------------------
  // Herencia
  .inherit(EventTarget)

  // ---------------------------------------------------------------------------
  // Getters
  .getter('$objectStoreNames', 'objectStoreNames')

  // ---------------------------------------------------------------------------
  // Event handlers
  .handlerEvent('$aborted', 'onabort')
  .handlerEvent('$closed', 'onclose')
  .handlerEvent('$error', 'onerror')
  .handlerEvent('$versionChanged', 'onversionchange')

  // ---------------------------------------------------------------------------
  .static('$open', function (name, version) {

    return new idbOpenDBRequest(indexedDB.open(name, version));

  })

  // ---------------------------------------------------------------------------
  .static('$drop', function (name) {
    
    return new idbOpenDBRequest(indexedDB.deleteDatabase(name));

  })

  // ---------------------------------------------------------------------------
  .static('$cmp', function (first, second) {
    
    return indexedDB.cmp(first, second);

  })

  // ---------------------------------------------------------------------------
  .method('$upgradeneeded', function (cb) {
    
    this.$upgradeneededs.push(cb);
    return this;

  })

  // ---------------------------------------------------------------------------
  .method('$automigration', function (allMigrations) {

    return this.$upgradeneeded(function (thiz, openRequest, event) {
      Object.keys(allMigrations).map(function (version) {

        if (event.oldVersion < version && version <= event.newVersion) {

          const migrations = Array.isArray(allMigrations[version])?
            allMigrations[version]:[allMigrations[version]];

          $log.log('migration v'+version+' starts');
          migrations.map(function (migration) {
            migration(thiz, openRequest, event);

          });
          $log.log('migration v'+version+' ends');
        }

      });

    });
  })

  // ---------------------------------------------------------------------------
  .method('$open', function (cb, cbErr) { const thiz = this;

    let lastRq = null;
    let lastEvent = null;

    if (!thiz.$opened) {

      thiz.$opened = (lastRq = idb.$open(thiz.$name, thiz.$version)
        .$upgradeneeded(function (event) {
          thiz.$me = event.target.result;
          thiz.$upgradeneededs.map(function (cb) {
            cb.apply(thiz, [thiz, lastRq, event]);
          });
        }))

      .$promise
        .then(function (event) {
          thiz.$me = event.target.result;
          lastEvent = event;
          if (cb) cb(thiz, lastRq, event);
          return thiz;
        })
        .catch(function (event) {
          lastRq = null;
          thiz.$opened = null;
          if (cbErr) cbErr(thiz, lastRq, event);
          return thiz;
        });

    } else if (cb) {

      cb(thiz, lastRq, lastEvent);

    }

    return thiz.$opened;

  })

  // ---------------------------------------------------------------------------
  .method('$drop', function (cb) { const thiz = this;
    thiz.$opened = null;

    return new Promise(function (resolve, reject) {

      const rq = idb.$drop(thiz.$name)
        .$success(function (event) {
          resolve(thiz)
        })
        .$fail(function (event) {
          reject(event);
        });
      if (cb) cb(rq);

    });

  })

  // ---------------------------------------------------------------------------
  .method('$close', function () {

    this.$me.close();
    
  })

  // ---------------------------------------------------------------------------
  .method('$createStore', function (name, options) {

    return new idbStore(this.$me.createObjectStore(name, options));
    
  })

  // ---------------------------------------------------------------------------
  .method('$dropStore', function (name) {

    this.$me.deleteObjectStore(name);

  })

  // ---------------------------------------------------------------------------
  .method('$model', function (name, socket) {

    // Si existe el modelo retornarlo
    if(this.$models[name]) return this.$models[name];

    // Instanciar el modelo y guardarlo
    return this.$models[name] = idbModel2(this, name, socket || this.$socket);

  })

  // ---------------------------------------------------------------------------
  .method('$transaction', function (storeNames, mode) { const thiz = this;
    
    return new Promise(function (resolve, reject) {
      thiz.$open()
        .then(function (thiz) {
          resolve(new idbTransaction(thiz.$me.transaction(storeNames, mode)));
        })
        .catch(function (event) {
          reject(event);
        });
    });

  })
  
  // ---------------------------------------------------------------------------
  .method('$store', function (storeNames) { const thiz = this;
    if (!Array.isArray(storeNames)) storeNames = [storeNames];

    function action(mode) {
      return function (cb) {
        return new Promise(function (resolve, reject) {

          thiz.$transaction(storeNames, mode)
            .then(function (tx) {
              const storesObj = {};
              const stores = storeNames.map(function (storeName) {
                return storesObj[storeName] = tx.$store(storeName);
              });
              if (cb) cb.apply(thiz, stores);
              resolve(stores);
            })
            .catch(function (event) {
              reject(event)
            });

        });
      };
    }

    return new Clazzer({})
      .static('$readonly', action(idbTransaction.TransactionMode.ReadOnly))
      .static('$readwrite', action(idbTransaction.TransactionMode.ReadWrite))
      .clazz

  })
  
  // ---------------------------------------------------------------------------
  .clazz;

}