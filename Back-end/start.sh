#!/bin/sh

if [ -d /backend ]
then
  cd /backend || exit
  psql -U kogbebou;
  npx prisma migrate dev;
  npm start;
else
  echo "backend directory doesnt exist"
fi
