#!/usr/bin/env python2.7
# coding=utf-8

from gevent import monkey
monkey.patch_all()

from flask import Flask, Response, render_template, request, stream_with_context, g

from gevent.pywsgi import WSGIServer

import os
import csv
import glob
import json
import yaml

import subprocess

MODELS_DIRECTORY = os.path.join(".", "models")
USERS_DIRECTORY = os.path.join(".", "users")

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

    for metadata_file in glob.glob(os.path.join(MODELS_DIRECTORY, "*.yaml")):
        filename = os.path.relpath(metadata_file, MODELS_DIRECTORY)[:-5]

        with open(metadata_file, 'r') as metadata:
            models[filename] = yaml.safe_load(metadata)

    return json.dumps(models)

# TODO: Not used for now
@app.route("/fetch_model_description/", methods=["POST"])
def fetch_model_description():
    model = json.loads(request.form["model"])

    try:
        with open(os.path.join(MODELS_DIRECTORY, model, ".json"), 'r') as f:
            description = yaml.safe_load(f)
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
    params = json.loads(request.form["parameters"])

    model_call = [os.path.join(MODELS_DIRECTORY, model + ".R")]
    model_call.extend(map(lambda x: str(x), params))


    result = subprocess.Popen(model_call, stdout=subprocess.PIPE)
    return json.dumps(result.stdout.readlines());

@app.route("/upload_CSV_file/", methods=["POST"])
def upload_CSV_file():
    CSV_filename = os.path.join(USERS_DIRECTORY, "user.csv")

    CSV_file = request.files["CSVfile"]
    CSV_file.save(CSV_filename)

    try:
        with open(CSV_filename, 'r') as f:
            csv_fieldnames = csv.DictReader(f).fieldnames
    except IOError:
        pass

    return json.dumps({"filename": CSV_filename, "fieldnames": csv_fieldnames})

@app.route("/fetch_CSV_column/", methods=["POST"])
def fetch_CSV_column():
    unique = json.loads(request.form.get("unique", json.dumps(False)))
    CSV_fieldname = json.loads(request.form["fieldname"])

    column_values = []
    with open(os.path.join(USERS_DIRECTORY, "user.csv")) as f:
        for row in csv.DictReader(f):
            value = row[CSV_fieldname]

            # TODO: Optimize
            if not unique or value not in column_values:
                column_values.append(value)

    return json.dumps(column_values)

if __name__ == "__main__":
    try:
        os.mkdir(MODELS_DIRECTORY)
    except OSError:
        pass

    try:
        os.mkdir(USERS_DIRECTORY)
    except OSError:
        pass

    app.run(debug = True, threaded = True)

    HTTPServer = WSGIServer((IP_ADDRESS, PORT), app)
    HTTPServer.serve_forever()

