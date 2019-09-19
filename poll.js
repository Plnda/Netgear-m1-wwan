const request = require('request');

var loggedIn = false;
let jar = request.jar();
let apiURL = "http://192.168.1.1/api/model.json?internalapi=1&x=" + Date.now();

const isOnline = require('is-online');

function createOptions(url) {
    return {
        timeout: 1000,
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
    }, function (response, data, error) {

    });
}

function getSession() {

    request.get(createOptions(apiURL), (error, response, body) => {

        if (error != null) {
            console.log("[Router] Server not available " + error);
            return;
        }

        let data = JSON.parse(body);

        if (!loggedIn) {
            login(data);
            return;
        }

        isOnline({
            timeout: 1000,
        }).then(online => {

            if (!online) {
                console.log('offline');
                toggleWWAN(false, data);

                setTimeout(() => {
                    toggleWWAN(true, data);
                }, 1500);
            }
            console.log('online');
        });

        deleteAllSMS(data);
    });
}

function login(data) {

    let token = data.session.secToken;
    let password = "djwzqbs8rNgCXtyhvAUgwaXT";
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
    }, function (error, response, body) {

    });
}

function onRouterResponse() {

    getSession();
}

startLoop();