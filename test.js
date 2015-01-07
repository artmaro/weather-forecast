/**
 * Created by Eugene on 27.12.2014.
 */
var YANDEX_WEATHER_URL = 'https://pogoda.yandex.ru/yaroslavl/details';
var GMAIL_USER = '********@gmail.com';
var GMAIL_PASSWORD = '*******';
var FORECAST_RECIVER = '******@gmail.com';


var request = require("request");
var cheerio = require("cheerio");
var nodemailer = require('nodemailer');
var CronJob = require('cron').CronJob;

var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASSWORD
    }
});


//var job = new CronJob('00 30 20 * * *', function() {
    request(YANDEX_WEATHER_URL, function (error, response, body) {

        var $ = cheerio.load(body);

        var todayWeather = null;
        var tomorrowWeather = null;

        $(".forecast-detailed__day").each(function () {
            var link = $(this);

            var dayNumber = "";
            link.children().each(function () {
                dayNumber += $(this).text() + " ";
            });

            var dayWeather = {
                dayNumber: dayNumber,
                print: function () {
                    return this.dayNumber + " [morning:" + this.утром.temperature + ", day:" + this.днем.temperature + ", evening: " + this.вечером.temperature + "] ";
                }
            };

            $(this).next(".forecast-detailed__day-info").find(".weather-table__row").each(function () {
                var dayPart = $(this).find(".weather-table__daypart").first().text();
                var temperature = $(this).find(".weather-table__temp").first().text();
                var overallConditions = $(this).find(".weather-table__body-cell_type_condition").first().text();

                if (!dayWeather.hasOwnProperty(dayPart)) {
                    dayWeather[dayPart] = {
                        temperature: temperature,
                        overallConditions: overallConditions
                    };
                } else {
                    console.log('for some reason object has value');
                }
            });

            if (todayWeather == null) {
                todayWeather = dayWeather;
            } else if (tomorrowWeather == null) {
                tomorrowWeather = dayWeather;
            } else {
                return;
            }
        });

        var hasWeatherChanged = '';

        if (weatherChanged(todayWeather, tomorrowWeather)) {
            hasWeatherChanged = 'Attention!';
        }



        var mailOptions = {
            from: 'Weather Informer <list.to.playlist@gmail.com>', // sender address
            to: FORECAST_RECIVER, // list of receivers
            subject: 'Weather forecast. ' + hasWeatherChanged, // Subject line
            text: 'Today ' + todayWeather.print() + ' -> Tomorrow ' + tomorrowWeather.print(), // plaintext body
            html: '<b>Today ' + todayWeather.print() + ' -> Tomorrow ' + tomorrowWeather.print() + '</b>' // html body
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Message sent: ' + info.response);
            }
        });

    });
/*}
);

job.start();*/

function weatherChanged(todayWeather, tomorrowWeather){
    var TEMPERATURE_DELTA = 5;
    if (Math.abs(parseTemperature(todayWeather.утром.temperature) - parseTemperature(tomorrowWeather.утром.temperature)) > TEMPERATURE_DELTA){
        return true;
    }
    if (Math.abs(parseTemperature(todayWeather.днем.temperature) - parseTemperature(tomorrowWeather.днем.temperature)) > TEMPERATURE_DELTA){
        return true;
    }
    if (Math.abs(parseTemperature(todayWeather.вечером.temperature) - parseTemperature(tomorrowWeather.вечером.temperature)) > TEMPERATURE_DELTA){
        return true;
    }

    return false;
}

/**
 * +9…+13   -> 9
 * +9        -> 9
 * −9…−5    -> -9
 */
function parseTemperature(stringTemperature){
    var YANDEX_DEGREE_SEPARATOR = '…';
    var firstTemperature = stringTemperature;
    if (stringTemperature.indexOf(YANDEX_DEGREE_SEPARATOR) != -1){
        firstTemperature = stringTemperature.substring(0, stringTemperature.indexOf(YANDEX_DEGREE_SEPARATOR));
    }

    return parseInt(firstTemperature.replace('−', '-'));
}

/*
var http = require('https');
http.get(YANDEX_WEATHER_URL, function(res) {
  console.log("Got response: " + res.statusCode);
   res.on("data", function (data) { console.log("Got data: " + data); })
}).on('error', function(e) {
  console.log("Got error: " + e.message);
});*/
