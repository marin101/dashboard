#!/usr/bin/env python2.7
# coding=utf-8

from gevent import monkey
monkey.patch_all()

from flask import Flask, Response, render_template, request, stream_with_context, g

from gevent.pywsgi import WSGIServer

import os
import glob
import json

MODELS_DIRECTORY = os.path.join(".", "models")

IP_ADDRESS = "0.0.0.0"
PORT = 5500

app = Flask(__name__)
app.debug = False

@app.route('/', defaults={"path": ''})
@app.route("/<path:path>/")
def index(path):
    return render_template("index.html")

@app.route("/fetch_models_metadata/", methods=["GET"])
def fetch_models_metadata():
    models = {}

    for metadata_file in glob.glob(os.path.join(MODELS_DIRECTORY, "*.json")):
        filename = os.path.relpath(metadata_file, MODELS_DIRECTORY)[:-5]

        with open(metadata_file, 'r') as metadata:
            models[filename] = json.load(metadata)

    return json.dumps(models)

# TODO: Not used for now
@app.route("/fetch_model_description/", methods=["POST"])
def fetch_model_description():
    model = json.loads(request.form["model"])

    try:
        with open(os.path.join(MODELS_DIRECTORY, model, ".json"), 'r') as f:
            description = json.load(f)
    except IOError as e:
        description = {
            "error": {
                "title": "Server IO Error",
                "body": "Some error"
            }
        }

    return json.dumps(description)

@app.route("/run_model/", methods=["POST"])
def run_model():
    model = json.loads(request.form["model"])
    print model
    parameters = json.loads(request.form["parameters"])

    print parameters
    run_model(os.path(MODELS_DIRECTORY, model), parameters)

    #TODO:
    return json.dumps(None)

if __name__ == "__main__":
    app.run(debug = True, threaded = True)

    HTTPServer = WSGIServer((IP_ADDRESS, PORT), app)
    HTTPServer.serve_forever()

