#!/bin/bash

sudo apt-get update
sudo apt-get install pip
sudo pip install --upgrade pip
sudo pip install Flask Flask-HTTPAuth gevent pyyaml

#TODO Install yarn and nodejs
sudo apt-get install yarn

yarn install && yarn build

echo Installation done
