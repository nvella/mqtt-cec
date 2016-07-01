var mqtt   = require('mqtt');
var spawn  = require('child_process').spawn;
var async  = require('async');
var fs     = require('fs');

var config = {};
var cecClient = null;

async.series([
  function readConfig(callback) {
    fs.readFile('config.json', function(err, data) {
      if(err) {
        console.error('Failed to load config.json\nPlease ensure the file exists and is valid JSON.');
        process.exit(1);
      }

      config = JSON.parse(data);
      callback();
    });
  },

  function setupCecClient(callback) {
    cecClient = spawn(config.cecClientCommand, config.cecClientArgs); 
    cecClient.stdout.on('data', function(data) {
      console.log('cecClient> ' + data.toString());
    });
  },

  function main(callback) {
    
  }
]);
