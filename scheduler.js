var nodemailer = require('nodemailer');
var schedule = require('node-schedule');
var fetch = require('node-fetch');
var request = require('request');
var handlebars = require('handlebars');
const mongoose = require("mongoose");

const httpsProxyAgent = require('https-proxy-agent');
var agents = null;
// var agents = new httpsProxyAgent("http://192.168.255.44:8080");
// agents = new httpsProxyAgent("http://cis-india-pitc-bangalorez.proxy.corporate.ge.com:80");
var fs = require('fs');

var ejs = require('ejs');

function timeToMilliSeconds(time) {
    var sec = (time.min * 60 * 1000) * 1;
    var mili = (time.sec * 1000) * 1;
    var miliSec = time.mili * 1;
    return sec + mili + miliSec;
}
function millisecondsToTime(milli) {
    var milliseconds = milli % 1000;
    var seconds = Math.floor((milli / 1000) % 60);
    var minutes = Math.floor((milli / (60 * 1000)) % 60);

    return minutes + " Minutes " + seconds + " Seconds " + milliseconds + " MilliSeconds";
}
function sendThresholdMail(appName, app, threshold) {

    console.log("inside sendMail");

    const template = './services/thresholdEmail.ejs';

    // var appName = "";
    // var getClientApps = require('../models/client.js');
    // var GetClientApp = mongoose.model('clients', getClientApps);


    // GetClientApp.findOne({ "_id": app.appId }, (err, docs) => {
    //     if (err) {
    //         //console.log(docs);

    //         console.log(err);



    //     } else {
    //         console.log(docs.title);
    //         appName = docs.title;
    //         // if (appName != null || appName != "") {
    //         //     console.log("connection closed in sendMail");
    //         //     sendMail(appName, app);
    //         // }
    //         //db.close();
    //         //res.json({ error: err });

    //     }
    // });

    var readHTMLFile = function (template, callback) {
        fs.readFile(template, { encoding: 'utf-8' }, function (err, html) {
            if (err) {
                throw err;
                callback(err);
            }
            else {
                callback(null, html);
            }
        });
    };

    var transport = nodemailer.createTransport({
        host: 'smtp.geips.ge.com',
        port: 25
    });

    // var threshold = [];
    // for (var i = 0; i < app.test_suites.length; i++) {
    //     var estimateThreshold = timeToMilliSeconds(app.test_suites[i].threshold);
    //     console.log(estimateThreshold);
    //     console.log("Start Time - ", app.test_suites[i].responseTime[app.test_suites[i].responseTime.length-1].startTime);
    //                 console.log("End Time - ", app.test_suites[i].responseTime[app.test_suites[i].responseTime.length-1].endTime);
    //                 console.log("Response Time - ", app.test_suites[i].responseTime[app.test_suites[i].responseTime.length-1].endTime -app.test_suites[i].responseTime[app.test_suites[i].responseTime.length-1].startTime);
    //     var actualThreshold = app.test_suites[i].responseTime[app.test_suites[i].responseTime.length-1].endTime*1 - app.test_suites[i].responseTime[app.test_suites[i].responseTime.length-1].startTime*1;
    //     console.log(actualThreshold);
    //     if (estimateThreshold < actualThreshold) {
    //         threshold.push({ "url": app.test_suites[i].url, "estimate":millisecondsToTime(estimateThreshold),"actual":millisecondsToTime(actualThreshold) });
    //         //errors = errors + "****" + app.test_suites[i].url + "----" + app.test_suites[i].error
    //         //app.test_suites[i].error[(app.test_suites[i].error.length) - 1].message 
    //     } else {
    //         continue;
    //     }
    // }

    readHTMLFile(template, function (err, html) {

        var template = handlebars.compile(html);
        var replacements = {
            appname: appName,
            suitename: app.suiteName
        };
        var htmlToSend = template(replacements);

        var mdata = "<h1>Crossed Threshold</h1>"
        mdata += '<table border="1" style="text-align:center"><tr><td>URL</td><td>Estimated Time</td><td>Actual Time</td></tr>'
        for (var i = 0; i < threshold.length; i++) {
            mdata += '<tr><td width="70px">' + threshold[i].url + "</td><td>" + threshold[i].estimate + "</td>"
            mdata += "<td>" + threshold[i].actual + "</td></tr>"
        }
        mdata += "</table>";
        //var smtpTransport = require('nodemailer-smtp-transport');
        //process.env.MAIL_URL='smtp://:' + encodeURIComponent("Nodemailer123") + '@smtp.geips.ge.com:25';

        // ejs.renderFile(template, 'utf8', (err, html) => {
        //     if (err) console.log(err); // Handle error

        //     console.log(`HTML: ${html}`);

        var message = {

            // sender info
            from: 'capgemini-noreply@microtester.com',

            // Comma separated list of recipients
            to: app.to,
            cc: app.cc,
            bcc: app.bcc,
            // Subject of the message
            subject: 'Info regarding Test suite crossed threshold ',

            // plaintext body

            // HTML body
            html: `${htmlToSend}+${mdata}`
        };



        console.log('Sending Threshold Mail');


        console.log('SMTP Configured');
        if (appName != "") {
            transport.sendMail(message, function (error) {
                if (error) {
                    console.log('Error occured');
                    console.log(error.message);
                    return;
                }
                console.log('Threshold Message sent successfully!');

                // if you don't want to use this transport object anymore, uncomment following line
                //transport.close(); // close the connection pool
            });
        }


    });
}
function sendMail(name, app) {

    console.log("inside sendMail");

    const template = './services/email.ejs';


    var readHTMLFile = function (template, callback) {
        fs.readFile(template, { encoding: 'utf-8' }, function (err, html) {
            if (err) {
                throw err;
                callback(err);
            }
            else {
                callback(null, html);
            }
        });
    };

    var transport = nodemailer.createTransport({
        host: 'smtp.geips.ge.com',
        port: 25
    });

    var errors = [];
    for (var i = 0; i < app.test_suites.length; i++) {
        if ((app.test_suites[i].status === "Failed") || ((app.test_suites[i].statusMsg[(app.test_suites[i].statusMsg.length) - 1].message === "Successfull") && (app.test_suites[i].statusMsg[(app.test_suites[i].statusMsg.length) - 2].message !== "Successfull"))) {
            errors.push({ "url": app.test_suites[i].url, "message": app.test_suites[i].statusMsg[(app.test_suites[i].statusMsg.length) - 1].message });
            //errors = errors + "****" + app.test_suites[i].url + "----" + app.test_suites[i].error
            //app.test_suites[i].error[(app.test_suites[i].error.length) - 1].message 
        } else {
            continue;
        }
    }

    readHTMLFile(template, function (err, html) {

        var template = handlebars.compile(html);
        var replacements = {
            appname: name,
            suitename: app.suiteName
        };
        var htmlToSend = template(replacements);

        var mdata = "<h1>Errors</h1>"
        mdata += "<ul>"
        for (var i = 0; i < errors.length; i++) {
            mdata += "<li>URL: " + errors[i].url + "--- Message: "
            mdata += errors[i].message + "</li>"
        }
        mdata += "</ul>";
        //var smtpTransport = require('nodemailer-smtp-transport');
        //process.env.MAIL_URL='smtp://:' + encodeURIComponent("Nodemailer123") + '@smtp.geips.ge.com:25';

        // ejs.renderFile(template, 'utf8', (err, html) => {
        //     if (err) console.log(err); // Handle error

        //     console.log(`HTML: ${html}`);

        var message = {

            // sender info
            from: 'capgemini-noreply@microtester.com',

            // Comma separated list of recipients
            to: app.to,
            cc: app.cc,
            bcc: app.bcc,
            // Subject of the message
            subject: 'Info regarding Test suite stability',

            // plaintext body

            // HTML body
            html: `${htmlToSend}+${mdata}`
        };



        console.log('Sending Mail');


        console.log('SMTP Configured');
        if (name != "") {
            transport.sendMail(message, function (error) {
                if (error) {
                    console.log('Error occured');
                    console.log(error.message);
                    return;
                }
                console.log('Message sent successfully!');

                // if you don't want to use this transport object anymore, uncomment following line
                //transport.close(); // close the connection pool
            });
        }


    });
    // Message object

}
// function getAppName(app) {

//     //console.log(req.params.id)
//     // ses.id=1;
//     var appName = "";
//     var getClientApps = require('../models/client.js');
//     var GetClientApp = mongoose.model('clients', getClientApps);


//     GetClientApp.findOne({ "_id": app.appId }, (err, docs) => {
//         if (!err) {
//             //console.log(docs);

//             console.log(docs.title);
//             appName = docs.title;
//             if (appName != null || appName != "") {
//                 console.log("connection closed in sendMail");
//                 sendMail(appName, app);
//             }



//         } else {
//             //db.close();
//             //res.json({ error: err });
//             console.log(err);
//         }
//     });
// }

function saveTest(app) {
    var testSuites = require('../models/testSuites.js');
    var TestSuite = mongoose.model('testsuites', testSuites);
    console.log("inside saveTest");
    console.log(app.test_suites);
    var appName = "";
    var getClientApps = require('../models/client.js');
    var GetClientApp = mongoose.model('clients', getClientApps);


    GetClientApp.findOne({ "_id": app.appId }, (err, docs) => {
        if (err) {
            //console.log(docs);

            console.log(err);



        } else {
            console.log(docs.title);
            appName = docs.title;
            // if (appName != null || appName != "") {
            //     console.log("connection closed in sendMail");
            //     sendMail(appName, app);
            // }
            //db.close();
            //res.json({ error: err });

        }
    });

    TestSuite.update({ '_id': app._id }, { $set: { 'test_suites': app.test_suites } }, function (err, doc) {
        if (!err) {
            for (var i = 0; i < app.test_suites.length; i++) {
                if ((app.test_suites[i].status === "Failed") || ((app.test_suites[i].statusMsg[(app.test_suites[i].statusMsg.length) - 1].message === "Successfull") && (app.test_suites[i].statusMsg[(app.test_suites[i].statusMsg.length) - 2].message !== "Successfull"))) {

                    console.log("inside for loop");
                    console.log("stored successfully");
                    sendMail(appName, app);
                    //getAppName(app);
                    break;
                } else {
                    continue;
                }
            }
            if (app.thresholdNotifier == true) {
                var threshold = [];
                for (var i = 0; i < app.test_suites.length; i++) {
                    var estimateThreshold = timeToMilliSeconds(app.test_suites[i].threshold);
                    console.log(estimateThreshold);
                    console.log("Start Time - ", app.test_suites[i].responseTime[app.test_suites[i].responseTime.length - 1].startTime);
                    console.log("End Time - ", app.test_suites[i].responseTime[app.test_suites[i].responseTime.length - 1].endTime);
                    console.log("Response Time - ", app.test_suites[i].responseTime[app.test_suites[i].responseTime.length - 1].endTime - app.test_suites[i].responseTime[app.test_suites[i].responseTime.length - 1].startTime);
                    var actualThreshold = app.test_suites[i].responseTime[app.test_suites[i].responseTime.length - 1].endTime * 1 - app.test_suites[i].responseTime[app.test_suites[i].responseTime.length - 1].startTime * 1;
                    console.log(actualThreshold);
                    if ((estimateThreshold < actualThreshold) && estimateThreshold != 0) {
                        threshold.push({ "url": app.test_suites[i].url, "estimate": millisecondsToTime(estimateThreshold), "actual": millisecondsToTime(actualThreshold) });
                        //errors = errors + "****" + app.test_suites[i].url + "----" + app.test_suites[i].error
                        //app.test_suites[i].error[(app.test_suites[i].error.length) - 1].message 
                    } else {
                        continue;
                    }
                }
                if (threshold.length != 0) {
                    sendThresholdMail(appName, app, threshold);
                }
            }

        } else {
            //db.close();
            console.log("error occured" + err);
        }

    })
}
function tokenGenerated(appId, callback) {
    var info = {};
    var getApps = require('../models/client.js');
    var GetApp = mongoose.model('clients', getApps);


    GetApp.findOne({ "_id": appId }, (err, doc) => {
        if (err) {
            //console.log(docs);
            // info = {
            //     stat: false,
            //     msg: err
            // }
            callback(err);
            //return info;
            // res.send(info);
            // res.end();
        } else {
            if (doc != null) {
                var url = doc.appToken + '?grant_type=' + doc.grantType + '&client_id=' + doc.clientId + '&client_secret=' + doc.clientSecret + '&scope=' + doc.scope;
                console.log(url);
                fetch(url, { method: "POST" })
                    .then(function successCallback(response) {


                        return response.json();

                    }).then(function (response) {
                        //  let info = {
                        //     stat: true,
                        //     token: response.access_token
                        // }
                        console.log(response.access_token);
                        callback(response.access_token);


                        //return info.token;
                        // res.send(info);
                        // res.end();
                    })
                    .catch(function errorCallback(err) {
                        next(err)
                    });

            }
            //res.json({ error: err });

        };

    });
    // if(info.token!=undefined || info.token!=null){
    //     return info;
    // }       
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
// tokenGenerated('appname',function(response){
//         console.log(response);
//         return response;
// });

//data.url, { method: data.selectedReqType, body: data.body, headers: jsonHeader }
// function Hello(){
//     tokenGenerated("5959fd601722120ad46689b5",function(response){
//         console.log("atxxxx",response);
// });
// }
// Hello();
function fetching(data, app, counter) {
    console.log("here is data");
    console.log(data);
    console.log("here is counter ", counter);
    var url = data.url;
    // var req = data.url.substring(0, 5);
    // console.log(req);
    // if (req == "http:") {
    //     console.log("http");
    //     agents = new httpsProxyAgent("http://proxy-src.research.ge.com:8080");
    // } else {
    //     console.log("https");
    //     agents = new httpsProxyAgent("http://192.168.255.44:8080");
    // }
    if (url.includes("dpod.gerenewables.com") || url.includes("fssfed.stage.ge.com") || url.includes("amazonaws.com") || url.includes("fssfed.ge.com") || url.includes("predix.io")) {
        console.log("################################################## Inside Predix Domain ###########################################");
        agents = new httpsProxyAgent("http://10.195.49.209:80");
    } else {
        console.log("################################################## Outside Predix Domain ###########################################");
        agents = null;
    }
    var options = {
        // These properties are part of the Fetch Standard
        method: data.selectedReqType,
        headers: JSON.parse(data.header),
        body: data.body, // request body. can be null, a string, a Buffer, a Blob, or a Node.js Readable stream
        redirect: 'follow', // set to `manual` to extract redirect headers, `error` to reject redirect

        // // // The following properties are node-fetch extensions
        follow: 20,         // maximum redirect count. 0 to not follow redirect
        timeout: 0,         // req/res timeout in ms, it resets on redirect. 0 to disable (OS limit applies)
        compress: true,     // support gzip/deflate content encoding. false to disable
        size: 0,            // maximum response body size in bytes. 0 to disable
        agent: agents         // http(s).Agent instance, allows custom proxy, certificate etc.
    }
    //var count = 0;
    console.log("url " + data.url);
    console.log(JSON.parse(data.header));
    // fetched();
    // function fetched() {
    fetched();
    function fetched() {
        app.test_suites[counter].startTime = new Date().getTime();
        fetch(data.url, options)
            .then(function successCallback(response) {
                // request({
                //     uri: "https://www.tutorialspoint.com/apache_spark/apache_spark_deployment.htm",
                //     method: "GET"
                // }, function (error, response, body) {
                //     console.log(response);
                //     console.log(error);
                // });
                console.log("inside success hitapi");
                console.log(response.status);
                console.log(response);
                console.log("success");
                if (response.ok) {
                    app.test_suites[counter].responseTime.push({ "startTime": app.test_suites[counter].startTime, "endTime": new Date().getTime() });
                    app.test_suites[counter].status = "Successfull";
                    app.test_suites[counter].statusMsg.push({ "time": new Date(), "message": "Successfull" });
                    //app.test_suites[counter].success.push({ "time": new Date(), "message": "Sucessfully running" });
                    console.log("Start Time - ", app.test_suites[counter].responseTime[0].startTime);
                    console.log("End Time - ", app.test_suites[counter].responseTime[0].endTime);
                    console.log("Response Time - ", app.test_suites[counter].responseTime[0].endTime - app.test_suites[counter].responseTime[0].startTime);
                    // counter = counter + 1;
                    if (counter + 1 < app.test_suites.length) {
                        app.test_suites[counter + 1].startTime = new Date().getTime();
                        hitApi(app.test_suites[counter + 1], app, counter + 1);
                    } else {
                        //server store
                        saveTest(app);

                    }
                    // if(counter===app.test_suites.length-1){
                    //     saveTest(app);
                    // }
                } else {
                    throw Error(response.statusText);
                }
                // $scope.showData[counter].responseTime[0].endTime = new Date().getTime();



            })
            .catch(function errorCallback(err) {

                console.log("inside failure hitapi");
                console.log(err.code);
                //updateSuite();
                // if (err.code == "UNABLE_TO_GET_ISSUER_CERT_LOCALLY") {
                //     count = count + 1;
                //     console.log("outside");
                //     if (count <= 1) {
                //         console.log("inside");
                //         agents = new httpsProxyAgent("http://proxy-src.research.ge.com:8080");
                //         options.agent = agents;
                //         fetched();
                //     } else {
                //         updateSuite();
                //     }

                // } else {
                //     updateSuite();
                // }
                // console.log(err);
                //function updateSuite() {
                app.test_suites[counter].responseTime.push({ "startTime": app.test_suites[counter].startTime, "endTime": new Date().getTime() });
                app.test_suites[counter].status = "Failed";
                app.test_suites[counter].statusMsg.push({ "time": new Date(), "message": err });
                // counter = counter + 1;
                if (counter + 1 < app.test_suites.length) {
                    app.test_suites[counter + 1].startTime = new Date().getTime();
                    hitApi(app.test_suites[counter + 1], app, counter + 1);
                } else {

                    saveTest(app);
                }
                // if(counter===app.test_suites.length-1){
                //     saveTest(app);
                // }
                // }
            });
    }
    // }
}
function hitApi(data, app, counter) {
    var jsonHeader = {};
    //counter=0;
    console.log(data.oauthFilter);
    if (data.oauthFilter == true) {
        tokenGenerated(app.appId, function (response) {
            console.log("at", response);
            jsonHeader = JSON.parse(data.header);
            jsonHeader.Authorization = "Bearer " + response;
            data.header = JSON.stringify(jsonHeader);
            console.log(data.header);
            console.log(jsonHeader);
            fetching(data, app, counter);
        });
    } else {
        fetching(data, app, counter);
    }
}
function testApi(data, app) {
    console.log("inside testApi");
    counter = 0;
    hitApi(data[0], app, counter);
    // for(var i=0;i<data.length;i++){
    //     //data[i].startTime = new Date().getTime();
    //     hitApi(data[i], app,i);
    // }

}


module.exports = {

    scheduler: function (data) {
        console.log(data);
        console.log(data.suiteName + "started");
        schedule.scheduleJob(data.suiteName, data.frequency, function () {
            console.log(schedule.scheduledJobs[data.suiteName]);
            testApi(data.test_suites, data);

        });
    }, serverScheduler: function () {
        var getTestSuites = require('../models/testSuites.js');
        var GetTestSuite = mongoose.model('testsuites', getTestSuites);
        GetTestSuite.find({ "isScheduled": true }, (err, docs) => {
            if (err) {

                info = {
                    stat: false,
                    msg: err
                }
                console.log(err);
                //console.log(docs);

            } else {
                //res.json({ error: err });
                for (var i = 0; i < docs.length; i++) {
                    console.log("scheduler started");
                    this.scheduler(docs[i]);
                }
                info = {
                    stat: true
                }
                console.log(docs);
            };
        });
    },
    sendOTPMail: function (email, number) {

        console.log("inside sendMail");

        const template = './services/otpMail.ejs';


        var readHTMLFile = function (template, callback) {
            fs.readFile(template, { encoding: 'utf-8' }, function (err, html) {
                if (err) {
                    throw err;
                    callback(err);
                }
                else {
                    callback(null, html);
                }
            });
        };

        var transport = nodemailer.createTransport({
            host: 'smtp.geips.ge.com',
            port: 25
        });


        readHTMLFile(template, function (err, html) {

            var template = handlebars.compile(html);
            var replacements = {
                otp: number
            };
            var htmlToSend = template(replacements);

            //var smtpTransport = require('nodemailer-smtp-transport');
            //process.env.MAIL_URL='smtp://:' + encodeURIComponent("Nodemailer123") + '@smtp.geips.ge.com:25';

            // ejs.renderFile(template, 'utf8', (err, html) => {
            //     if (err) console.log(err); // Handle error

            //     console.log(`HTML: ${html}`);

            var message = {

                // sender info
                from: 'capgemini-noreply@microtester.com',

                // Comma separated list of recipients
                to: email,
                // Subject of the message
                subject: 'Your OTP Number',

                // plaintext body

                // HTML body
                html: `${htmlToSend}`
            };



            console.log('Sending Mail');


            console.log('SMTP Configured');
            transport.sendMail(message, function (error) {
                if (error) {
                    console.log('Error occured');
                    console.log(error.message);
                    return;
                }
                console.log('Message sent successfully!');

                // if you don't want to use this transport object anymore, uncomment following line
                //transport.close(); // close the connection pool
            });
        }


        );
        // Message object

    },

    sendUserInfoMail: function (email, appName, flag) {

        console.log("inside sendMail to notify user");

        const template = './services/userInfoMail.ejs';


        var readHTMLFile = function (template, callback) {
            fs.readFile(template, { encoding: 'utf-8' }, function (err, html) {
                if (err) {
                    throw err;
                    callback(err);
                }
                else {
                    callback(null, html);
                }
            });
        };

        var transport = nodemailer.createTransport({
            host: 'smtp.geips.ge.com',
            port: 25
        });
        var operation = "";
        if (flag === true) {
            operation = "added to";
        }else{
            operation="removed from";
        }
        readHTMLFile(template, function (err, html) {

            var template = handlebars.compile(html);
            var replacements = {
                type: operation,
                appname:appName
            };
            var htmlToSend = template(replacements);

            //var smtpTransport = require('nodemailer-smtp-transport');
            //process.env.MAIL_URL='smtp://:' + encodeURIComponent("Nodemailer123") + '@smtp.geips.ge.com:25';

            // ejs.renderFile(template, 'utf8', (err, html) => {
            //     if (err) console.log(err); // Handle error

            //     console.log(`HTML: ${html}`);

            var message = {

                // sender info
                from: 'capgemini-noreply@microtester.com',

                // Comma separated list of recipients
                to: email,
                // Subject of the message
                subject: flag?'You are added to application group':'You are removed from application group',

                // plaintext body

                // HTML body
                html: `${htmlToSend}`
            };



            console.log('Sending Mail');


            console.log('SMTP Configured');
            transport.sendMail(message, function (error) {
                if (error) {
                    console.log('Error occured');
                    console.log(error.message);
                    return;
                }
                console.log('Message sent successfully!');

                // if you don't want to use this transport object anymore, uncomment following line
                //transport.close(); // close the connection pool
            });
        }


        );
        // Message object

    }

    //     },
    //     tokenGenerate:function(appname,callback){
    //          var info={};
    //      var getApps = require('../models/client.js');
    //             var GetApp = mongoose.model('clients', getApps);


    //             GetApp.findOne({ "_id": appname }, (err, doc) => {
    //                 if (err) {
    //                     //console.log(docs);
    //                     // info = {
    //                     //     stat: false,
    //                     //     msg: err
    //                     // }
    //                     callback(err);
    //                     //return info;
    //                     // res.send(info);
    //                     // res.end();
    //                 } else {
    //                     if (doc != null) {
    //                         var url = 'https://fssfed.stage.ge.com/fss/as/token.oauth2?grant_type=' + doc.grantType + '&client_id=' + doc.clientId + '&client_secret=' + doc.clientSecret + '&scope=' + doc.scope;
    //                         console.log(url);
    //                         fetch(url, { method: "POST" })
    //                             .then(function successCallback(response) {


    //                                 return response.json();

    //                             }).then(function(response){
    //                                 //  let info = {
    //                                 //     stat: true,
    //                                 //     token: response.access_token
    //                                 // }
    //                                 console.log(response.access_token);
    //                                 callback(response.access_token);


    //                                //return info.token;
    //                                 // res.send(info);
    //                                 // res.end();
    //                             })
    //                             .catch(function errorCallback(err) {   
    //                                 next(err)
    //                             });

    //                     }
    //                     //res.json({ error: err });

    //                 };

    //             });
    // }
}