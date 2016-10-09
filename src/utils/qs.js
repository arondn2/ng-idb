'use strict';

export default function qs () { 'ngInject'
  
  function qsClass () { let thiz = this;
    
    let thens = [];
    let thensReady = [];
    let catchs = [];
    let catchsReady = [];
    let resultArgs = null;
    let error = null;

    thiz.promise = {};
    thiz.$resolved = false;

    function thensResolved () {
      if (!thens.length) return;
      var cb = thens.shift();
      cb.apply(null, thiz.resultArgs);
      thensResolved();
    }

    function catchsResolved () {
      if (!catchs.length) return;
      var cb = catchs.shift();
      cb.apply(null, thiz.error);
      catchsResolved();
    }

    thiz.resolve = function () {
      if (thiz.$resolved) return;
      thiz.$resolved = true;
      thiz.resultArgs = Array.prototype.slice.call(arguments);
      thensResolved();
    };

    thiz.reject = function (err) {
      if (thiz.$resolved) return;
      thiz.$resolved = true;
      thiz.error = err || {};
      catchsResolved();
    };

    thiz.promise.then = function (cb) {
      thens.push(cb);
      if (thiz.resolved && !thiz.error) {
        thensResolved();
      }
      return thiz;
    };

    thiz.promise.catch = function (cb) {
      catchs.push(cb);
      if (thiz.resolved && thiz.error) {
        catchsResolved();
      }
      return thiz;
    };

    thiz.promise.done = function (cb) {

      thens.push(function () {
        cb.apply(null, [null].concat(thiz.resultArgs));
      });

      catchs.push(function () {
        cb.apply(null, thiz.error);
      });

      if (thiz.resolved) {
        if (!thiz.error) {
          thensResolved();
        }else {
          catchsResolved();
        }
      }

      return thiz;

    };

  };

  // Crea una instancia del defered
  qsClass.defer = function (cb) {
    return new qsClass(cb);
  };

  return qsClass;

}