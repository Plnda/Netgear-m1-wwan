const request = require('request');

var loggedIn = false;
let jar = request.jar();
let apiURL = "http://192.168.1.1/api/model.json?internalapi=1&x=" + Date.now() + "&debug=jason";
let isBusy = false;
const isOnline = require('is-online');

function createOptions(url) {
    return {
        timeout: 1500,
        url: url,
        jar: jar
    }
}

function startLoop() {

    setInterval(function () {
        onRouterResponse();
    }, 1000);
}

function toggleWWAN(on, data) {

    let token = data.session.secToken;
    let url = "http://192.168.1.1" + data.general.configURL;

    let type = on ? "HomeNetwork" : "Never";

    request.post({
        url: url,
        jar: jar,
        form: {
            "err_redirect": "",
            "ok_redirect": "",
            "token": token,
            "wwan.autoconnect": type
        }
    }, function (error, response, body) {
        console.log("Logged in");
    });
}

function getSession() {

    request.get(createOptions(apiURL), (error, response, body) => {

        if (error != null) {
            console.log("[Router] Server not available " + error);
            return;
        }

        let data = JSON.parse(response.body);

        if (!loggedIn) {
            login(data);
            return;
        }


        isOnline({
            timeout: 1000,
        }).then(online => {

            if (!online && !isBusy) {
                console.log('offline');
                isBusy = true;
                toggleWWAN(false, data);

                setTimeout(() => {
                    toggleWWAN(true, data);
                    isBusy = false
                }, 1500);
            }
            console.log('online');
        });

        deleteAllSMS(data);
    });
}

function login(data) {

    let token = data.session.secToken;
    let password = "figdiz-nisrez-cAgco8";
    let url = "http://192.168.1.1" + data.general.configURL;

    request.post({
        url: url,
        jar: jar,
        form: {
            "err_redirect": "",
            "ok_redirect": "",
            "token": token,
            "session.password": password
        }
    }, function (error, response, body) {
        loggedIn = true;
        console.log(response.body);
    });
}

function deleteAllSMS(data) {

    let token = data.session.secToken;
    let url = "http://192.168.1.1" + data.general.configURL;

    request.post({
        url: url,
        jar: jar,
        form: {
            "err_redirect": "",
            "ok_redirect": "",
            "token": token,
            "sms.deleteAll": 1
        }
    }, function (error, response, body) {});
}

function onRouterResponse() {

    getSession();
}

startLoop();