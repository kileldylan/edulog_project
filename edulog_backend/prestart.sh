#!/bin/bash
set -o errexit

python manage.py makemigrations
python manage.py migrate --noinput
python manage.py collectstatic --noinput