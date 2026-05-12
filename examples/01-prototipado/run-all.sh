#!/bin/bash

for dir in */; do
  if [ -f "${dir}model.mad" ]; then
    echo "Procesando ${dir}..."
    node ../../packages/cli/bin/cli.js generate "${dir}model.mad" -d "${dir}code"
  fi
done