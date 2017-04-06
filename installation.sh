#!/bin/bash

pip2 install Flask Flask-HTTPAuth gevent || pip install Flask Flask-HTTPAuth gevent

sudo apt-get update && sudo apt-get install yarn

yarn install && yarn upgrade && yarn build

echo Server started on port 5500
./gui.py &


