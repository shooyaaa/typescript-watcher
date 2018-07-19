const config = require('./config.js')
const {Builder, By, Key, until} = require('selenium-webdriver');
var net = require('net')
var process = require('process')
var http = require('http')
var fs = require('fs');
var path = require('path');
const { spawn } = require('child_process');

http.createServer(function (request, response) {
    var filePath = config.bin + request.url;
    if (request.url == '/')
        filePath += '/index.html';

    var extname = path.extname(filePath);
    var contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
            contentType = 'image/jpg';
            break;
        case '.wav':
            contentType = 'audio/wav';
            break;
    }

    fs.readFile(filePath, function(error, content) {
        if (error) {
            if(error.code == 'ENOENT'){
                fs.readFile('./404.html', function(error, content) {
                    response.writeHead(200, { 'Content-Type': contentType });
                    if (error) {
                        response.end('File ' + filePath + ' not found', 'utf-8');
                    } else {
                        response.end(content, 'utf-8');
                    }
                });
            }
            else {
                response.writeHead(500);
                console.log("Error " + error.message)
                response.end('Sorry, check with the site admin for error: '+ error.message +' ..\n');
            }
        }
        else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });

}).listen(config.port);

var url = 'http://127.0.0.1:' + config.port

let driver = openUrl(url)

const fswatch = spawn('fswatch', ['-0', config.src])
fswatch.on('error', error => {
    console.log('fswatch error ' + error.message)
})

fswatch.stderr.on('data', (data) => {
    console.log('error file watch ' + data)
})

let compile = null
fswatch.stdout.on('data', (data) => {
    console.log('file watch ' + data)
    compile = spawn('tsc', ['-p', config.src, '--outDir', config.compile])
    compile.stderr.on('data', data => {
        console.log('Compile error ' + data)
    })
    compile.stdout.on('data', data => {
        console.log(data)
    })
    compile.on('exit', (code, signal) => {
        if (code == 0) {
            console.log('Compile success!!!')
            driver.navigate().refresh()
        }
    })
})

function shutdown(code) {
    console.log('now exit')
}

process.on('exit', shutdown)


function openUrl(url) {
    let driver = new Builder().forBrowser('chrome').build();
    driver.then(result => {
        return driver.get(url)
    }).catch(error => {
        console.log('Error ' + error)
        shutdown(-1)
    })
    let interval = -1
    interval = setInterval(() => {
        driver.getAllWindowHandles().catch(error => {
            console.log("Browser closed, reopen ")
            clearInterval(interval)
            openUrl(url)
        })
    }, 1000)
    return driver
}
