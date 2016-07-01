var mqtt   = require('mqtt');
var spawn  = require('child_process').spawn;
var async  = require('async');
var fs     = require('fs');

var config = {};
var cecClient = null;
var mqttClient = null;
var cmdQueue = {power: []};
var lastState = {power: {}};

function reqPowerStatus(id, callback) {
  cmdQueue.power.push(id);
  cecClient.stdin.write('pow ' + id + '\n', callback);
}

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

  function connectMqtt(callback) {
    // Connect MQTT client
    mqttClient = mqtt.connect(config.mqttUrl);
    console.log('Attempting to connect to MQTT server');

    mqttClient.on('connect', function() {
      for(var id in config.idMap) {
        for(var subTopic of config.subTopics) {
          console.log('Subscribing to ' + config.idMap[id].rootTopic + '/' + subTopic);
          mqttClient.subscribe(config.idMap[id].rootTopic + '/' + subTopic);
        }
      }
      callback();
    });
  },

  function setupCecClient(callback) {
    cecClient = spawn(config.cecClientCommand, config.cecClientArgs); 
    cecClient.stdout.on('data', function(data) {
      for(var line of data.toString().split('\n')) {
        console.log('cecClient> ' + line);

        // Power status update
        if(config.subTopics.indexOf('power') !== -1 && line.indexOf('power status: ') === 0) {
          var id = cmdQueue.power.shift(); // Get the first element from the array
          var reportedState = line.split(': ')[1];
          var state = 'OFF';
          switch(reportedState) {
            case 'unknown':
            case 'standby':
              state = 'OFF';
              break;
            case 'in transition from standby to on':
            case 'on':
              state = 'ON';
              break;
          }

          if(lastState.power[id] !== state) {
            console.log('publishing new state for ' + config.idMap[id].rootTopic + '/power : ' + state);
            mqttClient.publish(config.idMap[id].rootTopic + '/power', state);
          }
          lastState.power[id] = state;
        }
      }
    });
    callback();
  },

  function setupMqttListeners(callback) {
    mqttClient.on('message', function(topic, message) {
      console.log('mqtt> ' + topic + ' : ' + message);
      var id = 0;
      for(id in config.idMap) { if(topic.indexOf(config.idMap[id].rootTopic) === 0) break; }
      var subTopic = topic.split('/')[topic.split('/').length - 1];
      
      switch(subTopic) {
        case 'power':
          if(message === 'ON' || message === 'OFF') {
            console.log('turning ' + id + ' ' + message);
            cecClient.stdin.write(message.toLowerCase() + ' ' + id + '\n');
          }
          break;
      }
    });

    callback();
  },

  function setupPeriodicPowerCheck(callback) {
    if(config.subTopics.indexOf('power') !== -1) {
      setInterval(function() {
        async.forEachOf(config.idMap, function(_, id, callback) { reqPowerStatus(id, callback); });
      }, config.powerCheckIntMs);
    }
  }
]);
