#!/usr/bin/env python2.7
# coding=utf-8

from gevent import monkey
monkey.patch_all()

from flask import Flask, Response, render_template, request, stream_with_context, g

from gevent.pywsgi import WSGIServer

import json

IP_ADDRESS = "0.0.0.0"
PORT = 5500

app = Flask(__name__)
app.debug = False

PARAMETERS_FILENAME = "./parameters.json"

@app.route('/', defaults={"path": ''})
@app.route("/<path:path>/")
def index(path):
    return render_template("index.html")

@app.route("/parameters/", methods=["GET"])
def parameters():
    with open(PARAMETERS_FILENAME) as parameters_file:
        parameters = json.load(parameters_file)

    return json.dumps(parameters)

if __name__ == "__main__":
#    app.run(debug = True, threaded = True)

    HTTPServer = WSGIServer((IP_ADDRESS, PORT), app)
    HTTPServer.serve_forever()

