#!/usr/bin/env bash

trap 'kill 0' EXIT

( cd backend && uv run uvicorn app.main:app --reload 2>&1 | awk '{ print "[backend] " $0; fflush() }' ) &
( cd frontend && npm run dev 2>&1 | awk '{ print "[frontend] " $0; fflush() }' ) &

wait
