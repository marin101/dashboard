#!/usr/bin/env python2.7
# coding=utf-8

from gevent import monkey
monkey.patch_all()

from flask import Flask, render_template, request, g, redirect, url_for
import flask_httpauth

from gevent.pywsgi import WSGIServer

import os
import csv
import glob
import uuid
import json
import yaml
import shutil
import sqlite3
import logging

import subprocess

MODELS_DIRECTORY = os.path.join('.', "models")
USERS_DIRECTORY = os.path.join('.', "static", "users")
DATABASE_PATH = os.path.join(USERS_DIRECTORY, "users.db")

IP_ADDRESS = "0.0.0.0"
PORT = 5500

app = Flask(__name__)
app.config["SECRET_KEY"] = uuid.uuid4().hex
app.debug = False

auth = flask_httpauth.HTTPBasicAuth()

# TODO: Add UI functionality
def add_user(database, username, password):
    database.execute(
        "INSERT INTO users VALUES("
        + '"' + username + '", "' + password + '"'
      + ')')

    try:
        os.mkdir(os.path.join(USERS_DIRECTORY, username))
    except OSError as e:
        logging.error(e)

@app.route("/remove_user/", methods=["POST"])
def remove_user():
    db = database_connect(DATABASE_PATH)
    db.execute(
        "DELETE FROM users WHERE "
        + "username='" + username + "'"
    )

    try:
        shutil.rmtree(os.path.join(USERS_DIRECTORY, username))
    except OSError as e:
        logging.error(e)

    return redirect(url_for('/'))

def init_database(database):
    def make_dicts(cursor, row):
        return dict((cursor.description[i][0], col) for i, col in enumerate(row))

    database.row_factory = make_dicts

    database.execute(
        "CREATE TABLE IF NOT EXISTS users("
        + "username VARCHAR(29) NOT NULL PRIMARY KEY, "
        + "password VARCHAR(29) NOT NULL"
      + ')')

    # TODO: Default users
    try:
        add_user(database, "admin", "marin")
        add_user(database, "marin", "admin")
    except sqlite3.IntegrityError as e:
        pass

    database.commit()

@app.route("/create_session/", methods=["POST"])
def create_session():
    session_id = request.form["model"] + '_' + uuid.uuid4().hex

    try:
        os.makedirs(os.path.join(USERS_DIRECTORY, auth.username(), session_id, "temp"))
    except OSError:
        logging.error(e)

    return json.dumps(session_id)

@app.route("/save_session/", methods=["POST"])
def save_session():
    dirpath = os.path.join(USERS_DIRECTORY, auth.username(), request.form["sessionId"])

    try:
        shutil.copytree(os.path.join(dirpath, "temp"), dirpath)
    except OSError as e:
        logging.error(e)

    return json.dumps(None)

@app.route("/delete_session/", methods=["POST"])
def delete_session():
    session_id = json.loads(request.form["sessionId"])

    try:
        shutil.rmtree(os.path.join(USERS_DIRECTORY, auth.username(), session_id), True)
    except OSError as e:
        # TODO: Make logging
        logging.error(e)

    return json.dumps(None)

def database_connect(database_path):
    db = getattr(g, "database", None)

    if db is None:
        db = g.database = sqlite3.connect(database_path)
        init_database(db)

    return db

@app.teardown_appcontext
def database_disconnect(exception):
    db = getattr(g, "database", None)

    if db is not None:
        db.close()

    if exception != None:
        return exception

@auth.get_password
def database_get_password(username):
    db = database_connect(DATABASE_PATH)

    user = db.execute(
        "SELECT * FROM users "
        + "WHERE username='" + username + "'"
    ).fetchone()

    if user is not None:
        return user.get("password")

    return None

@app.route('/', defaults={"path": ''})
@app.route("/<path:path>/")
@auth.login_required
def index(path):
    return render_template("index.html")

@app.route("/fetch_models_metadata/", methods=["GET"])
def fetch_models_metadata():
    models = {}

    for metadata_file in glob.iglob(os.path.join(MODELS_DIRECTORY, "*.yaml")):
        filename = os.path.relpath(metadata_file, MODELS_DIRECTORY)[:-5]

        with open(metadata_file, 'r') as metadata:
            models[filename] = yaml.safe_load(metadata)

    return json.dumps({"models": models, "username": auth.username()})

@app.route("/fetch_sessions/", methods=["POST"])
def fetch_sessions():
    dirname = os.path.join(USERS_DIRECTORY, auth.username())
    model = request.form["model"]

    session_paths = glob.glob(os.path.join(dirname, model) + "*/")
    return json.dumps([os.path.relpath(s, dirname) for s in session_paths])

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
    model = os.path.join(MODELS_DIRECTORY, request.form["model"] + ".R")

    user_dirname = os.path.join(USERS_DIRECTORY, auth.username())
    destination = os.path.join(user_dirname, request.form["sessionId"])

    step = json.loads(request.form["step"])

    model_call = ["Rscript", model, destination, str(step["index"])]
    model_call.extend(map(lambda x: str(x), json.loads(request.form["parameters"])))

    result = subprocess.Popen(model_call, stdout=subprocess.PIPE)

    plots = glob.glob(os.path.join(destination, step["id"].capitalize() + "*.html"))
    plots = [os.path.relpath(plot, destination)[:-5] for plot in plots]

    return json.dumps({"consoleOutput": result.stdout.readlines(), "plots": plots});

@app.route("/upload_csv_file/", methods=["POST"])
def upload_csv_file():
    user_dirname = os.path.join(USERS_DIRECTORY, auth.username())
    csv_path = os.path.join(user_dirname, request.form["sessionId"])

    csv_file = request.files["csvfile"]
    csv_file.save(os.path.join(csv_path, csv_file.filename))

    try:
        with open(os.path.join(csv_path, csv_file.filename), 'r') as f:
            csv_fieldnames = csv.DictReader(f).fieldnames
    except IOError as e:
        pass

    return json.dumps({"filename": csv_path, "fieldnames": csv_fieldnames})

@app.route("/fetch_plots/", methods=["POST"])
def fetch_plots():
    user_dirname = os.path.join(USERS_DIRECTORY, auth.username())
    destination = os.path.join(user_dirname, request.form["sessionId"])

    step_id = request.form["stepId"]

    plots = glob.glob(os.path.join(destination, step_id.capitalize() + "*.html"))
    plots = [os.path.relpath(plot, destination)[:-5] for plot in plots]

    return json.dumps(plots)

@app.route("/fetch_csv_columns/", methods=["POST"])
def fetch_csv_column():
    user_dirname = os.path.join(USERS_DIRECTORY, auth.username())

    session_id = request.form["sessionId"]

    filename = request.form["filename"]
    fieldnames = json.loads(request.form["fieldnames"])

    print filename, fieldnames
    column_values = {}
    with open(os.path.join(user_dirname, session_id, filename)) as f:
        for row in csv.DictReader(f):
            for fieldname, unique in fieldnames.iteritems():
                value = row[fieldname]

                # TODO: Optimize
                if not unique or value not in column_values.setdefault(fieldname, []):
                    column_values.setdefault(fieldname, []).append(value)

    return json.dumps(column_values)

if __name__ == "__main__":
    try:
        os.makedirs(MODELS_DIRECTORY)
    except OSError:
        pass

    try:
        os.makedirs(USERS_DIRECTORY)
    except OSError:
        pass

    app.run(debug = True, threaded = True)

    HTTPServer = WSGIServer((IP_ADDRESS, PORT), app)
    HTTPServer.serve_forever()

