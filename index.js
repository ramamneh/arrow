#!/usr/bin/env node

/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

var Arrow = require("./lib/interface/arrow");
var ArrowSetup = require('./lib/util/arrowsetup');
var nopt = require("nopt");
var Properties = require("./lib/util/properties");
var fs = require("fs");

//setting appRoot
global.appRoot = __dirname;

//recording currentFilder
global.workingDirectory = process.cwd();

//getting command line args

var knownOpts = {
        "browser": [String, null],
        "lib": [String, null],
        "page": [String, null],
        "driver": [String, null],
        "controller": [String, null],
        "reuseSession": Boolean,
        "parallel": [Number, null],
        "report": Boolean,
        "reportFolder": [String, null],
        "testName": [String, null],
        "group": [String, null],
        "logLevel": [String, null],
        "context": [String, null],
        "dimensions": [String, null],
        "capabilities": [String, null],
        "seleniumHost": [String, null]
    },
    shortHands = {},
   //TODO : Investigate and implement shorthands
//    , "br" : ["--browser"]
//    , "lb" : ["--lib"]
//    , "p" : ["--page"]
//    , "d" : ["--driver"]
//    , "ct" : ["--controller"]
//    , "rs" : ["--reuseSession"]
//    , "rp" : ["--report"]
//    , "t" : ["--testName"]
//    , "g" : ["--group"]
//    , "ll" : ["--logLevel"]
//    , "cx" : ["--context"]
//    , "dm" : ["--dimension"]
//    , "sh" : ["--seleniumHost"]
//}

    argv = nopt(knownOpts, shortHands, process.argv, 2),
    arrow,
    prop,
    config,
    arrowSetup;

//help messages
function showHelp() {
    console.info("\nOPTIONS :" + "\n" +
        "        --lib : a comma seperated list of js files needed by the test" + "\n\n" +
        "        --page : (optional) path to the mock or production html page" + "\n" +
        "                   example: http://www.yahoo.com or mock.html" + "\n\n" +
        "        --driver : (optional) one of selenium|browser. (default: selenium)" + "\n\n" +
        "        --browser : (optional) a comma seperated list of browser names, optionally with a hypenated version number.\n" +
        "                      Example : 'firefox-12.0,chrome-10.0' or 'firefox,chrome' or 'firefox'. (default: firefox)" + "\n\n" +
        "        --controller : (optional) a custom controller javascript file" + "\n\n" +
        "        --reuseSession : (optional) true/false. Determines whether selenium tests reuse existing sessions. (default: false)\n" +
        "                           Visit http://<your_selenuim_host>/wd/hub to setup sessions." + "\n\n" +
        "        --parallel : (optional) test thread count. Determines how many tests to run in parallel for current session. (default: 1)\n" +
        "                          Example : --parallel=3 , will run three tests in parallel" + "\n\n" +
        "        --report : (optional) true/false.  creates report files in junit and json format. (default: true)" + "\n" +
        "                     also prints a consolidated test report summary on console. " + "\n\n" +
        "        --reportFolder : (optional) folderPath.  creates report files in that folder. (default: descriptor folder path)" +  "\n\n" +
        "        --testName : (optional) comma seprated list of test name(s) defined in test descriptor" + "\n" +
        "                       all other tests will be ignored." + "\n\n" +
        "        --group : (optional) comma seprated list of group(s) defined in test descriptor." + "\n" +
        "                    all other groups will be ignored." + "\n\n" +
        "        --logLevel : (optional) one of DEBUG|INFO|WARN|ERROR|FATAL. (default: INFO)" + "\n\n" +
        "        --dimensions : (optional) a custom dimension file for defining ycb contexts" + "\n\n" +
        "        --context : (optional) name of ycb context" + "\n\n" +
        "        --seleniumHost : (optional) override selenium host url (example: --seleniumHost=http://host.com:port/wd/hub)" + "\n\n" +
        "        --capabilities : (optional) the name of a json file containing webdriver capabilities required by your project" +
        "        \n\n");

    console.log("\nEXAMPLES :" + "\n" +
        "        Unit test: " + "\n" +
        "          arrow test-unit.js --lib=../src/greeter.js" + "\n\n" +
        "        Unit test with a mock page: " + "\n" +
        "          arrow test-unit.js --page=testMock.html --lib=./test-lib.js" + "\n\n" +
        "        Unit test with selenium: \n" +
        "          arrow test-unit.js --page=testMock.html --lib=./test-lib.js --driver=selenium" + "\n\n" +
        "        Integration test: " + "\n" +
        "          arrow test-int.js --page=http://www.hostname.com/testpage --lib=./test-lib.js" + "\n\n" +
        "        Integration test: " + "\n" +
        "          arrow test-int.js --page=http://www.hostname.com/testpage --lib=./test-lib.js --driver=selenium" + "\n\n" +
        "        Custom controller: " + "\n" +
        "          arrow --controller=custom-controller.js --driver=selenium");
}

if (argv.help) {
    showHelp();
    process.exit(0);
}

if (argv.version) {
    console.log("v" + JSON.parse(fs.readFileSync(global.appRoot + "/package.json", "utf-8")).version);
    process.exit(0);
}

//store start time
global.startTime = Date.now();

//check if user wants to override default config.
if (!argv.config) {
    try {
        if (fs.lstatSync("config.js").isFile()) {
            argv.config = process.cwd() + "/config.js";
        }
    } catch (e) {
        //console.log("No Custom Config File.")
    }
}

//setup config
prop = new Properties(__dirname + "/config/config.js", argv.config, argv);
config = prop.getAll();

//expose classes for test/external usage
this.controller = require('./lib/interface/controller');
this.log4js = require('log4js');

// TODO: arrowSetup move to Arrow
arrowSetup = new ArrowSetup(config, argv);
this.arrow = Arrow;

// Setup Arrow Tests
if (argv.arrowChildProcess) {
    //console.log("Child Process");
    arrowSetup.childSetup();
    argv.descriptor = argv.argv.remain[0];
    arrow = new Arrow(config, argv);
    arrow.run();
} else {
    //console.log("Master Process");
    arrowSetup.setup();
    if (false === arrowSetup.startRecursiveProcess) {
        arrow = new Arrow(config, argv);
        arrow.run();
    }
}


