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

# This file has to be in the root of the server file structure
SERVER_DIRECTORY = os.path.abspath('')

MODELS_DIRECTORY = os.path.join(SERVER_DIRECTORY, "models")
USERS_DIRECTORY = os.path.join(SERVER_DIRECTORY, "static", "users")
DATABASE_PATH = os.path.join(USERS_DIRECTORY, "users.db")

IP_ADDRESS = "0.0.0.0"
PORT = 5500

app = Flask(__name__)
app.debug = False

app.config["SECRET_KEY"] = uuid.uuid4().hex
auth = flask_httpauth.HTTPBasicAuth()

def init_database(database):
    def make_dicts(cursor, row):
        return dict((cursor.description[i][0], col) for i, col in enumerate(row))

    database.row_factory = make_dicts

    database.execute(
        "CREATE TABLE IF NOT EXISTS users("
        + "username VARCHAR(29) NOT NULL PRIMARY KEY, "
        + "password VARCHAR(29) NOT NULL"
      + ')')

    try:
        # TODO: Default users
        add_user(database, "admin", "marin")
        add_user(database, "marin", "admin")
    except sqlite3.IntegrityError:
        pass

    database.commit()

def get_user_dirpath(username):
    return os.path.join(USERS_DIRECTORY, username)

# TODO: Add UI functionality
def add_user(database, username, password):
    database.execute(
        "INSERT INTO users VALUES("
        + '"' + username + '", "' + password + '"'
      + ')')

    try:
        os.mkdir(get_user_dirpath(username))
    except OSError as e:
        logging.error(e)

# TODO: Add UI functionality
def remove_user():
    db = database_connect(DATABASE_PATH)
    db.execute(
        "DELETE FROM users WHERE "
        + "username='" + username + "'"
    )

    try:
        shutil.rmtree(get_user_dirpath(auth.username()))
    except OSError as e:
        logging.error(e)

    return redirect(url_for('/'))

# TODO: Combine with fetch models metadata
@app.route("/fetch_sessions/", methods=["POST"])
def fetch_sessions():
    username = auth.username()
    model = request.form["model"]

    model_dir = os.path.join(get_user_dirpath(username), model)
    sessions = glob.glob(model_dir + "/*/")

    return json.dumps(sorted([os.path.relpath(s, model_dir) for s in sessions]))

@app.route("/create_session/", methods=["POST"])
def create_session():
    username = auth.username()
    model = request.form["model"]
    session = request.form["session"]

    model_dir = os.path.join(get_user_dirpath(username), model)

    try:
        os.makedirs(os.path.join(model_dir, session, "temp"))
    except OSError:
        pass

    return json.dumps(session)

@app.route("/save_session/", methods=["POST"])
def save_session():
    username = auth.username()
    model = request.form["model"]
    session = request.form["session"]
    step_idx = request.form["stepIdx"]

    all_params = json.loads(request.form["allParamValues"])
    completed_steps = json.loads(request.form["completedSteps"])

    model_dir = os.path.join(get_user_dirpath(username), model)
    session_dir = os.path.join(model_dir, session)
    save_dir = os.path.join(session_dir, "saved")
    temp_dir = os.path.join(session_dir, "temp")

    try:
        shutil.rmtree(save_dir, True)
    except OSError:
        pass

    try:
        shutil.copytree(temp_dir, save_dir)
    except OSError as e:
        logging.error(e)

    # Store current state of the model
    with open(os.path.join(save_dir, "metadata"), 'w') as metadata:
        json.dump({
            "completedSteps": completed_steps,
            "paramValues": all_params,

            "stepIdx": step_idx
        }, metadata)

    return json.dumps(None)

def get_plots(dirname, step_id):
    plots = glob.glob(os.path.join(dirname, step_id + "*.html"))

    plots_info = []
    for plot in plots:
        # Plot name is everything between step ID and .html
        plotName = os.path.relpath(plot, dirname).replace(step_id, '', 1)[:-5]

        plots_info.append({
            "name": plotName.replace('_', ' ').strip(),
            "path": os.path.relpath(plot, SERVER_DIRECTORY)
        })

    return sorted(plots_info, key=lambda x: x["name"])

@app.route("/load_session/", methods=["POST"])
def load_session():
    username = auth.username()
    model = request.form["model"]
    session = request.form["session"]

    model_dir = os.path.join(get_user_dirpath(username), model)
    session_dir = os.path.join(model_dir, session)
    save_dir = os.path.join(session_dir, "saved")

    try:
        with open(os.path.join(save_dir, "metadata"), 'r') as metadata:
            session_metadata = json.load(metadata)

        # There can be no plots if metadata is missing
        completed_steps = session_metadata["completedSteps"]
    except IOError as e:
        return json.dumps({})

    plots = session_metadata["plots"] = []
    logs = session_metadata["logs"] = []

    for step_id in completed_steps:
        plots.append(get_plots(save_dir, step_id))
        logs.append(get_log(save_dir, step_id))

    return json.dumps(session_metadata)

@app.route("/delete_session/", methods=["POST"])
def delete_session():
    username = auth.username()
    model = request.form["model"]
    session = request.form["session"]

    session_dir = os.path.join(get_user_dirpath(username), model, session)

    try:
        shutil.rmtree(session_dir, True)
    except OSError as e:
        # TODO: Make logging
        logging.error(e)

    return json.dumps(None)

# Restore model staet from temp, not from saved
@app.route("/restore_session/", methods=["POST"])
def restore_session():
    username = auth.username()
    model = request.form["model"]
    session = request.form["session"]

    model_dir = os.path.join(get_user_dirpath(username), model)
    session_dir = os.path.join(model_dir, session)
    temp_dir = os.path.join(session_dir, "temp")

    try:
        with open(os.path.join(temp_dir, "metadata")) as metadata:
            return metadata.readlines()
    except IOError:
        pass

    return json.dumps(None);

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

def get_log(dirpath, step_id):
    log = step_id + "_output.log"

    try:
        with open(os.path.join(dirpath, log), 'r') as output_log:
            return ''.join(output_log.readlines())
    except IOError as e:
        logging.error(e)
        return ''

@app.route("/run_model/", methods=["POST"])
def run_model():
    username = auth.username()

    # Current model progress
    model = request.form["model"]
    session = request.form["session"]

    step_id = request.form["stepId"]
    step_idx = request.form["stepIdx"]

    runParams = json.loads(request.form["runParamValues"])

    for i, param in enumerate(runParams):
        runParams[i] = str(param)

        if runParams[i] == '':
            runParams[i] = "NA"

    # Destination directory for specific user
    model_dir = os.path.join(get_user_dirpath(username), model)
    session_dir = os.path.join(model_dir, session)
    temp_dir = os.path.join(session_dir, "temp")

    # Path to the model R script
    model_script = os.path.join(MODELS_DIRECTORY, model  + ".R")

    # Run model as a separate subprocess with given parameters
    model_call = ["Rscript", model_script, temp_dir, str(step_idx)] + runParams

    with open(os.devnull, 'w') as devnull:
        retval = subprocess.call(model_call, stdout=devnull)

    result = get_log(temp_dir, step_id)
    plots = get_plots(temp_dir, step_id)

    return json.dumps({"consoleOutput": result, "plots": plots});

@app.route("/upload_csv_file/", methods=["POST"])
def upload_csv_file():
    username = auth.username()
    model = request.form["model"]
    session = request.form["session"]

    model_dir = os.path.join(get_user_dirpath(username), model)
    session_dir = os.path.join(model_dir, session)
    temp_dir = os.path.join(session_dir, "temp")

    csv_file = request.files["csvFile"]
    csv_path = os.path.join(temp_dir, csv_file.filename)

    csv_file.save(csv_path)

    try:
        with open(csv_path, 'r') as f:
            csv_fieldnames = csv.DictReader(f).fieldnames
    except IOError as e:
        logging.error(e)

    return json.dumps(csv_fieldnames)

@app.route("/fetch_csv_columns/", methods=["POST"])
def fetch_csv_column():
    username = auth.username()
    model = request.form["model"]
    session = request.form["session"]

    model_dir = os.path.join(get_user_dirpath(username), model)
    session_dir = os.path.join(model_dir, session)
    temp_dir = os.path.join(session_dir, "temp")

    filename = request.form["filename"]
    fieldnames = json.loads(request.form["fieldnames"])

    columns = {}
    with open(os.path.join(temp_dir, filename)) as f:
        for row in csv.DictReader(f):
            for fieldname, options in fieldnames.iteritems():
                value = row[fieldname]

                column_values = columns.setdefault(fieldname, set())
                if not options["unique"] or value not in column_values:
                    column_values.add(value)

    # Change set to list and sort it
    for fieldname, values in columns.iteritems():
        if fieldnames[fieldname]["sorted"]:
            columns[fieldname] = sorted(values)
        else:
            columns[fieldname] = list(values)

    return json.dumps(columns)

@app.route("/download_csv_output/", methods=["POST"])
def download_csv_output():
    return json.dumps(None)

if __name__ == "__main__":
    try:
        os.makedirs(MODELS_DIRECTORY)
    except OSError:
        pass

    try:
        os.makedirs(USERS_DIRECTORY)
    except OSError:
        pass

    app.run(debug=True, threaded=True, host="0.0.0.0", port=5500)

    HTTPServer = WSGIServer((IP_ADDRESS, PORT), app)
    HTTPServer.serve_forever()

