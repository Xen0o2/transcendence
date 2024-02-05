#!/bin/sh

psql -U kogbebou;
npx prisma migrate dev;
npm start;
