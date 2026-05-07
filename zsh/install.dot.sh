#!/bin/bash

# ensure that $TARGET_DIR/.zshrc.d exists and is a directory
if [ ! -d "$TARGET_DIR/.zshrc.d" ]; then
    mkdir -p "$TARGET_DIR/.zshrc.d"
fi