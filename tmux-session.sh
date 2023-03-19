#!/bin/bash

session="warrolight"
path="~/Documents/projects/warrolight"

# Check if the session exists, discarding output
# We can check $? for the exit status (zero for success, non-zero for failure)
tmux has-session -t $session 2>/dev/null

if [ $? != 0 ]; then
  # Set up your session
  tmux new-session -d -s $session
  tmux set-option -t $session -g allow-rename off
  # server
  tmux rename-window -t $session:{end} 'server'
  tmux send-keys -t $session:{end} "cd $path/server" C-m
  tmux send-keys -t $session:{end} 'while true; do yarn start; done' C-m
  # web
  tmux new-window -t $session -n 'web'
  tmux send-keys -t $session:{end} "cd $path/web" C-m
  tmux send-keys -t $session:{end} 'BROWSER=none yarn start' C-m
  tmux select-window -t $session:{start}
fi

tmux bind S-Left  previous-window
tmux bind S-Right next-window

# Attach to created session
tmux attach-session -t $session
