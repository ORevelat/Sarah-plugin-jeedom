var words = require( './jeedom.json' );

exports.init = function() {
	console.log('\x1b[96mJeedom plugin is initializing ... \x1b[0m');
};

exports.dispose  = function() {
	console.log('\x1b[96mJeedom plugin is disposed ... \x1b[0m');
};

exports.action = function(data, next) {
	if ( data.mode && (data.mode == "JEEDOM"))
		return actionJeedom(data, next);
	
	commandError(next);
};

var commandError = function(next) {
	var toSpeak = '';
	var availableTTS = words["command_error"];
	if (Object.keys(availableTTS).length > 0) {
		var choice = Math.floor(Math.random() * Object.keys(availableTTS).length); 
		toSpeak = availableTTS[choice];
	}

	next({'tts': toSpeak});
};

var actionJeedom = function(data, next) {
	console.log('\x1b[91mmode=JEEDOM \x1b[0m');

    var pathJeedomApi = '/core/api/jeeApi.php';

	var pluginProps = Config.modules.jeedom;
	if (!pluginProps.jeedom_addr) {
		console.log("Missing Jeedom address config in prop file");
		next({'tts' : 'Configuration invalide'});
		return;
	}
	else if (!pluginProps.jeedom_apikey) {
		console.log("Missing Jeedom API key config in prop file");
		next({'tts' : 'Configuration invalide'});
		return;
	}

	var request = require('request');
	var async = require('async');

	var list_urls = [];

	var commands = data.cmd.split(";");
	for (var i=0; i<commands.length; i++) {
		var url = pluginProps.jeedom_addr + pathJeedomApi + "?apikey=" + pluginProps.jeedom_apikey + "&type=cmd&id=" + commands[i];
		list_urls.push(url);
	}

	async.map(list_urls, function(url, callback) {
		request(url, function (error, response, body) {
	        if (!error && response.statusCode == 200) {
	            // do any further processing of the data here
	            callback(null, response.body);
	        } else {
	            callback(error || response.statusCode);
	        }
	    });
    }, function(err, results) {
	    // completion function
	    if (!err) {
	    	var toSpeak = '';

			if ( (data.element === 'lum_on') || (data.element === 'lum_off') || 
				(data.element === 'volet_up') || (data.element === 'volet_down')) {
				var availableTTS = words["jeedom"];
				if (Object.keys(availableTTS).length > 0) {
					var choice = Math.floor(Math.random() * Object.keys(availableTTS).length); 
					toSpeak = availableTTS[choice];
				}
			 }
			 else if (data.element === 'temp') {
			 	var tmp = results[0];
			 	toSpeak = "la température est de " + tmp.replace('.', ',') + " degrés";
			 }

			next({ 'tts': toSpeak });
	    }
	    else {
	        // handle error here
			next({'tts': "Désolé mais je n'arrive pas à envoyer une des commandes à Jeedom"});
	    }
	});
};
