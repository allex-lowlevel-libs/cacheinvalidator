function createCacheInvalidator(runNext,isFunction,isDefinedAndNotNull) {
  'use strict';
  runNext = runNext || setTimeout;

  function CacheInvalidator(cache, job_interval, maxAge, prefix) {
    if (!isFunction(cache.traverse) || !isFunction(cache.remove)){
      throw new Error('Cache must have traverse and remove methods!');
    }
    this.cache = cache;
    this.job_interval = job_interval;
    this.maxAge = maxAge;
    this.prefix = prefix || null; 
    this.aged = [];
    this.doCronJob();
  }
  CacheInvalidator.prototype.destroy = function () {
    this.aged = null;
    this.prefix = null;
    this.maxAge = null;
    this.job_interval = null;
    this.cache = null;
  };

  CacheInvalidator.prototype.doAging = function(item,name){
    if (typeof item != 'object'){
      var ageObj = this.cache.get(name+'_age');
      if (!isDefinedAndNotNull(ageObj)){
        ageObj = {age:1};
        this.cache.add(name+'_age',ageObj);
      }
      if (ageObj.age >= this.maxAge){
        this.aged.push(name);
      }
    }else{
      if (!isDefinedAndNotNull(item.age)) item.age = 0;
      item.age++;
      if (item.age >= this.maxAge){
        this.aged.push(name);
        //NOT DESTROYING!
        /*
        if (isFunction(item.destroy)){
          item.destroy();
        }
        */
      }
    }
  };

  CacheInvalidator.prototype.invalidateCacheEntry = function(item,name,map){
    //console.log('Taman da vidimo CACHE ENTRY name : ' + name + '\nitem : ' + item);
    //console.log('Taman da vidimo CACHE ENTRY name : ' + name + '\nitem : ' + require('util').inspect(item,{depth:5}));
    var content = item.content;
    var timestamp = item.timestamp;
    if (!!this.prefix && name.indexOf(this.prefix) !== 0){
      return false;
    }
    this.doAging(item,name);
    return true;
  };

  CacheInvalidator.prototype.removeFromCache = function(entryName){
    var ret = this.cache.remove(entryName);
  };

  CacheInvalidator.prototype.clearCache = function(){
    this.cache.traverse(this.invalidateCacheEntry.bind(this));
    this.aged.forEach(this.removeFromCache.bind(this));
    this.aged = [];
  };

  CacheInvalidator.prototype.cronJob = function(){
    this.clearCache();
    this.doCronJob();
  };

  //move cron job functionallity to lib
  CacheInvalidator.prototype.doCronJob = function(){
    setTimeout(this.cronJob.bind(this),this.job_interval);
  };

  return CacheInvalidator;
}

module.exports = createCacheInvalidator;
