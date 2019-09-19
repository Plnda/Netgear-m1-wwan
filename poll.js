const request = require('request');

var loggedIn = false;
let jar = request.jar();
let apiURL = "http://192.168.1.1/api/model.json?internalapi=1&x=10";

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

    request.get(createOptions(apiURL), (response, data, error) => {

        if (error != null) {
            console.log("[Router] Server not available");
            return;
        }

        if (data == null) {
            console.log("[Router] Body is not available");
            return;
        }

        let body = JSON.parse(data.body);

        if (!loggedIn) {
            login(body);
            return;
        }

        isOnline({
            timeout: 1000,
        }).then(online => {

            if (!online) {

                toggleWWAN(false, body);

                setTimeout(() => {
                    toggleWWAN(true, body);
                }, 1500);
            }
        });

        deleteAllSMS(body);
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
    }, function (response, data, error) {
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
    }, function (response, data, error) {

    });
}

function onRouterResponse() {

    getSession();
}

startLoop();