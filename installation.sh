#!/bin/bash

pip2 install Flask Flask-HTTPAuth gevent || pip install Flask Flask-HTTPAuth

sudo apt-get update && sudo apt-get install yarn

yarn install && yarn update && yarn build

./gui.py &

