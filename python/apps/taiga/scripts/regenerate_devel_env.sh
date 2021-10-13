#!/bin/bash

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

export DJANGO_SETTINGS_MODULE=taiga.conf.taiga6

show_answer=true
while [ $# -gt 0 ]; do
  	case "$1" in
    	-y)
    	  	show_answer=false
      	;;
  	esac
	shift
done

if $show_answer ; then
	echo "WARNING!! This script will REMOVE your Taiga's database and you'll LOSE all the data."
	read -p "Are you sure you want to proceed? (Press Y to continue): " -n 1 -r
	echo    # (optional) move to a new line
	if [[ ! $REPLY =~ ^[Yy]$ ]] ; then
		exit 1
	fi
	echo
fi

read -p 'Specify a Postgres user [default: postgres]: ' dbuser
read -p 'Specify database name [default: taiga]: ' dbname
dbuser=${dbuser:-postgres}
dbname=${dbname:-taiga}

echo "-> Remove '${dbname}' DB"
dropdb -U $dbuser $dbname
echo "-> Create '${dbname}' DB"
createdb -U $dbuser $dbname

if [ "$?" -ne "0" ]; then
  echo && echo "Error accessing the database, aborting."
else
  echo "-> Load migrations"
  python -m taiga6.manage migrate
  python -m taiga6.manage createcachetable
  echo "-> Load initial user (admin/123123)"
  python -m taiga6.manage loaddata initial_user --traceback
  echo "-> Load initial project_templates (scrum/kanban)"
  python -m taiga6.manage loaddata initial_project_templates --traceback
  echo "-> Generate sample data"
  python -m taiga6.manage sample_data --traceback
  echo "-> Rebuilding timeline"
  python -m taiga6.manage rebuild_timeline --purge
fi
